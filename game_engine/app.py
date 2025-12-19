# game_engine/app.py

import uvicorn
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

# Modular imports using the package structure we established
from .schemas import MasterSlipRequest, EngineResponse
from .engine import SlipBuilder
from .utils import EngineHelpers

app = FastAPI(
    title="Football Game Engine",
    description="Quantitative Match Analysis & Portfolio Generation Service",
    version="1.1.0"
)

# Global instance of the orchestrator to keep the service warm and fast
builder = SlipBuilder()

@app.middleware("http")
async def add_performance_metrics(request: Request, call_next):
    """
    Middleware to calculate processing time. 
    Laravel reads the 'X-Process-Time' header to monitor engine load.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response

@app.post("/generate-slips", response_model=EngineResponse)
async def generate_slips(payload: MasterSlipRequest):
    """
    Main Entry Point for the Laravel Orchestrator.
    
    1. Receives complex Master Slip JSON.
    2. Triggers Poisson Probability & Monte Carlo Simulations.
    3. Returns 100 optimized and ranked slips.
    """
    try:
        # Extract the inner data for logging/tracking
        master_id = payload.master_slip.master_slip_id
        
        # Start the generation pipeline
        # builder.generate handles the 10,000 simulations and coverage logic
        generated_slips = builder.generate(payload)
        
        # Map back to the EngineResponse schema
        return {
            "master_slip_id": master_id,
            "generated_slips": generated_slips
        }

    except ValueError as ve:
        # Catch logic/validation errors (e.g., empty matches or zero odds)
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        # Log critical failures with a timestamp for server-side debugging
        timestamp = EngineHelpers.get_timestamp()
        print(f"[{timestamp}] CRITICAL ERROR on Slip {payload.master_slip.master_slip_id}: {str(e)}")
        
        # We hide specific tracebacks from the client for security, 
        # returning a clean 500 error instead.
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