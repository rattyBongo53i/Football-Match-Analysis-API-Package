import itertools
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import numpy as np
from sqlalchemy.orm import Session
from app.db.models import BetSlip, SlipMatch, CoverageScenario, MatchMarket
import json
import hashlib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CoverageOptimizer:
    def __init__(self, db: Session):
        self.db = db
        self.scenario_cache = {}
    
    def optimize_coverage(
        self,
        master_slip: BetSlip,
        candidate_slips: List[BetSlip],
        max_scenarios: int = 1000,
        target_coverage: float = 0.8,
        monte_carlo_iterations: int = 10000
    ) -> Tuple[List[BetSlip], List[CoverageScenario]]:
        """Optimize slip selection for maximum scenario coverage."""
        
        logger.info(f"Optimizing coverage for {len(candidate_slips)} candidate slips")
        
        # Generate all plausible scenarios
        all_scenarios = self._generate_scenarios_monte_carlo(
            master_slip, 
            monte_carlo_iterations,
            max_scenarios
        )
        
        # Score each candidate slip
        scored_slips = []
        for slip in candidate_slips:
            score, covered_scenarios = self._calculate_coverage_score(slip, all_scenarios)
            scored_slips.append({
                'slip': slip,
                'coverage_score': score,
                'covered_scenarios': covered_scenarios
            })
        
        # Greedy selection for coverage
        selected_slips, selected_scenarios = self._greedy_selection(
            scored_slips, 
            all_scenarios, 
            target_coverage
        )
        
        # Save coverage scenarios to database
        saved_scenarios = self._save_coverage_scenarios(
            master_slip.id,
            selected_scenarios,
            [s.id for s in selected_slips]
        )
        
        # Update coverage scores on slips
        self._update_slip_coverage_scores(selected_slips, saved_scenarios)
        
        return selected_slips, saved_scenarios
    
    def _generate_scenarios_monte_carlo(
        self, 
        master_slip: BetSlip, 
        iterations: int,
        max_scenarios: int
    ) -> List[Dict]:
        """Generate plausible match outcome scenarios using Monte Carlo simulation."""
        scenarios = []
        matches = master_slip.slip_matches
        
        # Cache for probabilities
        probability_cache = {}
        
        for _ in range(min(iterations, max_scenarios)):
            scenario = {}
            scenario_probability = 1.0
            
            for slip_match in matches:
                match_id = slip_match.match_id
                market_id = slip_match.selected_market_id
                
                # Get or calculate outcome probabilities
                cache_key = f"{match_id}_{market_id}"
                if cache_key not in probability_cache:
                    probability_cache[cache_key] = self._get_outcome_probabilities(
                        match_id, 
                        market_id
                    )
                
                probabilities = probability_cache[cache_key]
                
                if probabilities:
                    # Sample outcome based on probabilities
                    outcomes = list(probabilities.keys())
                    probs = list(probabilities.values())
                    
                    # Normalize probabilities
                    probs_sum = sum(probs)
                    if probs_sum > 0:
                        probs = [p / probs_sum for p in probs]
                        
                        selected_outcome = np.random.choice(outcomes, p=probs)
                        scenario[match_id] = {
                            'market_id': market_id,
                            'outcome': selected_outcome,
                            'probability': probabilities.get(selected_outcome, 0.0),
                            'odds': self._get_outcome_odds(match_id, market_id, selected_outcome)
                        }
                        scenario_probability *= probabilities.get(selected_outcome, 0.0)
            
            # Only keep scenarios with reasonable probability
            if scenario and scenario_probability > 0.001:
                scenario_hash = self._hash_scenario(scenario)
                if scenario_hash not in [s.get('hash') for s in scenarios]:
                    scenarios.append({
                        'hash': scenario_hash,
                        'outcomes': scenario,
                        'probability': scenario_probability
                    })
        
        # Sort by probability (descending)
        scenarios.sort(key=lambda x: x['probability'], reverse=True)
        
        logger.info(f"Generated {len(scenarios)} plausible scenarios")
        return scenarios[:max_scenarios]
    
    def _get_outcome_probabilities(self, match_id: int, market_id: int) -> Dict[str, float]:
        """Get outcome probabilities for a match market."""
        try:
            # Try to get from predictions table first
            from app.db.models import Prediction
            prediction = self.db.query(Prediction).filter(
                Prediction.match_id == match_id,
                Prediction.market_id == market_id
            ).first()
            
            if prediction and prediction.outcomes:
                outcomes = json.loads(prediction.outcomes) if isinstance(prediction.outcomes, str) else prediction.outcomes
                return {k: float(v) for k, v in outcomes.items()}
            
            # Fallback: Calculate from odds using implied probability
            match_market = self.db.query(MatchMarket).filter(
                MatchMarket.match_id == match_id,
                MatchMarket.market_id == market_id
            ).first()
            
            if match_market and match_market.odds:
                # Simple probability calculation from odds
                # This should be replaced with proper model predictions
                odds = float(match_market.odds)
                if odds > 1:
                    probability = 1 / odds
                    # Adjust for overround
                    probability = probability * 0.95
                    return {'outcome': probability}
        
        except Exception as e:
            logger.warning(f"Error getting probabilities for match {match_id}, market {market_id}: {e}")
        
        # Default equal probabilities
        return {'outcome1': 0.33, 'outcome2': 0.34, 'outcome3': 0.33}
    
    def _get_outcome_odds(self, match_id: int, market_id: int, outcome: str) -> float:
        """Get odds for specific outcome."""
        try:
            match_market = self.db.query(MatchMarket).filter(
                MatchMarket.match_id == match_id,
                MatchMarket.market_id == market_id
            ).first()
            
            if match_market:
                if match_market.additional_data:
                    data = json.loads(match_market.additional_data) if isinstance(match_market.additional_data, str) else match_market.additional_data
                    if isinstance(data, dict) and outcome in data:
                        outcome_data = data[outcome]
                        if isinstance(outcome_data, dict) and 'odds' in outcome_data:
                            return float(outcome_data['odds'])
                
                # Return market odds if specific outcome odds not found
                return float(match_market.odds) if match_market.odds else 1.0
        
        except:
            pass
        
        return 1.0
    
    def _calculate_coverage_score(
        self, 
        slip: BetSlip, 
        scenarios: List[Dict]
    ) -> Tuple[float, Set[str]]:
        """Calculate how many scenarios this slip covers."""
        covered_scenarios = set()
        
        for scenario in scenarios:
            if self._slip_covers_scenario(slip, scenario['outcomes']):
                covered_scenarios.add(scenario['hash'])
        
        coverage_score = len(covered_scenarios) / len(scenarios) if scenarios else 0.0
        
        return coverage_score, covered_scenarios
    
    def _slip_covers_scenario(self, slip: BetSlip, scenario_outcomes: Dict) -> bool:
        """Check if a slip covers a specific scenario."""
        for slip_match in slip.slip_matches:
            match_id = slip_match.match_id
            selected_outcome = slip_match.selected_outcome
            
            if match_id in scenario_outcomes:
                scenario_outcome = scenario_outcomes[match_id]['outcome']
                if selected_outcome != scenario_outcome:
                    return False
            else:
                # Match not in scenario
                return False
        
        return True
    
    def _greedy_selection(
        self, 
        scored_slips: List[Dict], 
        scenarios: List[Dict],
        target_coverage: float
    ) -> Tuple[List[BetSlip], List[Dict]]:
        """Select slips using greedy algorithm for maximum coverage."""
        
        # Sort slips by coverage score (descending)
        scored_slips.sort(key=lambda x: x['coverage_score'], reverse=True)
        
        selected_slips = []
        selected_scenarios = []
        covered_scenarios = set()
        
        current_coverage = 0.0
        
        for scored_slip in scored_slips:
            slip = scored_slip['slip']
            slip_covered = scored_slip['covered_scenarios']
            
            # New scenarios covered by this slip
            new_coverage = slip_covered - covered_scenarios
            
            if new_coverage:
                selected_slips.append(slip)
                covered_scenarios.update(slip_covered)
                
                # Add scenarios covered by this slip
                for scenario_hash in slip_covered:
                    scenario = next((s for s in scenarios if s['hash'] == scenario_hash), None)
                    if scenario:
                        selected_scenarios.append(scenario)
                
                current_coverage = len(covered_scenarios) / len(scenarios) if scenarios else 0.0
                
                if current_coverage >= target_coverage:
                    logger.info(f"Target coverage {target_coverage} reached with {len(selected_slips)} slips")
                    break
        
        logger.info(f"Selected {len(selected_slips)} slips covering {current_coverage:.1%} of scenarios")
        return selected_slips, selected_scenarios
    
    def _hash_scenario(self, scenario: Dict) -> str:
        """Create hash for scenario."""
        scenario_str = json.dumps(scenario, sort_keys=True)
        return hashlib.sha256(scenario_str.encode()).hexdigest()
    
    def _save_coverage_scenarios(
        self, 
        master_slip_id: int,
        scenarios: List[Dict],
        covering_slip_ids: List[int]
    ) -> List[CoverageScenario]:
        """Save coverage scenarios to database."""
        saved_scenarios = []
        
        for scenario in scenarios:
            # Check if this scenario is covered
            scenario_hash = scenario['hash']
            is_covered = scenario_hash in [s.get('hash') for s in scenarios]
            
            coverage_scenario = CoverageScenario(
                slip_id=master_slip_id,
                scenario_hash=scenario_hash,
                outcomes=json.dumps(scenario['outcomes']),
                probability=scenario.get('probability', 0.0),
                is_covered=is_covered,
                covering_slip_ids=json.dumps(covering_slip_ids) if is_covered else json.dumps([]),
                created_at=datetime.now()
            )
            
            self.db.add(coverage_scenario)
            saved_scenarios.append(coverage_scenario)
        
        try:
            self.db.commit()
            for scenario in saved_scenarios:
                self.db.refresh(scenario)
            logger.info(f"Saved {len(saved_scenarios)} coverage scenarios")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving coverage scenarios: {e}")
            raise
        
        return saved_scenarios
    
    def _update_slip_coverage_scores(
        self, 
        slips: List[BetSlip], 
        scenarios: List[CoverageScenario]
    ):
        """Update coverage scores on slips."""
        for slip in slips:
            # Count how many scenarios this slip covers
            covered_count = 0
            for scenario in scenarios:
                if slip.id in (json.loads(scenario.covering_slip_ids) if scenario.covering_slip_ids else []):
                    covered_count += 1
            
            coverage_score = covered_count / len(scenarios) if scenarios else 0.0
            slip.coverage_score = coverage_score
            slip.updated_at = datetime.now()
        
        try:
            self.db.commit()
            logger.info(f"Updated coverage scores for {len(slips)} slips")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating coverage scores: {e}")