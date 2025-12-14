# main.py
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import json
import uvicorn
import time
from datetime import datetime

# Import analyzers and generators
from app.team_form_analyzer import EnhancedTeamFormAnalyzer
from app.head_to_head_analyzer import EnhancedHeadToHeadAnalyzer
from app.slip_generator import SlipGenerator
from app.statistical_predictor import StatisticalPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Football Match Analysis API",
    description="API for analyzing football matches, team forms, predictions, and generating betting slips",
    version="2.1.0",  # Updated version
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize analyzers and generators
analyzer = EnhancedTeamFormAnalyzer()
h2h_analyzer = EnhancedHeadToHeadAnalyzer()
slip_generator = SlipGenerator()  # NEW INITIALIZATION
statistical_predictor = StatisticalPredictor()  # NEW INITIALIZATION

# Track API startup time
start_time = time.time()

# Request/Response Models (add new ones for slip generation)
class AnalysisRequest(BaseModel):
    match_ids: List[int]
    include_details: Optional[bool] = True

class PredictionRequest(BaseModel):
    match_ids: List[int]
    model: Optional[str] = "form_analysis"
    use_ml: Optional[bool] = True

class TeamFormRequest(BaseModel):
    team_code: str
    venue: Optional[str] = None
    limit: Optional[int] = 5

class HeadToHeadRequest(BaseModel):
    match_id: int
    generate_if_missing: Optional[bool] = True

class SlipGenerationRequest(BaseModel):
    master_slip: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None

class ExpectedValueRequest(BaseModel):
    slip_data: Dict[str, Any]

class CoverageAnalysisRequest(BaseModel):
    slips: List[Dict[str, Any]]

class ModelTrainingRequest(BaseModel):
    model_type: str
    training_data: Optional[List[Dict[str, Any]]] = None

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str
    request_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: float
    service: str
    timestamp: str

class BatchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    statistics: Dict[str, Any]
    timestamp: str

