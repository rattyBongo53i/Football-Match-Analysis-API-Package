from fastapi import FastAPI, HTTPException
from .schemas import MasterSlipRequest, EngineResponse
from .engine.slip_builder import SlipBuilder
# 
from .engine import SlipBuilder, ProbabilityEngine

app = FastAPI(title="Football Game Engine")
builder = SlipBuilder()

@app.post("/generate-slips", response_model=EngineResponse)
async def generate_slips(payload: MasterSlipRequest):
    """
    The main analytical entry point.
    Flow: Laravel -> Validation -> Simulation -> Optimization -> Result
    """
    try:
        # Perform calculations
        generated = builder.generate(payload)
        
        return {
            "master_slip_id": payload.master_slip_id,
            "generated_slips": generated
        }
    except Exception as e:
        # Production-grade error handling
        # This ensures the engine doesn't crash on malformed data
        raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Running on Port 5000 as requested
    uvicorn.run(app, host="0.0.0.0", port=5000)