# app/api/routers/match.py
from fastapi import APIRouter, Query, HTTPException, Depends, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json

router = APIRouter()

# Try to import database dependencies with fallbacks
try:
    from app.database import get_db
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    def get_db():
        yield None

try:
    from app.db.models.match import Match, HeadToHead, TeamForm
    from app.db.models.match_market import MatchMarket  # Assuming this exists
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    # Create dummy classes based on your model structure
    class Match:
        pass
    class HeadToHead:
        pass
    class TeamForm:
        pass
    class MatchMarket:
        pass

try:
    from app.core.schemas import (
        MatchCreate, MatchUpdate, MatchResponse,
        HeadToHeadCreate, HeadToHeadResponse,
        TeamFormCreate, TeamFormResponse,
        MatchMarketCreate, MatchMarketResponse
    )
    SCHEMAS_AVAILABLE = True
except ImportError:
    SCHEMAS_AVAILABLE = False
    # Create Pydantic models that match your SQLAlchemy models
    from pydantic import BaseModel, Field
    from typing import Optional, Dict, Any
    from datetime import datetime as dt
    
    class MatchBase(BaseModel):
        home_team: str
        away_team: str
        league: Optional[str] = None
        match_date: Optional[dt] = None
        
    class MatchCreate(MatchBase):
        pass
    
    class MatchUpdate(BaseModel):
        home_team: Optional[str] = None
        away_team: Optional[str] = None
        league: Optional[str] = None
        match_date: Optional[dt] = None
    
    class MatchResponse(MatchBase):
        id: int
        created_at: dt
        updated_at: Optional[dt] = None
        
        class Config:
            from_attributes = True
    
    class HeadToHeadCreate(BaseModel):
        result: Dict[str, Any]
    
    class HeadToHeadResponse(BaseModel):
        id: int
        match_id: int
        result: Dict[str, Any]
        created_at: dt
        updated_at: Optional[dt] = None
        
        class Config:
            from_attributes = True
    
    class TeamFormCreate(BaseModel):
        team_type: str  # 'home' or 'away'
        form: Dict[str, Any]
    
    class TeamFormResponse(BaseModel):
        id: int
        match_id: int
        team_type: str
        form: Dict[str, Any]
        created_at: dt
        updated_at: Optional[dt] = None
        
        class Config:
            from_attributes = True

try:
    from app.utils.logger import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

# ===== BACKWARD COMPATIBLE ENDPOINTS =====

