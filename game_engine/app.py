# game_engine/app.py

import uvicorn
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import logging
import os

# Modular imports using the package structure we established
from .schemas import MasterSlipRequest, EngineResponse
from .engine import SlipBuilder
from .utils import EngineHelpers



# --- LOGGING SETUP ---
if not os.path.exists("logs"):
    os.makedirs("logs")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs/engine.log"), # Writes to file
        logging.StreamHandler()                # Also prints to terminal
    ]
)
logger = logging.getLogger("game_engine")

app = FastAPI(
    title="Football Game Engine",
    description="Quantitative Match Analysis & Portfolio Generation Service",
    version="1.1.0"
)
# Global instance of the orchestrator to keep the service warm and fast
builder = SlipBuilder()

@app.middleware("http")

async def log_requests(request: Request, call_next):
    """
    Middleware to calculate processing time. 
    Laravel reads the 'X-Process-Time' header to monitor engine load.
    """
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"Path: {request.url.path} | Duration: {duration:.4f}s | Status: {response.status_code}")
    return response
    """
    Main Entry Point for the Laravel Orchestrator.
    
    1. Receives complex Master Slip JSON.
    2. Triggers Poisson Probability & Monte Carlo Simulations.
    3. Returns 100 optimized and ranked slips.
    """

@app.post("/generate-slips", response_model=EngineResponse)
async def generate_slips(payload: MasterSlipRequest):
    try:
        master_id = payload.master_slip.master_slip_id
        logger.info(f"Processing Master Slip: {master_id}")

        # Run the core slip generation (Monte Carlo + coverage optimization)
        generated_slips = builder.generate(payload)

        return {
            "master_slip_id": master_id,
            "generated_slips": generated_slips
        }

    except ValueError as ve:
        # Client-side issues (e.g., invalid payload, zero odds, empty matches)
        logger.warning(f"Validation error for Master Slip {payload.master_slip.master_slip_id}: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        # Unexpected internal errors
        timestamp = EngineHelpers.get_timestamp()
        logger.error(
            f"[{timestamp}] CRITICAL ERROR on Master Slip {payload.master_slip.master_slip_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="The analytical engine encountered a computational exception."
        )
    
@app.get("/health")
async def health_check():
    """Simple endpoint for Docker/Kubernetes or Laravel to check if the engine is alive."""
    return {"status": "online", "engine_version": "1.1.0"}

if __name__ == "__main__":
    # Running on 0.0.0.0 makes the service accessible inside Docker or local networks
    uvicorn.run("game_engine.app:app", host="0.0.0.0", port=5000, reload=True)