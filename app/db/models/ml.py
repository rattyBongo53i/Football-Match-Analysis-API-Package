# app/db/models/ml.py
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Float, DateTime, JSON
from sqlalchemy.orm import relationship  # Correct import
from app.db.models.base import BaseModel

class MLModel(BaseModel):
    __tablename__ = "ml_models"
    
    name = Column(String(100), nullable=False)
    version = Column(String(50))
    model_type = Column(String(50))
    path = Column(Text, nullable=False)
    metrics = Column(JSON)
    features_used = Column(JSON)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    predictions = relationship("Prediction", back_populates="model", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MLModel {self.name}:{self.version}>"

class Prediction(BaseModel):
    __tablename__ = "predictions"
    
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    model_id = Column(Integer, ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    outcomes = Column(JSON, nullable=False)
    confidence = Column(Float)
    
    # Relationships
    match = relationship("Match", back_populates="predictions")
    model = relationship("MLModel", back_populates="predictions")
    market = relationship("Market")
    
    def __repr__(self):
        return f"<Prediction for match_id={self.match_id}>"

class HistoricalResult(BaseModel):
    __tablename__ = "historical_results"
    
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="SET NULL"))
    home_team = Column(String(100))
    away_team = Column(String(100))
    league = Column(String(100))
    match_date = Column(DateTime)
    result = Column(JSON, nullable=False)
    odds_data = Column(JSON)
    
    def __repr__(self):
        return f"<HistoricalResult {self.home_team} vs {self.away_team}>"