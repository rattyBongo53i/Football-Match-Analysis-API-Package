from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MarketSelection(BaseModel):
    market: str
    selection: str
    odds: float

class MatchData(BaseModel):
    match_id: int
    home_team: str
    away_team: str
    team_form: Optional[Dict[str, Any]] = None
    head_to_head: Optional[Dict[str, Any]] = None
    markets: List[MarketSelection]

class MasterSlipRequest(BaseModel):
    master_slip_id: int
    stake: float
    matches: List[MatchData]

class SlipLeg(BaseModel):
    match_id: int
    market: str
    selection: str
    odds: float

class GeneratedSlip(BaseModel):
    slip_id: str
    stake: float
    total_odds: float
    possible_return: float
    legs: List[SlipLeg]
    confidence_score: float

class EngineResponse(BaseModel):
    master_slip_id: int
    generated_slips: List[GeneratedSlip]