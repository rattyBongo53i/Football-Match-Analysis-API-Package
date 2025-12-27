# api/v1/analysis.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict
import uuid
from app.services.simulation.monte_carlo import MonteCarloSimulator
from app.tasks.simulation_tasks import process_simulation_task
from app.core.dependencies import get_simulation_service

router = APIRouter()

@router.post("/analyze/batch")
async def analyze_betslip_batch(
    payload: Dict,
    background_tasks: BackgroundTasks,
    simulator: MonteCarloSimulator = Depends(get_simulation_service)
):
    """
    Endpoint for batch analysis - returns immediately with job ID
    """
    job_id = str(uuid.uuid4())
    
    # Queue the heavy computation
    background_tasks.add_task(
        process_simulation_task,
        job_id=job_id,
        payload=payload,
        simulator=simulator
    )
    
    return {
        "job_id": job_id,
        "status": "queued",
        "estimated_completion": "15-30 seconds",
        "websocket_channel": f"results:{job_id}"
    }