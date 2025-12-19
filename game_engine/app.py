# game_engine/app.py

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import time

# Internal modular imports
from .schemas import MasterSlipRequest, EngineResponse
from .engine import SlipBuilder
from .utils import EngineHelpers

app = FastAPI(
    title="Football Game Engine",
    description="High-performance Monte Carlo & Coverage Optimizer for Betting Slips",
    version="1.0.0"
)

# Instantiate the orchestrator once (Warm start)
builder = SlipBuilder()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Adds a processing time header to help Laravel monitor Python performance."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.post("/generate-slips", response_model=EngineResponse)
async def generate_slips(payload: MasterSlipRequest):
    """
    Primary Endpoint: Laravel -> Python -> Laravel
    
    1. Receives Master Slip (JSON)
    2. Validates types via Pydantic
    3. Runs Analysis Engine
    4. Returns 100 Optimized/Hedged Slips
    """
    try:
        # Start the generation process
        # This one call triggers probability blending, MC simulations, 
        # coverage distribution, and scoring/ranking.
        slips = builder.generate(payload)
        
        return {
            "master_slip_id": payload.master_slip_id,
            "generated_slips": slips
        }

    except ValueError as ve:
        # Catch validation/data issues (e.g., missing odds)
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        # Log the timestamped error for debugging
        error_time = EngineHelpers.get_timestamp()
        print(f"[{error_time}] CRITICAL ENGINE ERROR: {str(e)}")
        
        # Return a clean 500 error to Laravel
        raise HTTPException(
            status_code=500, 
            detail="The engine encountered a computational error."
        )

if __name__ == "__main__":
    # Ensure it runs on the port specified by the architecture
    uvicorn.run(app, host="0.0.0.0", port=5000)