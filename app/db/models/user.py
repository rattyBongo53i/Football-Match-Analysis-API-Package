from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), default="user")
    preferences = Column(JSON)
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    bet_slips = relationship("BetSlip", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"

class Project(BaseModel):
    __tablename__ = "projects"
    
    name = Column(String(200), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    settings = Column(JSON)
    bankroll = Column(Float, default=100.0)
    status = Column(String(20), default="active")
    
    # Relationships
    user = relationship("User", back_populates="projects")
    bet_slips = relationship("BetSlip", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.name}>"

class CoverageScenario(BaseModel):
    __tablename__ = "coverage_scenarios"
    
    slip_id = Column(Integer, ForeignKey("bet_slips.id", ondelete="CASCADE"), nullable=False)
    scenario_hash = Column(String(64))
    outcomes = Column(JSON, nullable=False)
    probability = Column(Float)
    is_covered = Column(Boolean, default=False)
    covering_slip_ids = Column(JSON)
    
    # Relationships
    slip = relationship("BetSlip", back_populates="coverage_scenarios")
    
    def __repr__(self):
        return f"<CoverageScenario {self.scenario_hash[:8]}>"

class StakeAllocation(BaseModel):
    __tablename__ = "stake_allocations"
    
    slip_id = Column(Integer, ForeignKey("bet_slips.id", ondelete="CASCADE"), nullable=False)
    total_bankroll = Column(Float)
    allocation_method = Column(String(50))
    allocations = Column(JSON, nullable=False)
    expected_return = Column(Float)
    risk_score = Column(Float)
    
    # Relationships
    slip = relationship("BetSlip", back_populates="stake_allocations")
    
    def __repr__(self):
        return f"<StakeAllocation for slip_id={self.slip_id}>"