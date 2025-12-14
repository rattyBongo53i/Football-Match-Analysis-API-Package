from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    league = Column(String, nullable=False)
    match_date = Column(DateTime, nullable=False)

    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)

    home_logo = Column(String, nullable=True)
    away_logo = Column(String, nullable=True)

    venue = Column(String, nullable=True)
    country = Column(String, nullable=True)

    # Stats
    probability_home_win = Column(Float, nullable=True)
    probability_draw = Column(Float, nullable=True)
    probability_away_win = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    head_to_head = relationship("HeadToHead", back_populates="match", uselist=False)
    team_forms = relationship("TeamForm", back_populates="match", cascade="all, delete-orphan")
    markets = relationship("MatchMarket", back_populates="match", cascade="all, delete-orphan")
