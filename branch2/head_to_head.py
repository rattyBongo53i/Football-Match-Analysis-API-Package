from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class HeadToHead(Base):
    __tablename__ = "head_to_head"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True)

    results_json = Column(Text, nullable=False)  
    # Example:
    # [{ result: "2-1", date: "...", competition: "Premier League" }]

    stats_json = Column(Text, nullable=True)
    # Example:
    # { over_25: 60, btts: 80, home_win: 40 }

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    match = relationship("Match", back_populates="head_to_head")
