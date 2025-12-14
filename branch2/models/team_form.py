from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TeamForm(Base):
    __tablename__ = "team_forms"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"))

    team_type = Column(String, nullable=False)  
    # "home" or "away"

    form_json = Column(Text, nullable=False)
    # Example:
    # [{ opponent: "Chelsea", score: "3-1", result: "W" }]

    ranking_position = Column(Integer, nullable=True)
    goals_scored = Column(Integer, nullable=True)
    goals_conceded = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    match = relationship("Match", back_populates="team_forms")
