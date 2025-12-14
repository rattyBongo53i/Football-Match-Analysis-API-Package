# # app/db/models/__init__.py
# """
# SQLAlchemy models for the Accumulator Generator.
# """

# # Import Base from database
# from app.database import Base

# # Import BaseModel
# from app.db.models.base import BaseModel

# # Import all models
# from app.db.models.match import Match, HeadToHead, TeamForm
# from app.db.models.market import Market, MarketOutcome, MatchMarket
# from app.db.models.user import User, Project, CoverageScenario, StakeAllocation
# from app.db.models.slip import BetSlip, SlipMatch, GenerationJob
# from app.db.models.ml import MLModel, Prediction, HistoricalResult

# # Export everything
# __all__ = [
#     # Base classes
#     'Base',  # <-- ADD THIS
#     'BaseModel',
    
#     # Models
#     'Match', 'HeadToHead', 'TeamForm',
#     'Market', 'MarketOutcome', 'MatchMarket',
#     'User', 'Project', 'CoverageScenario', 'StakeAllocation',
#     'BetSlip', 'SlipMatch', 'GenerationJob',
#     'MLModel', 'Prediction', 'HistoricalResult'
# ]

# add the slip model

# app/db/models/__init__.py
"""
Database models package.
"""
# Import all models here
from .base import Base
from .match import Match
from .slip import Slip
from .market import Market
from .user import User
from .ml import MLModel, Prediction

__all__ = [
    "Base",
    "Match", 
    "Slip",
    "Market",
    "User",
    "MLModel",
    "Prediction"
]