@router.get("/")
async def get_matches(
    skip: int = 0,
    limit: int = 100,
    league: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get matches - main endpoint that must work."""
    try:
        if DB_AVAILABLE and MODELS_AVAILABLE:
            # Build query
            query = db.query(Match)
            
            if league:
                query = query.filter(Match.league.ilike(f"%{league}%"))
            
            # Try to get real data
            matches = query.order_by(Match.id).offset(skip).limit(limit).all()
            
            # Convert to dict for JSON serialization
            match_list = []
            for match in matches:
                match_dict = {
                    "id": match.id,
                    "home_team": match.home_team,
                    "away_team": match.away_team,
                    "league": match.league,
                    "match_date": match.match_date.isoformat() if match.match_date else None,
                    "created_at": match.created_at.isoformat() if match.created_at else None,
                    "updated_at": match.updated_at.isoformat() if match.updated_at else None,
                }
                match_list.append(match_dict)
            
            return {"matches": match_list}
        else:
            # Fallback to mock data
            return {
                "matches": [
                    {
                        "id": 1,
                        "home_team": "Team A",
                        "away_team": "Team B",
                        "league": league or "Premier League",
                        "match_date": datetime.now().isoformat(),
                        "status": "scheduled"
                    }
                ]
            }
    except Exception as e:
        logger.error(f"Error getting matches: {e}")
        # Fallback to ensure endpoint always works
        return {
            "matches": [
                {
                    "id": 1,
                    "home_team": "Team A (Fallback)",
                    "away_team": "Team B (Fallback)",
                    "league": league or "Premier League",
                    "match_date": datetime.now().isoformat(),
                    "message": "Using fallback data - check database setup"
                }
            ]
        }

@router.get("/{match_id}")
async def get_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific match."""
    try:
        if DB_AVAILABLE and MODELS_AVAILABLE:
            match = db.query(Match).filter(Match.id == match_id).first()
            if match:
                # Get related data
                h2h = db.query(HeadToHead).filter(HeadToHead.match_id == match_id).first()
                team_forms = db.query(TeamForm).filter(TeamForm.match_id == match_id).all()
                
                response = {
                    "id": match.id,
                    "home_team": match.home_team,
                    "away_team": match.away_team,
                    "league": match.league,
                    "match_date": match.match_date.isoformat() if match.match_date else None,
                    "created_at": match.created_at.isoformat() if match.created_at else None,
                    "updated_at": match.updated_at.isoformat() if match.updated_at else None,
                    "head_to_head": json.loads(h2h.result) if h2h and h2h.result else None,
                    "team_forms": [
                        {
                            "team_type": tf.team_type,
                            "form": json.loads(tf.form) if tf.form else {}
                        }
                        for tf in team_forms
                    ] if team_forms else []
                }
                return response
            else:
                raise HTTPException(status_code=404, detail="Match not found")
        else:
            # Fallback to mock data
            return {
                "id": match_id,
                "home_team": f"Team {match_id}A",
                "away_team": f"Team {match_id}B",
                "league": "Premier League",
                "match_date": datetime.now().isoformat(),
                "status": "upcoming",
                "head_to_head": {"wins": 2, "draws": 1, "losses": 0},
                "team_forms": [
                    {"team_type": "home", "form": ["W", "D", "W", "L", "W"]},
                    {"team_type": "away", "form": ["L", "W", "D", "W", "L"]}
                ],
                "message": "Using fallback data - check database setup"
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting match {match_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ENHANCED ENDPOINTS (only work if dependencies are available) =====

if DB_AVAILABLE and MODELS_AVAILABLE:
    # Enhanced match listing with filtering
    @router.get("/list/", response_model=List[MatchResponse] if SCHEMAS_AVAILABLE else None)
    async def list_matches(
        skip: int = 0,
        limit: int = 100,
        league: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        team_name: Optional[str] = None,
        db: Session = Depends(get_db)
    ):
        """List matches with filtering."""
        query = db.query(Match)
        
        if league:
            query = query.filter(Match.league.ilike(f"%{league}%"))
        
        if date_from:
            query = query.filter(Match.match_date >= date_from)
        
        if date_to:
            query = query.filter(Match.match_date <= date_to)
        
        if team_name:
            query = query.filter(
                (Match.home_team.ilike(f"%{team_name}%")) | 
                (Match.away_team.ilike(f"%{team_name}%"))
            )
        
        matches = query.order_by(Match.match_date.asc()).offset(skip).limit(limit).all()
        
        if SCHEMAS_AVAILABLE:
            return matches
        else:
            # Convert to dict
            return [
                {
                    "id": m.id,
                    "home_team": m.home_team,
                    "away_team": m.away_team,
                    "league": m.league,
                    "match_date": m.match_date,
                    "created_at": m.created_at,
                    "updated_at": m.updated_at
                }
                for m in matches
            ]

    @router.post("/", response_model=MatchResponse if SCHEMAS_AVAILABLE else None, status_code=status.HTTP_201_CREATED)
    async def create_match(
        match_data: MatchCreate if SCHEMAS_AVAILABLE else dict,
        db: Session = Depends(get_db)
    ):
        """Create a new match."""
        try:
            if SCHEMAS_AVAILABLE:
                data = match_data.dict()
            else:
                data = match_data
            
            match = Match(
                home_team=data.get("home_team"),
                away_team=data.get("away_team"),
                league=data.get("league"),
                match_date=data.get("match_date")
            )
            
            db.add(match)
            db.commit()
            db.refresh(match)
            
            logger.info(f"Created match {match.id}: {match.home_team} vs {match.away_team}")
            
            if SCHEMAS_AVAILABLE:
                return match
            else:
                return {
                    "id": match.id,
                    "home_team": match.home_team,
                    "away_team": match.away_team,
                    "league": match.league,
                    "match_date": match.match_date,
                    "created_at": match.created_at,
                    "updated_at": match.updated_at,
                    "message": "Match created successfully"
                }
                
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating match: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.put("/{match_id}", response_model=MatchResponse if SCHEMAS_AVAILABLE else None)
    async def update_match(
        match_id: int,
        match_data: MatchUpdate if SCHEMAS_AVAILABLE else dict,
        db: Session = Depends(get_db)
    ):
        """Update a match."""
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        try:
            if SCHEMAS_AVAILABLE:
                update_data = match_data.dict(exclude_unset=True)
            else:
                update_data = {k: v for k, v in match_data.items() if v is not None}
            
            for field, value in update_data.items():
                if hasattr(match, field):
                    setattr(match, field, value)
            
            # Update timestamp (assuming BaseModel has updated_at)
            if hasattr(match, 'updated_at'):
                match.updated_at = datetime.now()
            
            db.commit()
            db.refresh(match)
            
            logger.info(f"Updated match {match_id}")
            
            if SCHEMAS_AVAILABLE:
                return match
            else:
                return {
                    "id": match.id,
                    "home_team": match.home_team,
                    "away_team": match.away_team,
                    "league": match.league,
                    "match_date": match.match_date,
                    "created_at": match.created_at,
                    "updated_at": match.updated_at,
                    "message": "Match updated successfully"
                }
                
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating match {match_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_match(
        match_id: int,
        db: Session = Depends(get_db)
    ):
        """Delete a match."""
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        try:
            db.delete(match)
            db.commit()
            logger.info(f"Deleted match {match_id}")
            return None
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting match {match_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ===== HEAD-TO-HEAD ENDPOINTS =====
    
    @router.post("/{match_id}/head-to-head", response_model=HeadToHeadResponse if SCHEMAS_AVAILABLE else None, status_code=status.HTTP_201_CREATED)
    async def create_head_to_head(
        match_id: int,
        h2h_data: HeadToHeadCreate if SCHEMAS_AVAILABLE else dict,
        db: Session = Depends(get_db)
    ):
        """Create head-to-head data for a match."""
        # Check if match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Check if H2H already exists for this match
        existing = db.query(HeadToHead).filter(HeadToHead.match_id == match_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Head-to-head data already exists for this match")
        
        try:
            if SCHEMAS_AVAILABLE:
                data = h2h_data.dict()
            else:
                data = h2h_data
            
            # Convert result dict to JSON string for storage
            result_json = json.dumps(data.get("result", {}))
            
            h2h = HeadToHead(
                match_id=match_id,
                result=result_json
            )
            
            db.add(h2h)
            db.commit()
            db.refresh(h2h)
            
            logger.info(f"Created head-to-head for match {match_id}")
            
            if SCHEMAS_AVAILABLE:
                return h2h
            else:
                return {
                    "id": h2h.id,
                    "match_id": h2h.match_id,
                    "result": json.loads(h2h.result) if h2h.result else {},
                    "created_at": h2h.created_at,
                    "updated_at": h2h.updated_at,
                    "message": "Head-to-head data created successfully"
                }
                
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating head-to-head for match {match_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/{match_id}/head-to-head", response_model=HeadToHeadResponse if SCHEMAS_AVAILABLE else None)
    async def get_head_to_head(
        match_id: int,
        db: Session = Depends(get_db)
    ):
        """Get head-to-head data for a match."""
        h2h = db.query(HeadToHead).filter(HeadToHead.match_id == match_id).first()
        if not h2h:
            raise HTTPException(status_code=404, detail="Head-to-head data not found")
        
        if SCHEMAS_AVAILABLE:
            return h2h
        else:
            return {
                "id": h2h.id,
                "match_id": h2h.match_id,
                "result": json.loads(h2h.result) if h2h.result else {},
                "created_at": h2h.created_at,
                "updated_at": h2h.updated_at
            }

    # ===== TEAM FORM ENDPOINTS =====
    
    @router.post("/{match_id}/team-form", response_model=TeamFormResponse if SCHEMAS_AVAILABLE else None, status_code=status.HTTP_201_CREATED)
    async def create_team_form(
        match_id: int,
        form_data: TeamFormCreate if SCHEMAS_AVAILABLE else dict,
        db: Session = Depends(get_db)
    ):
        """Create team form data for a match."""
        # Check if match exists
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        try:
            if SCHEMAS_AVAILABLE:
                data = form_data.dict()
            else:
                data = form_data
            
            # Check team_type is valid
            team_type = data.get("team_type", "").lower()
            if team_type not in ["home", "away"]:
                raise HTTPException(status_code=400, detail="team_type must be 'home' or 'away'")
            
            # Check if team form already exists for this match and team type
            existing = db.query(TeamForm).filter(
                TeamForm.match_id == match_id,
                TeamForm.team_type == team_type
            ).first()
            
            if existing:
                raise HTTPException(status_code=400, detail=f"Team form already exists for {team_type} team")
            
            # Convert form dict to JSON string for storage
            form_json = json.dumps(data.get("form", {}))
            
            form = TeamForm(
                match_id=match_id,
                team_type=team_type,
                form=form_json
            )
            
            db.add(form)
            db.commit()
            db.refresh(form)
            
            logger.info(f"Created team form for match {match_id} ({team_type} team)")
            
            if SCHEMAS_AVAILABLE:
                return form
            else:
                return {
                    "id": form.id,
                    "match_id": form.match_id,
                    "team_type": form.team_type,
                    "form": json.loads(form.form) if form.form else {},
                    "created_at": form.created_at,
                    "updated_at": form.updated_at,
                    "message": f"Team form created for {team_type} team"
                }
                
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating team form for match {match_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/{match_id}/team-form", response_model=List[TeamFormResponse] if SCHEMAS_AVAILABLE else None)
    async def get_team_forms(
        match_id: int,
        team_type: Optional[str] = None,
        db: Session = Depends(get_db)
    ):
        """Get team form data for a match."""
        query = db.query(TeamForm).filter(TeamForm.match_id == match_id)
        
        if team_type:
            query = query.filter(TeamForm.team_type == team_type.lower())
        
        forms = query.all()
        
        if not forms and team_type:
            raise HTTPException(status_code=404, detail=f"No team form found for {team_type} team")
        elif not forms:
            raise HTTPException(status_code=404, detail="No team forms found for this match")
        
        if SCHEMAS_AVAILABLE:
            return forms
        else:
            return [
                {
                    "id": form.id,
                    "match_id": form.match_id,
                    "team_type": form.team_type,
                    "form": json.loads(form.form) if form.form else {},
                    "created_at": form.created_at,
                    "updated_at": form.updated_at
                }
                for form in forms
            ]

# ===== TEST ENDPOINTS =====

@router.get("/test/")
async def test_endpoint():
    """Test endpoint to verify router is working."""
    return {
        "message": "Match router is working!",
        "database_available": DB_AVAILABLE,
        "models_available": MODELS_AVAILABLE,
        "schemas_available": SCHEMAS_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }