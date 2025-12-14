import itertools
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import BetSlip, SlipMatch, Market, MatchMarket, Match
from app.ml.prediction.predictor import Predictor
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CandidateGenerator:
    def __init__(self, db: Session, predictor: Predictor):
        self.db = db
        self.predictor = predictor
        
    def generate_from_master(
        self, 
        master_slip: BetSlip,
        num_candidates: int = 100,
        swap_probability: float = 0.3,
        user_id: Optional[int] = None,
        project_id: Optional[int] = None
    ) -> List[BetSlip]:
        """Generate candidate slips from a master slip."""
        candidates = []
        master_matches = master_slip.slip_matches
        
        logger.info(f"Generating {num_candidates} candidates from master slip {master_slip.id}")
        
        for i in range(num_candidates):
            candidate_matches_data = self._generate_swapped_matches(
                master_matches, 
                swap_probability
            )
            
            # Calculate total odds
            total_odds = self._calculate_total_odds(candidate_matches_data)
            
            # Create candidate slip
            slip = BetSlip(
                name=f"Candidate {i+1} from Master {master_slip.id}",
                description=f"Generated from master slip {master_slip.name}",
                user_id=user_id or master_slip.user_id,
                project_id=project_id or master_slip.project_id,
                master_slip_id=master_slip.id,
                status='generated',
                total_odds=total_odds,
                total_stake=0.0,  # Will be set by stake allocator
                potential_return=0.0,
                confidence_score=self._calculate_average_confidence(candidate_matches_data),
                coverage_score=0.0,  # Will be calculated by coverage optimizer
                generation_type='generated',
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Save to get ID
            self.db.add(slip)
            self.db.flush()
            
            # Add matches to slip
            for pos, match_data in enumerate(candidate_matches_data):
                slip_match = SlipMatch(
                    slip_id=slip.id,
                    match_id=match_data['match_id'],
                    selected_market_id=match_data.get('market_id'),
                    selected_outcome=match_data['outcome'],
                    selected_odds=match_data.get('odds', 1.0),
                    confidence=match_data.get('confidence', 0.5),
                    position=pos,
                    is_swappable=match_data.get('is_swappable', True),
                    swap_priority=match_data.get('swap_priority', 1),
                    created_at=datetime.now()
                )
                self.db.add(slip_match)
            
            candidates.append(slip)
        
        # Commit all candidates
        try:
            self.db.commit()
            # Refresh objects to get IDs
            for slip in candidates:
                self.db.refresh(slip)
            logger.info(f"Successfully generated {len(candidates)} candidate slips")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving candidate slips: {e}")
            raise
        
        return candidates
    
    def _generate_swapped_matches(
        self, 
        master_matches: List[SlipMatch], 
        swap_probability: float
    ) -> List[Dict[str, Any]]:
        """Swap markets/outcomes based on probabilities."""
        swapped_matches = []
        
        for slip_match in master_matches:
            if slip_match.is_swappable and np.random.random() < swap_probability:
                # Get alternative markets for this match
                alternatives = self._get_alternatives(
                    slip_match.match_id,
                    slip_match.selected_market_id,
                    slip_match.selected_outcome
                )
                
                if alternatives:
                    # Select alternative based on confidence (weighted random)
                    confidences = [alt['confidence'] for alt in alternatives]
                    probabilities = np.array(confidences) / np.sum(confidences)
                    selected_idx = np.random.choice(len(alternatives), p=probabilities)
                    selected = alternatives[selected_idx]
                    swapped_matches.append(selected)
                else:
                    swapped_matches.append(self._to_dict(slip_match))
            else:
                swapped_matches.append(self._to_dict(slip_match))
        
        return swapped_matches
    
    def _get_alternatives(
        self, 
        match_id: int, 
        current_market_id: Optional[int], 
        current_outcome: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Get alternative markets/outcomes for a match."""
        alternatives = []
        
        try:
            # Get all available markets for this match
            match_markets = self.db.query(MatchMarket).filter(
                MatchMarket.match_id == match_id
            ).all()
            
            for match_market in match_markets:
                market = match_market.market
                
                # Skip current market
                if market.id == current_market_id:
                    continue
                
                # Get predictions for this market
                try:
                    predictions = self.predictor.predict_match_market(match_id, market.id)
                    
                    for outcome, confidence in predictions.items():
                        # Get odds for this outcome
                        odds = self._get_odds_from_match_market(match_market, outcome)
                        
                        alternatives.append({
                            'match_id': match_id,
                            'market_id': market.id,
                            'market_name': market.name,
                            'market_code': market.code,
                            'outcome': outcome,
                            'odds': odds,
                            'confidence': confidence,
                            'is_swappable': True,
                            'swap_priority': self._calculate_swap_priority(confidence, odds)
                        })
                except Exception as e:
                    logger.warning(f"Error getting predictions for match {match_id}, market {market.id}: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error getting alternatives for match {match_id}: {e}")
        
        return alternatives
    
    def _get_odds_from_match_market(self, match_market: MatchMarket, outcome: str) -> float:
        """Extract odds for specific outcome from match_market data."""
        try:
            # If additional_data contains odds by outcome
            if match_market.additional_data:
                data = json.loads(match_market.additional_data) if isinstance(match_market.additional_data, str) else match_market.additional_data
                if outcome in data and 'odds' in data[outcome]:
                    return float(data[outcome]['odds'])
            
            # Default to market odds
            return float(match_market.odds) if match_market.odds else 1.0
        except:
            return 1.0
    
    def _calculate_swap_priority(self, confidence: float, odds: float) -> int:
        """Calculate swap priority based on confidence and odds value."""
        # Higher confidence + reasonable odds = lower priority to swap
        if confidence > 0.7 and 1.5 < odds < 3.0:
            return 3  # Low priority
        elif confidence > 0.5:
            return 2  # Medium priority
        else:
            return 1  # High priority
    
    def _to_dict(self, slip_match: SlipMatch) -> Dict[str, Any]:
        """Convert SlipMatch to dictionary."""
        return {
            'match_id': slip_match.match_id,
            'market_id': slip_match.selected_market_id,
            'market_name': slip_match.selected_market.name if slip_match.selected_market else None,
            'outcome': slip_match.selected_outcome,
            'odds': slip_match.selected_odds,
            'confidence': slip_match.confidence,
            'is_swappable': slip_match.is_swappable,
            'swap_priority': slip_match.swap_priority
        }
    
    def _calculate_total_odds(self, matches_data: List[Dict]) -> float:
        """Calculate total odds for candidate slip."""
        total = 1.0
        for match_data in matches_data:
            if match_data.get('odds'):
                total *= float(match_data['odds'])
        return round(total, 2)
    
    def _calculate_average_confidence(self, matches_data: List[Dict]) -> float:
        """Calculate average confidence for candidate slip."""
        confidences = [m.get('confidence', 0.5) for m in matches_data]
        return round(np.mean(confidences), 4) if confidences else 0.5