# game_engine/schemas.py

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class MarketOption(BaseModel):
    selection: Optional[str] = None
    score: Optional[str] = None
    handicap: Optional[str] = None
    odds: float
    implied_probability: float

class FullMarket(BaseModel):
    market_name: str
    options: List[MarketOption]

class SelectedMarket(BaseModel):
    market_type: str
    selection: str
    odds: float
    implied_probability: float
    confidence_rating: float

class MatchModelInputs(BaseModel):
    home_form_weight: float
    away_form_weight: float
    h2h_weight: float
    venue_advantage: float
    expected_goals: float # Required for the Poisson calculation
    home_xg: float
    away_xg: float
    volatility_score: float

class MatchData(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    # Made these Optional so the request doesn't fail if they are missing
    home_form: Optional[Dict[str, Any]] = None
    away_form: Optional[Dict[str, Any]] = None
    head_to_head: Optional[Dict[str, Any]] = None
    selected_market: SelectedMarket
    full_markets: List[FullMarket]
    model_inputs: MatchModelInputs

class MasterSlipData(BaseModel):
    master_slip_id: str
    stake: float
    currency: str
    risk_profile: str
    matches: List[MatchData]

class MasterSlipRequest(BaseModel):
    master_slip: MasterSlipData

# Output Schemas remain the same
class SlipLeg(BaseModel):
    match_id: str
    market: str
    selection: str
    odds: float

class GeneratedSlip(BaseModel):
    slip_id: str
    stake: float
    total_odds: float
    possible_return: float
    risk_level: str
    legs: List[SlipLeg]
    confidence_score: float

class EngineResponse(BaseModel):
    master_slip_id: str
    generated_slips: List[GeneratedSlip]