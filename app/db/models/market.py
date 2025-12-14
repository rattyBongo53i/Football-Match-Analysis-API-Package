# app/db/models/market.py
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, ForeignKey
from sqlalchemy.dialects.mysql import JSON  # <-- ADD THIS IMPORT
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Market(BaseModel):
    __tablename__ = "markets"
    
    category = Column(String(50), nullable=False)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    min_odds = Column(Float)
    max_odds = Column(Float)
    sort_order = Column(Integer)
    
    # Relationships
    outcomes = relationship("MarketOutcome", back_populates="market", cascade="all, delete-orphan")
    match_markets = relationship("MatchMarket", back_populates="market", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Market {self.code} - {self.name}>"

class MarketOutcome(BaseModel):
    __tablename__ = "market_outcomes"
    
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    outcome_name = Column(String(100))
    outcome_label = Column(String(100))
    odds_column = Column(String(50))
    is_default = Column(Boolean, default=False)
    sort_order = Column(Integer)
    
    # Relationships
    market = relationship("Market", back_populates="outcomes")
    
    def __repr__(self):
        return f"<MarketOutcome {self.outcome_name} for market_id={self.market_id}>"

class MatchMarket(BaseModel):
    __tablename__ = "match_markets"
    
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    odds = Column(Float)
    additional_data = Column(JSON)  # <-- This was causing the error
    
    # Relationships
    match = relationship("Match", back_populates="match_markets")
    market = relationship("Market", back_populates="match_markets")
    
    # Unique constraint
    __table_args__ = (
        {'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'},
    )
    
    def __repr__(self):
        return f"<MatchMarket match_id={self.match_id}, market_id={self.market_id}>"