from pydantic import BaseModel, validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class GeneratorRequest(BaseModel):
    master_slip_id: int
    num_candidates: int = 100
    swap_probability: float = 0.3
    target_coverage: float = 0.8
    max_scenarios: int = 1000
    job_type: str = "coverage_optimization"
    monte_carlo_iterations: int = 10000
    
    @validator('swap_probability')
    def validate_swap_probability(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Swap probability must be between 0 and 1')
        return v
    
    @validator('target_coverage')
    def validate_target_coverage(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Target coverage must be between 0 and 1')
        return v

class GeneratorResponse(BaseModel):
    job_id: int
    status: str
    message: str
    master_slip_id: int
    created_at: datetime

class GenerationJobResponse(BaseModel):
    id: int
    slip_id: Optional[int]
    job_type: str
    status: str
    parameters: Dict[str, Any]
    result_summary: Optional[Dict[str, Any]]
    generated_slip_ids: List[int]
    generated_slips: List[Any] = []
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime

class BetSlipResponse(BaseModel):
    id: int
    name: str
    status: str
    total_odds: float
    total_stake: float
    confidence_score: float
    coverage_score: float
    generation_type: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class CoverageScenarioResponse(BaseModel):
    id: int
    slip_id: int
    scenario_hash: str
    outcomes: Dict[str, Any]
    probability: float
    is_covered: bool
    covering_slip_ids: List[int]
    created_at: datetime

# Match schemas
class MatchBase(BaseModel):
    home_team: str
    away_team: str
    league: Optional[str] = None
    match_date: Optional[datetime] = None
    home_odds: Optional[float] = None
    draw_odds: Optional[float] = None
    away_odds: Optional[float] = None
    status: Optional[str] = "scheduled"

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    match_date: Optional[datetime] = None
    home_odds: Optional[float] = None
    draw_odds: Optional[float] = None
    away_odds: Optional[float] = None
    status: Optional[str] = None

class MatchResponse(MatchBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Head-to-head schemas
class HeadToHeadBase(BaseModel):
    result: Dict[str, Any]

class HeadToHeadCreate(HeadToHeadBase):
    pass

class HeadToHeadResponse(HeadToHeadBase):
    id: int
    match_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Team form schemas
class TeamFormBase(BaseModel):
    team_type: Optional[str] = None
    form: Dict[str, Any]

class TeamFormCreate(TeamFormBase):
    pass

class TeamFormResponse(TeamFormBase):
    id: int
    match_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Market schemas
class MarketBase(BaseModel):
    category: str
    name: str
    code: str
    description: Optional[str] = None
    is_active: Optional[bool] = True
    min_odds: Optional[float] = None
    max_odds: Optional[float] = None
    sort_order: Optional[int] = None

class MarketCreate(MarketBase):
    pass

class MarketUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    min_odds: Optional[float] = None
    max_odds: Optional[float] = None
    sort_order: Optional[int] = None

class MarketResponse(MarketBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Market outcome schemas
class MarketOutcomeBase(BaseModel):
    outcome_name: Optional[str] = None
    outcome_label: Optional[str] = None
    odds_column: Optional[str] = None
    is_default: Optional[bool] = False
    sort_order: Optional[int] = None

class MarketOutcomeCreate(MarketOutcomeBase):
    pass

class MarketOutcomeUpdate(BaseModel):
    outcome_name: Optional[str] = None
    outcome_label: Optional[str] = None
    odds_column: Optional[str] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None

class MarketOutcomeResponse(MarketOutcomeBase):
    id: int
    market_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Match market schemas
class MatchMarketBase(BaseModel):
    market_id: int
    odds: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None

class MatchMarketCreate(MatchMarketBase):
    pass

class MatchMarketResponse(MatchMarketBase):
    id: int
    match_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Bet slip schemas
class BetSlipBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    master_slip_id: Optional[int] = None
    status: Optional[str] = "draft"
    total_odds: Optional[float] = None
    total_stake: Optional[float] = None
    potential_return: Optional[float] = None
    confidence_score: Optional[float] = None
    coverage_score: Optional[float] = None
    generation_type: Optional[str] = None

class BetSlipCreate(BetSlipBase):
    matches: Optional[List[Dict[str, Any]]] = []  # For bulk creation

class BetSlipUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    status: Optional[str] = None
    total_stake: Optional[float] = None
    confidence_score: Optional[float] = None
    coverage_score: Optional[float] = None
    generation_type: Optional[str] = None

class BetSlipResponse(BetSlipBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class BetSlipWithMatchesResponse(BetSlipResponse):
    slip_matches: List[Any] = []
    
    class Config:
        orm_mode = True

# Slip match schemas
class SlipMatchBase(BaseModel):
    match_id: int
    selected_market_id: Optional[int] = None
    selected_outcome: Optional[str] = None
    selected_odds: Optional[float] = None
    confidence: Optional[float] = None
    is_swappable: Optional[bool] = True
    swap_priority: Optional[int] = 1

class SlipMatchCreate(SlipMatchBase):
    pass

class SlipMatchUpdate(BaseModel):
    selected_market_id: Optional[int] = None
    selected_outcome: Optional[str] = None
    selected_odds: Optional[float] = None
    confidence: Optional[float] = None
    is_swappable: Optional[bool] = None
    swap_priority: Optional[int] = None
    position: Optional[int] = None

class SlipMatchResponse(SlipMatchBase):
    id: int
    slip_id: int
    position: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    __all__ = [
    "GeneratorRequest",
    "GeneratorResponse",
    "GenerationJobResponse",
    "BetSlipResponse",
    "BetSlipWithMatchesResponse",
    "MatchResponse",
    "HeadToHeadResponse",
    "TeamFormResponse",
    "MarketResponse",
    "MarketOutcomeResponse",
    "MatchMarketResponse",
    "SlipMatchResponse",
    "UserResponse",
    ]