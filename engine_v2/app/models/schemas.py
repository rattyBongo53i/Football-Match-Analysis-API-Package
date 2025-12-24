from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RiskProfile(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class PredictionType(str, Enum):
    MONTE_CARLO = "monte_carlo"
    MACHINE_LEARNING = "machine_learning"
    ENSEMBLE = "ensemble"

class TeamForm(BaseModel):
    form_string: str = Field(..., max_length=10)
    matches_played: int = Field(..., ge=0)
    wins: int = Field(..., ge=0)
    draws: int = Field(..., ge=0)
    losses: int = Field(..., ge=0)
    avg_goals_scored: float = Field(..., ge=0)
    avg_goals_conceded: float = Field(..., ge=0)
    form_rating: float = Field(..., ge=0, le=10)
    form_momentum: str
    
    @validator('form_string')
    def validate_form_string(cls, v):
        allowed_chars = {'W', 'D', 'L'}
        if not all(c in allowed_chars for c in v):
            raise ValueError(f'Form string must contain only W, D, L characters')
        return v

class HeadToHead(BaseModel):
    total_matches: int = Field(..., ge=0)
    home_wins: int = Field(..., ge=0)
    away_wins: int = Field(..., ge=0)
    draws: int = Field(..., ge=0)
    avg_goals_per_match: float = Field(..., ge=0)
    last_meetings: List[Dict[str, Any]]

class MarketOption(BaseModel):
    selection: str
    odds: float = Field(..., gt=1.0)
    implied_probability: float = Field(..., gt=0, lt=1)

class MatchInput(BaseModel):
    match_id: str
    league: str
    home_team: str
    away_team: str
    match_date: datetime
    home_form: TeamForm
    away_form: TeamForm
    head_to_head: HeadToHead
    selected_market: MarketOption
    available_markets: List[MarketOption]
    model_inputs: Dict[str, Any]
    
    @validator('selected_market')
    def validate_selected_market(cls, v, values):
        if 'available_markets' in values:
            selections = [m.selection for m in values['available_markets']]
            if v.selection not in selections:
                raise ValueError('Selected market must be in available markets')
        return v

class AnalysisRequest(BaseModel):
    master_slip_id: str
    stake: float = Field(..., gt=0)
    currency: str = Field(default="EUR", max_length=3)
    matches: List[MatchInput] = Field(..., min_items=2, max_items=20)
    prediction_type: PredictionType = Field(default=PredictionType.ENSEMBLE)
    risk_profile: RiskProfile = Field(default=RiskProfile.MEDIUM)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('matches')
    def validate_unique_matches(cls, v):
        match_ids = [m.match_id for m in v]
        if len(match_ids) != len(set(match_ids)):
            raise ValueError('Match IDs must be unique')
        return v

class AlternativeSlip(BaseModel):
    slip_id: str
    total_odds: float = Field(..., gt=1.0)
    possible_return: float = Field(..., gt=0)
    confidence_score: float = Field(..., ge=0, le=100)
    risk_level: RiskProfile
    legs: List[Dict[str, Any]]
    expected_value: float
    recommendations: List[str]
    
class AnalysisResponse(BaseModel):
    success: bool
    master_slip_id: str
    generated_slips: List[AlternativeSlip]
    analysis_metadata: Dict[str, Any]
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)