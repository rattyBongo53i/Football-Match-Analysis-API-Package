from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class MatchMarket(Base):
    __tablename__ = "match_markets"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"))

    # Market ID refers to your global "market list"
    # e.g., 1=Match Winner, 2=Over/Under 2.5, 3=Both Teams Score
    market_id = Column(Integer, nullable=False)

    # Odds values (may vary depending on market type)
    odd_1 = Column(Float, nullable=True)
    odd_x = Column(Float, nullable=True)
    odd_2 = Column(Float, nullable=True)

    # Optional special odds (like Over 2.5, BTTS, etc.)
    value = Column(Float, nullable=True)

    special_odd = Column(Float, nullable=True)

    # Generic JSON field if needed
    extra_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    match = relationship("Match", back_populates="markets")