# Health Check Endpoint
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health and status"""
    return {
        "status": "healthy",
        "version": "2.1.0",
        "uptime": round(time.time() - start_time, 2),
        "service": "team_form_analyzer",
        "timestamp": datetime.now().isoformat()
    }

# Test API Connection
@app.get("/api/test", tags=["Test"])
async def test_api():
    """Test endpoint to verify API is working"""
    return {
        "message": "Football Match Analysis API is running",
        "status": "ok",
        "version": "2.1.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "analyze_match": "/api/analyze-match",
            "analyze_batch": "/api/analyze-batch",
            "generate_predictions": "/api/generate-predictions",
            "analyze_team_form": "/api/analyze-team-form",
            "analyze_head_to_head": "/api/analyze-head-to-head",
            "generate_slips": "/api/generate-slips",
            "calculate_expected_value": "/api/calculate-expected-value",
            "analyze_coverage": "/api/analyze-coverage",
            "train_model": "/api/train-model"
        }
    }

# Single Match Analysis
@app.post("/api/analyze-match", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_match_endpoint(request: AnalysisRequest):
    """
    Analyze a single match or batch of matches
    
    Example JSON body:
    {
        "match_ids": [1],
        "include_details": true
    }
    """
    try:
        if len(request.match_ids) == 0:
            return AnalysisResponse(
                success=False,
                error="No match IDs provided",
                timestamp=datetime.now().isoformat()
            )
        
        if len(request.match_ids) == 1:
            # Single match analysis
            match_id = request.match_ids[0]
            result = analyzer.analyze_match(match_id)
            
            if 'error' in result:
                return AnalysisResponse(
                    success=False,
                    error=result['error'],
                    timestamp=datetime.now().isoformat()
                )
            
            # Simplify if requested
            if not request.include_details:
                simplified = {
                    "match_id": result["match_id"],
                    "prediction": result["predictions"]["final"]["prediction"],
                    "confidence": result["predictions"]["final"]["confidence"],
                    "probabilities": result["predictions"]["final"]["probabilities"],
                    "home_team": result["match_data"]["home_team"],
                    "away_team": result["match_data"]["away_team"],
                    "league": result["match_data"]["league"],
                    "match_date": result["match_data"]["match_date"]
                }
                return AnalysisResponse(
                    success=True,
                    data=simplified,
                    timestamp=datetime.now().isoformat()
                )
            
            return AnalysisResponse(
                success=True,
                data=result,
                timestamp=datetime.now().isoformat()
            )
        else:
            # Batch analysis
            result = analyzer.batch_analyze_matches(request.match_ids)
            
            if not request.include_details:
                simplified_results = []
                for match_result in result['results']:
                    simplified_results.append({
                        "match_id": match_result["match_id"],
                        "prediction": match_result["predictions"]["final"]["prediction"],
                        "confidence": match_result["predictions"]["final"]["confidence"],
                        "probabilities": match_result["predictions"]["final"]["probabilities"],
                        "home_team": match_result["match_data"]["home_team"],
                        "away_team": match_result["match_data"]["away_team"],
                        "league": match_result["match_data"]["league"]
                    })
                
                simplified_response = {
                    "results": simplified_results,
                    "statistics": result['statistics'],
                    "errors": result['errors']
                }
                
                return AnalysisResponse(
                    success=True,
                    data=simplified_response,
                    timestamp=datetime.now().isoformat()
                )
            
            return AnalysisResponse(
                success=True,
                data=result,
                timestamp=datetime.now().isoformat()
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing matches: {str(e)}"
        )

# Generate Predictions (ML-based)
@app.post("/api/generate-predictions", response_model=AnalysisResponse, tags=["Predictions"])
async def generate_predictions(request: PredictionRequest):
    """
    Generate predictions for matches using ML models
    
    Example JSON body:
    {
        "match_ids": [1, 2, 3],
        "model": "form_analysis",
        "use_ml": true
    }
    """
    try:
        if len(request.match_ids) == 0:
            return AnalysisResponse(
                success=False,
                error="No match IDs provided",
                timestamp=datetime.now().isoformat()
            )
        
        predictions = []
        for match_id in request.match_ids:
            try:
                # Fetch match data
                match_data = analyzer.fetch_match_data(match_id)
                
                if not match_data:
                    predictions.append({
                        "match_id": match_id,
                        "error": "No data available",
                        "prediction": "unknown",
                        "confidence": 0.0
                    })
                    continue
                
                home_form = match_data.get('home_team_form', {})
                away_form = match_data.get('away_team_form', {})
                
                # Use ML prediction if requested
                if request.use_ml:
                    # Make form-based prediction
                    form_prediction = analyzer.predict_from_form(home_form, away_form)
                    
                    prediction_data = {
                        "match_id": match_id,
                        "probabilities": form_prediction.probabilities,
                        "prediction": form_prediction.prediction,
                        "confidence": form_prediction.confidence,
                        "form_advantage": form_prediction.form_advantage,
                        "momentum_advantage": form_prediction.momentum_advantage,
                        "goal_supremacy": form_prediction.goal_supremacy,
                        "model": request.model,
                        "method": "ml_form_analysis",
                        "features": form_prediction.features
                    }
                else:
                    # Use statistical prediction
                    prediction_data = statistical_predictor.predict(match_data)
                    prediction_data["match_id"] = match_id
                    prediction_data["method"] = "statistical"
                
                predictions.append(prediction_data)
                
            except Exception as e:
                predictions.append({
                    "match_id": match_id,
                    "error": str(e),
                    "prediction": "error",
                    "confidence": 0.0
                })
        
        # Calculate overall statistics
        successful_predictions = [p for p in predictions if 'error' not in p]
        
        statistics = {
            "total_matches": len(request.match_ids),
            "successful_predictions": len(successful_predictions),
            "failed_predictions": len(predictions) - len(successful_predictions),
            "avg_confidence": sum(p.get('confidence', 0) for p in successful_predictions) / len(successful_predictions) if successful_predictions else 0,
            "predictions_by_outcome": {
                "home": len([p for p in successful_predictions if p.get('prediction') == 'home']),
                "draw": len([p for p in successful_predictions if p.get('prediction') == 'draw']),
                "away": len([p for p in successful_predictions if p.get('prediction') == 'away'])
            }
        }
        
        return AnalysisResponse(
            success=True,
            data={
                "predictions": predictions,
                "statistics": statistics,
                "model": request.model,
                "use_ml": request.use_ml
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating predictions: {str(e)}"
        )

# Generate Slips - UPDATED WITH REAL IMPLEMENTATION
@app.post("/api/generate-slips", response_model=AnalysisResponse, tags=["Slips"])
async def generate_slips_endpoint(request: SlipGenerationRequest, background_tasks: BackgroundTasks):
    """
    Generate accumulator slips from a master slip
    
    Example JSON body:
    {
        "master_slip": {
            "id": 1,
            "name": "Weekend Matches",
            "matches": [
                {
                    "id": 123,
                    "home_team": "Arsenal",
                    "away_team": "Chelsea",
                    "prediction": {
                        "probabilities": {"home": 0.45, "draw": 0.30, "away": 0.25},
                        "confidence": 0.65,
                        "odds": {"home": 2.2, "draw": 3.5, "away": 3.0}
                    }
                },
                ...
            ]
        },
        "options": {
            "max_slips": 100,
            "strategies": ["monte_carlo", "coverage", "ml_prediction"],
            "risk_profile": "balanced",
            "min_odds": 1.5,
            "max_odds": 10.0
        }
    }
    """
    try:
        logger = logging.getLogger(__name__)
        logger.info(f"Starting slip generation for master slip: {request.master_slip.get('id', 'unknown')}")
        
        # Use the SlipGenerator to generate slips
        result = slip_generator.generate_slips(request.master_slip, request.options)
        
        if result['success']:
            logger.info(f"Successfully generated {len(result['slips'])} slips")
            
            return AnalysisResponse(
                success=True,
                data=result,
                timestamp=datetime.now().isoformat(),
                request_id=f"slip_{int(time.time())}"
            )
        else:
            logger.error(f"Slip generation failed: {result.get('error', 'Unknown error')}")
            
            return AnalysisResponse(
                success=False,
                error=result.get('error', 'Slip generation failed'),
                data=result.get('fallback_slips'),
                timestamp=datetime.now().isoformat()
            )
        
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating slips: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=500,
            detail=f"Error generating slips: {str(e)}"
        )

# Calculate Expected Value - NEW ENDPOINT
@app.post("/api/calculate-expected-value", response_model=AnalysisResponse, tags=["Slips"])
async def calculate_expected_value_endpoint(request: ExpectedValueRequest):
    """
    Calculate expected value for a slip
    
    Example JSON body:
    {
        "slip_data": {
            "matches": [
                {
                    "odds": 2.0,
                    "probability": 0.55,
                    "confidence": 0.7
                },
                ...
            ]
        }
    }
    """
    try:
        result = slip_generator.calculate_expected_value(request.slip_data)
        
        if 'error' in result:
            return AnalysisResponse(
                success=False,
                error=result['error'],
                timestamp=datetime.now().isoformat()
            )
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating expected value: {str(e)}"
        )

# Analyze Coverage - NEW ENDPOINT
@app.post("/api/analyze-coverage", response_model=AnalysisResponse, tags=["Slips"])
async def analyze_coverage_endpoint(request: CoverageAnalysisRequest):
    """
    Analyze coverage of generated slips
    
    Example JSON body:
    {
        "slips": [
            {
                "matches": [
                    {"match_id": 1, "prediction": "home"},
                    {"match_id": 2, "prediction": "draw"}
                ]
            },
            ...
        ]
    }
    """
    try:
        result = slip_generator.analyze_slip_coverage(request.slips)
        
        if 'error' in result:
            return AnalysisResponse(
                success=False,
                error=result['error'],
                timestamp=datetime.now().isoformat()
            )
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing coverage: {str(e)}"
        )

# Team Form Analysis
@app.post("/api/analyze-team-form", response_model=AnalysisResponse, tags=["Teams"])
async def analyze_team_form_endpoint(request: TeamFormRequest):
    """
    Analyze a team's recent form
    
    Example JSON body:
    {
        "team_code": "ARS",
        "venue": "home",
        "limit": 5
    }
    """
    try:
        form_data = analyzer.fetch_team_recent_forms(request.team_code, request.venue or "", request.limit)
        
        if not form_data:
            return AnalysisResponse(
                success=False,
                error=f"No form data available for team {request.team_code}",
                timestamp=datetime.now().isoformat()
            )
        
        # Calculate additional metrics
        matches_played = form_data.get('matches_played', 0)
        win_rate = form_data.get('wins', 0) / max(matches_played, 1)
        draw_rate = form_data.get('draws', 0) / max(matches_played, 1)
        loss_rate = form_data.get('losses', 0) / max(matches_played, 1)
        
        result = {
            "team_code": request.team_code,
            "venue": request.venue or "all",
            "limit": request.limit,
            "form_analysis": form_data,
            "form_string": form_data.get('form_string', ''),
            "key_metrics": {
                "matches_played": matches_played,
                "form_rating": form_data.get('form_rating', 5.0),
                "momentum": form_data.get('form_momentum', 0.0),
                "avg_goals_scored": form_data.get('avg_goals_scored', 0),
                "avg_goals_conceded": form_data.get('avg_goals_conceded', 0),
                "win_rate": round(win_rate, 3),
                "draw_rate": round(draw_rate, 3),
                "loss_rate": round(loss_rate, 3),
                "clean_sheets": form_data.get('clean_sheets', 0),
                "failed_to_score": form_data.get('failed_to_score', 0)
            },
            "recent_matches": form_data.get('raw_form', [])[:5]
        }
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing team {request.team_code} form: {str(e)}"
        )

# Head-to-Head Analysis
@app.post("/api/analyze-head-to-head", response_model=AnalysisResponse, tags=["Head-to-Head"])
async def analyze_head_to_head_endpoint(request: HeadToHeadRequest):
    """
    Analyze head-to-head data for a match
    
    Example JSON body:
    {
        "match_id": 1,
        "generate_if_missing": true
    }
    """
    try:
        h2h_data = analyzer.fetch_head_to_head(request.match_id)
        
        if not h2h_data and request.generate_if_missing:
            # Generate head-to-head data
            match_data = analyzer.fetch_match_data(request.match_id)
            if match_data:
                # Generate H2H data based on historical matches
                # This would require additional implementation
                pass
        
        if not h2h_data:
            return AnalysisResponse(
                success=False,
                error=f"No head-to-head data available for match {request.match_id}",
                timestamp=datetime.now().isoformat()
            )
        
        # Calculate statistics
        total_meetings = h2h_data.get('total_meetings', 0)
        home_wins = h2h_data.get('home_wins', 0)
        away_wins = h2h_data.get('away_wins', 0)
        draws = h2h_data.get('draws', 0)
        
        result = {
            "match_id": request.match_id,
            "head_to_head": h2h_data,
            "statistics": {
                "total_meetings": total_meetings,
                "home_wins": home_wins,
                "away_wins": away_wins,
                "draws": draws,
                "home_win_percentage": round((home_wins / total_meetings * 100), 2) if total_meetings > 0 else 0,
                "away_win_percentage": round((away_wins / total_meetings * 100), 2) if total_meetings > 0 else 0,
                "draw_percentage": round((draws / total_meetings * 100), 2) if total_meetings > 0 else 0,
                "form": f"{home_wins}-{draws}-{away_wins}"
            },
            "last_meetings": h2h_data.get('last_meetings', [])[:5]
        }
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing head-to-head for match {request.match_id}: {str(e)}"
        )

# Train ML Model
@app.post("/api/train-model", response_model=AnalysisResponse, tags=["ML"])
async def train_model_endpoint(request: ModelTrainingRequest, background_tasks: BackgroundTasks):
    """
    Train an ML model
    
    Example JSON body:
    {
        "model_type": "form_analysis",
        "training_data": [...]
    }
    """
    try:
        # For now, return a placeholder response
        # You'll need to implement the actual model training
        
        result = {
            "status": "training_started",
            "model_type": request.model_type,
            "message": f"Training {request.model_type} model started in background",
            "training_samples": len(request.training_data) if request.training_data else "unknown"
        }
        
        # In a real implementation, you would:
        # 1. Prepare training data
        # 2. Train the model
        # 3. Save the model
        # 4. Return training results
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat(),
            request_id=f"train_{int(time.time())}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error training model: {str(e)}"
        )

# Batch Analysis (legacy endpoint, maintained for backward compatibility)
@app.post("/api/analyze-batch", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_batch_endpoint(request: AnalysisRequest):
    """
    Analyze multiple matches in batch (legacy endpoint)
    
    Example JSON body:
    {
        "match_ids": [1, 2, 3, 4, 5],
        "include_details": true
    }
    """
    return await analyze_match_endpoint(request)

# Form Comparison Endpoint (legacy endpoint)
@app.get("/api/compare/{match_id}", response_model=AnalysisResponse, tags=["Analysis"])
async def compare_forms_endpoint(match_id: int):
    """
    Get detailed form comparison for a match (legacy endpoint)
    """
    try:
        match_data = analyzer.fetch_match_data(match_id)
        
        if not match_data:
            return AnalysisResponse(
                success=False,
                error=f"No data available for match {match_id}",
                timestamp=datetime.now().isoformat()
            )
        
        home_form = match_data.get('home_team_form', {})
        away_form = match_data.get('away_team_form', {})
        
        comparison = analyzer.calculate_form_comparison(home_form, away_form)
        
        result = {
            "match_id": match_id,
            "home_team": match_data.get('home_team'),
            "away_team": match_data.get('away_team'),
            "home_form_summary": analyzer.extract_key_form_metrics(home_form),
            "away_form_summary": analyzer.extract_key_form_metrics(away_form),
            "comparison": comparison
        }
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error comparing forms for match {match_id}: {str(e)}"
        )

# ML Features Endpoint (legacy endpoint)
@app.get("/api/ml-features/{match_id}", response_model=AnalysisResponse, tags=["ML"])
async def get_ml_features_endpoint(match_id: int):
    """
    Extract ML-ready features for a match (legacy endpoint)
    """
    try:
        match_data = analyzer.fetch_match_data(match_id)
        
        if not match_data:
            return AnalysisResponse(
                success=False,
                error=f"No data available for match {match_id}",
                timestamp=datetime.now().isoformat()
            )
        
        home_form = match_data.get('home_team_form', {})
        away_form = match_data.get('away_team_form', {})
        home_team = match_data.get('home_team_details', {})
        away_team = match_data.get('away_team_details', {})
        head_to_head = match_data.get('head_to_head', {})
        
        features = analyzer.prepare_ml_features(
            home_form, away_form, home_team, away_team, head_to_head
        )
        
        result = {
            "match_id": match_id,
            "features": features,
            "feature_count": len(features),
            "home_team": match_data.get('home_team'),
            "away_team": match_data.get('away_team')
        }
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting ML features for match {match_id}: {str(e)}"
        )

# Head-to-Head Prediction Endpoint (from h2h analyzer)
@app.get("/api/h2h/predict/{match_id}", response_model=AnalysisResponse, tags=["Head-to-Head"])
async def get_h2h_prediction_endpoint(match_id: int):
    """
    Get head-to-head prediction for a match
    """
    try:
        prediction = h2h_analyzer.generate_comprehensive_prediction(match_id)

        if prediction.prediction == "error":
            return AnalysisResponse(
                success=False,
                error=prediction.reasoning[0] if prediction.reasoning else "H2H prediction error",
                timestamp=datetime.now().isoformat()
            )

        result = {
            "match_id": match_id,
            "prediction": prediction.prediction,
            "confidence": prediction.confidence,
            "trend": prediction.trend,
            "weight_factor": prediction.weight_factor,
            "statistics": prediction.statistics,
            "reasoning": prediction.reasoning,
            "raw_data": prediction.raw_data
        }
        
        return AnalysisResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in H2H prediction for match {match_id}: {str(e)}"
        )

# Configuration endpoint
@app.get("/api/config", tags=["Configuration"])
async def get_configuration():
    """Get current analyzer configuration"""
    return {
        "api_base_url": analyzer.api_base_url,
        "feature_weights": analyzer.feature_weights,
        "ml_parameters": analyzer.ml_params,
        "slip_generator_config": {
            "strategies": slip_generator.strategies,
            "risk_profiles": list(slip_generator.risk_profiles.keys()),
            "default_options": slip_generator.default_options
        },
        "service": {
            "name": "Football Match Analysis API",
            "version": "2.1.0",
            "port": 5000
        },
        "timestamp": datetime.now().isoformat()
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Football Match Analysis API",
        "version": "2.1.0",
        "description": "Analyze football matches, generate predictions, and create betting slips",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "docs": "/docs",
            "test": "/api/test",
            "analyze_match": "/api/analyze-match",
            "generate_predictions": "/api/generate-predictions",
            "analyze_team_form": "/api/analyze-team-form",
            "analyze_head_to_head": "/api/analyze-head-to-head",
            "generate_slips": "/api/generate-slips",
            "calculate_expected_value": "/api/calculate-expected-value",
            "analyze_coverage": "/api/analyze-coverage",
            "train_model": "/api/train-model"
        },
        "usage_example": {
            "single_match_analysis": "POST /api/analyze-match with JSON body: {\"match_ids\": [123]}",
            "generate_predictions": "POST /api/generate-predictions with JSON body: {\"match_ids\": [1,2,3], \"model\": \"form_analysis\"}",
            "team_form_analysis": "POST /api/analyze-team-form with JSON body: {\"team_code\": \"ARS\", \"venue\": \"home\"}",
            "generate_slips": "POST /api/generate-slips with JSON body containing master slip and options"
        }
    }

if __name__ == "__main__":
    print("=" * 60)
    print("Football Match Analysis API")
    print("Version: 2.1.0")
    print("Port: 5000")
    print("=" * 60)
    print(f"API Base URL configured to: {analyzer.api_base_url}")
    print("\nAvailable endpoints:")
    print("  http://localhost:5000/                     - API information")
    print("  http://localhost:5000/docs                 - Interactive API documentation")
    print("  http://localhost:5000/api/health           - Health check")
    print("  http://localhost:5000/api/analyze-match    - Analyze match(es)")
    print("  http://localhost:5000/api/generate-predictions - Generate predictions")
    print("  http://localhost:5000/api/analyze-team-form    - Team form analysis")
    print("  http://localhost:5000/api/analyze-head-to-head - Head-to-head analysis")
    print("  http://localhost:5000/api/generate-slips   - Generate betting slips")
    print("  http://localhost:5000/api/calculate-expected-value - Calculate slip expected value")
    print("  http://localhost:5000/api/analyze-coverage - Analyze slip coverage")
    print("  http://localhost:5000/api/train-model      - Train ML models")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all network interfaces
        port=5000,       # Port 5000 as requested
        reload=True,     # Auto-reload on code changes
        log_level="info"
    )