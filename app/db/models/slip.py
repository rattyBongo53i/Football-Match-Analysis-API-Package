from sqlalchemy import Column, String, Text, Float, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel
from datetime import datetime
from .base import Base

class Slip(Base):
    """Betting slip model."""
    __tablename__ = "slips"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    selections = Column(JSON, nullable=False)  # Store match selections as JSON
    total_odds = Column(Float, nullable=False)
    stake = Column(Float, default=0.0)
    potential_win = Column(Float, nullable=False)
    status = Column(String(50), default="pending")  # pending, active, won, lost
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="slips")
    
    def __repr__(self):
        return f"<Slip(id={self.id}, odds={self.total_odds}, status={self.status})>"

class BetSlip(BaseModel):
    __tablename__ = "bet_slips"
    
    name = Column(String(200))
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    master_slip_id = Column(Integer, ForeignKey("bet_slips.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="draft")
    total_odds = Column(Float)
    total_stake = Column(Float)
    potential_return = Column(Float)
    confidence_score = Column(Float)
    coverage_score = Column(Float)
    generation_type = Column(String(50))
    
    # Relationships
    user = relationship("User", back_populates="bet_slips")
    project = relationship("Project", back_populates="bet_slips")
    master_slip = relationship("BetSlip", remote_side="BetSlip.id", backref="generated_slips")
    slip_matches = relationship("SlipMatch", back_populates="slip", cascade="all, delete-orphan")
    generation_jobs = relationship("GenerationJob", back_populates="slip", cascade="all, delete-orphan")
    coverage_scenarios = relationship("CoverageScenario", back_populates="slip", cascade="all, delete-orphan")
    stake_allocations = relationship("StakeAllocation", back_populates="slip", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BetSlip {self.name} - {self.status}>"

class SlipMatch(BaseModel):
    __tablename__ = "slip_matches"
    
    slip_id = Column(Integer, ForeignKey("bet_slips.id", ondelete="CASCADE"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    selected_market_id = Column(Integer, ForeignKey("markets.id", ondelete="SET NULL"), nullable=True)
    selected_outcome = Column(String(50))
    selected_odds = Column(Float)
    confidence = Column(Float)
    position = Column(Integer)
    is_swappable = Column(Boolean, default=True)
    swap_priority = Column(Integer, default=1)
    
    # Relationships
    slip = relationship("BetSlip", back_populates="slip_matches")
    match = relationship("Match", back_populates="slip_matches")
    selected_market = relationship("Market")
    
    def __repr__(self):
        return f"<SlipMatch slip_id={self.slip_id}, match_id={self.match_id}>"

class GenerationJob(BaseModel):
    __tablename__ = "generation_jobs"
    
    slip_id = Column(Integer, ForeignKey("bet_slips.id", ondelete="CASCADE"))
    job_type = Column(String(50))
    status = Column(String(20), default="pending")
    parameters = Column(JSON)
    result_summary = Column(JSON)
    generated_slip_ids = Column(JSON)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    
    # Relationships
    slip = relationship("BetSlip", back_populates="generation_jobs")
    
    def __repr__(self):
        return f"<GenerationJob {self.job_type} - {self.status}>"