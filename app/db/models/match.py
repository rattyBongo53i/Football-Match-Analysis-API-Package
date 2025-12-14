from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Match(BaseModel):
    __tablename__ = "matches"
    
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    league = Column(String(100))
    match_date = Column(DateTime)
    
    # Relationships
    head_to_head = relationship("HeadToHead", back_populates="match", cascade="all, delete-orphan")
    team_forms = relationship("TeamForm", back_populates="match", cascade="all, delete-orphan")
    match_markets = relationship("MatchMarket", back_populates="match", cascade="all, delete-orphan")
    slip_matches = relationship("SlipMatch", back_populates="match")
    predictions = relationship("Prediction", back_populates="match")
    
    def __repr__(self):
        return f"<Match {self.home_team} vs {self.away_team}>"

class HeadToHead(BaseModel):
    __tablename__ = "head_to_head"
    
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    result = Column(JSON, nullable=False)
    
    # Relationships
    match = relationship("Match", back_populates="head_to_head")
    
    def __repr__(self):
        return f"<HeadToHead match_id={self.match_id}>"

class TeamForm(BaseModel):
    __tablename__ = "team_form"
    
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    team_type = Column(String(10))  # 'home' or 'away'
    form = Column(JSON, nullable=False)
    
    # Relationships
    match = relationship("Match", back_populates="team_forms")
    
    def __repr__(self):
        return f"<TeamForm {self.team_type} for match_id={self.match_id}>"