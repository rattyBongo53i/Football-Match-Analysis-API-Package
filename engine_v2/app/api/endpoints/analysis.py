from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, Any, List
import time
import logging
import uuid

from app.models.schemas import AnalysisRequest, AnalysisResponse, AlternativeSlip
from app.services.monte_carlo import MonteCarloAnalyzer, MonteCarloConfig
from app.services.prediction import PredictionService
from app.services.coverage_optimization import CoverageOptimizer
from app.services.slip_generator import SlipGenerator
from app.services.ev_calculator import EVCalculator
from app.utils.validation import validate_analysis_request
from app.utils.logger import log_analysis_request

logger = logging.getLogger(__name__)
router = APIRouter()

# Service instances (could be dependency injected)
monte_carlo = MonteCarloAnalyzer(MonteCarloConfig(simulations=10000))
prediction_service = PredictionService()
coverage_optimizer = CoverageOptimizer()
slip_generator = SlipGenerator()
ev_calculator = EVCalculator()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_slip(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
) -> AnalysisResponse:
    """
    Main analysis endpoint for football betting slips
    
    This endpoint:
    1. Validates the request data
    2. Performs Monte Carlo simulations
    3. Runs ML predictions
    4. Generates alternative slips
    5. Calculates expected values
    6. Returns analyzed results
    """
    start_time = time.time()
    
    try:
        # Log the request
        log_analysis_request(request)
        
        # Validate request
        validation_errors = validate_analysis_request(request)
        if validation_errors:
            raise HTTPException(status_code=422, detail={"validation_errors": validation_errors})
        
        logger.info(f"Starting analysis for master slip: {request.master_slip_id}")
        
        # Convert request to dict for processing
        request_dict = request.dict()
        
        # Step 1: Monte Carlo simulation
        logger.info("Running Monte Carlo simulations...")
        mc_results = monte_carlo.simulate_slip(request_dict["matches"], request_dict["stake"])
        
        # Step 2: ML predictions (if requested)
        if request.prediction_type != "monte_carlo":
            logger.info("Running ML predictions...")
            ml_predictions = await prediction_service.predict_matches(request_dict["matches"])
            mc_results.update({"ml_predictions": ml_predictions})
        
        # Step 3: Generate alternative slips
        logger.info("Generating alternative slips...")
        alternatives = monte_carlo.generate_alternative_slips(
            request_dict,
            num_alternatives=10
        )
        
        # Step 4: Optimize coverage
        logger.info("Optimizing market coverage...")
        optimized_slips = coverage_optimizer.optimize_slips(alternatives)
        
        # Step 5: Calculate expected values
        logger.info("Calculating expected values...")
        analyzed_slips = []
        for slip in optimized_slips:
            ev_analysis = ev_calculator.analyze_slip(slip)
            analyzed_slip = {
                **slip,
                "expected_value": ev_analysis["expected_value"],
                "risk_adjusted_return": ev_analysis["risk_adjusted_return"],
                "sharpe_ratio": ev_analysis["sharpe_ratio"],
                "recommendations": ev_analysis["recommendations"],
            }
            analyzed_slips.append(analyzed_slip)
        
        # Step 6: Format response
        generated_slips = []
        for i, slip in enumerate(analyzed_slips[:5]):  # Return top 5
            generated_slips.append(
                AlternativeSlip(
                    slip_id=f"{request.master_slip_id}_ALT_{i+1:03d}",
                    total_odds=slip["total_odds"],
                    possible_return=slip["possible_return"],
                    confidence_score=slip["confidence_score"],
                    risk_level=slip["risk_level"],
                    legs=slip["match_results"],
                    expected_value=slip["expected_value"],
                    recommendations=slip["recommendations"],
                )
            )
        
        processing_time = time.time() - start_time
        
        # Add to background tasks if processing took too long
        if processing_time > 5:
            background_tasks.add_task(log_long_running_analysis, request.master_slip_id, processing_time)
        
        logger.info(f"Analysis completed for {request.master_slip_id} in {processing_time:.2f}s")
        
        return AnalysisResponse(
            success=True,
            master_slip_id=request.master_slip_id,
            generated_slips=generated_slips,
            analysis_metadata={
                "processing_time": processing_time,
                "simulations": mc_results["simulations"],
                "prediction_type": request.prediction_type,
                "risk_profile": request.risk_profile,
                "matches_analyzed": len(request.matches),
                "alternatives_generated": len(analyzed_slips),
            },
            processing_time=processing_time,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed for {request.master_slip_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error during analysis",
                "master_slip_id": request.master_slip_id,
                "timestamp": time.time(),
            }
        )

async def log_long_running_analysis(master_slip_id: str, processing_time: float):
    """Log long-running analyses for monitoring"""
    logger.warning(
        f"Long analysis processing: {master_slip_id} took {processing_time:.2f}s"
    )

@router.get("/analysis/{master_slip_id}/status")
async def get_analysis_status(master_slip_id: str):
    """Get analysis status for a master slip"""
    # In a real implementation, this would check a job queue or database
    return {
        "master_slip_id": master_slip_id,
        "status": "completed",  # Would be dynamic
        "last_updated": time.time(),
        "estimated_completion": None,
    }