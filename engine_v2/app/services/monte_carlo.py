import numpy as np
from typing import List, Dict, Any, Tuple
import logging
from dataclasses import dataclass
from scipy import stats

logger = logging.getLogger(__name__)

@dataclass
class MonteCarloConfig:
    simulations: int = 10000
    goal_distribution: str = "poisson"  # poisson, negative_binomial, custom
    random_seed: int = 42
    confidence_level: float = 0.95

class MonteCarloAnalyzer:
    """Monte Carlo simulation for football match outcomes"""
    
    def __init__(self, config: MonteCarloConfig = None):
        self.config = config or MonteCarloConfig()
        np.random.seed(self.config.random_seed)
        logger.info(f"Initialized MonteCarloAnalyzer with {self.config.simulations} simulations")
    
    def simulate_match(
        self,
        home_avg_goals: float,
        away_avg_goals: float,
        home_advantage: float = 0.2,
        venue_factor: float = 1.0
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Simulate a single match using Poisson distribution
        
        Args:
            home_avg_goals: Average goals scored by home team
            away_avg_goals: Average goals scored by away team
            home_advantage: Home advantage multiplier
            venue_factor: Venue-specific factor
        
        Returns:
            Tuple of (home_goals, away_goals) arrays
        """
        try:
            # Adjust averages with factors
            adjusted_home = home_avg_goals * (1 + home_advantage) * venue_factor
            adjusted_away = away_avg_goals
            
            # Generate simulations
            if self.config.goal_distribution == "poisson":
                home_goals = np.random.poisson(adjusted_home, self.config.simulations)
                away_goals = np.random.poisson(adjusted_away, self.config.simulations)
            else:
                # Fallback to Poisson if other distributions not implemented
                home_goals = np.random.poisson(adjusted_home, self.config.simulations)
                away_goals = np.random.poisson(adjusted_away, self.config.simulations)
            
            return home_goals, away_goals
            
        except Exception as e:
            logger.error(f"Error in match simulation: {e}")
            raise
    
    def calculate_outcome_probabilities(
        self,
        home_goals: np.ndarray,
        away_goals: np.ndarray
    ) -> Dict[str, float]:
        """Calculate probabilities of match outcomes"""
        try:
            home_wins = np.sum(home_goals > away_goals)
            draws = np.sum(home_goals == away_goals)
            away_wins = np.sum(home_goals < away_goals)
            total = len(home_goals)
            
            return {
                "home_win": home_wins / total,
                "draw": draws / total,
                "away_win": away_wins / total,
                "home_goals_mean": np.mean(home_goals),
                "away_goals_mean": np.mean(away_goals),
                "goals_total_mean": np.mean(home_goals + away_goals),
            }
            
        except Exception as e:
            logger.error(f"Error calculating outcome probabilities: {e}")
            raise
    
    def simulate_slip(
        self,
        matches: List[Dict[str, Any]],
        stake: float
    ) -> Dict[str, Any]:
        """
        Simulate an entire betting slip
        
        Args:
            matches: List of match data dictionaries
            stake: Betting stake amount
        
        Returns:
            Dictionary with slip simulation results
        """
        try:
            logger.info(f"Simulating slip with {len(matches)} matches")
            
            all_results = []
            total_odds = 1.0
            
            for match in matches:
                # Extract match data
                home_avg = match.get('home_avg_goals', 1.5)
                away_avg = match.get('away_avg_goals', 1.2)
                home_advantage = match.get('home_advantage', 0.2)
                venue_factor = match.get('venue_factor', 1.0)
                
                # Simulate match
                home_goals, away_goals = self.simulate_match(
                    home_avg, away_avg, home_advantage, venue_factor
                )
                
                # Calculate probabilities
                probs = self.calculate_outcome_probabilities(home_goals, away_goals)
                
                # Get market odds and calculate expected value
                market_odds = match.get('selected_market', {}).get('odds', 1.85)
                implied_prob = 1 / market_odds
                ev = (probs["home_win"] * market_odds - 1) * stake
                
                match_result = {
                    "match_id": match.get('match_id'),
                    "probabilities": probs,
                    "market_odds": market_odds,
                    "implied_probability": implied_prob,
                    "expected_value": ev,
                    "value_bet": ev > 0,
                }
                all_results.append(match_result)
                
                total_odds *= market_odds
            
            # Calculate slip-level metrics
            slip_ev = sum(r["expected_value"] for r in all_results)
            possible_return = stake * total_odds
            confidence = self._calculate_confidence(all_results)
            risk_level = self._assess_risk_level(all_results)
            
            return {
                "total_odds": total_odds,
                "possible_return": possible_return,
                "expected_value": slip_ev,
                "confidence_score": confidence,
                "risk_level": risk_level,
                "match_results": all_results,
                "value_bets": sum(1 for r in all_results if r["value_bet"]),
                "simulations": self.config.simulations,
            }
            
        except Exception as e:
            logger.error(f"Error in slip simulation: {e}")
            raise
    
    def _calculate_confidence(self, match_results: List[Dict]) -> float:
        """Calculate overall confidence score for the slip"""
        try:
            # Weighted average of individual match confidences
            weights = []
            confidences = []
            
            for result in match_results:
                prob = result["probabilities"]["home_win"]
                odds = result["market_odds"]
                confidence = min(prob * odds * 100, 100)
                weight = 1 / odds  # Higher odds = lower weight
                
                weights.append(weight)
                confidences.append(confidence)
            
            if sum(weights) > 0:
                return np.average(confidences, weights=weights)
            return np.mean(confidences)
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 50.0  # Default confidence
    
    def _assess_risk_level(self, match_results: List[Dict]) -> str:
        """Assess overall risk level of the slip"""
        try:
            avg_odds = np.mean([r["market_odds"] for r in match_results])
            value_bet_ratio = sum(1 for r in match_results if r["value_bet"]) / len(match_results)
            
            if avg_odds < 2.0 and value_bet_ratio > 0.7:
                return "low"
            elif avg_odds < 3.0 and value_bet_ratio > 0.5:
                return "medium"
            else:
                return "high"
                
        except Exception as e:
            logger.error(f"Error assessing risk level: {e}")
            return "medium"
    
    def generate_alternative_slips(
        self,
        base_slip: Dict[str, Any],
        num_alternatives: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate alternative slip variations
        
        Args:
            base_slip: The original slip configuration
            num_alternatives: Number of alternative slips to generate
        
        Returns:
            List of alternative slip configurations
        """
        try:
            alternatives = []
            matches = base_slip.get("matches", [])
            
            for i in range(num_alternatives):
                alt_slip = {
                    "slip_id": f"ALT_{base_slip.get('master_slip_id', 'UNKNOWN')}_{i+1:03d}",
                    "variation_type": self._get_variation_type(i),
                    "matches": self._vary_matches(matches, i),
                    "stake": base_slip.get("stake", 0.5),
                }
                
                # Simulate the alternative slip
                simulation_result = self.simulate_slip(alt_slip["matches"], alt_slip["stake"])
                alt_slip.update(simulation_result)
                
                alternatives.append(alt_slip)
            
            # Sort by expected value (descending)
            alternatives.sort(key=lambda x: x["expected_value"], reverse=True)
            
            return alternatives
            
        except Exception as e:
            logger.error(f"Error generating alternative slips: {e}")
            return []
    
    def _get_variation_type(self, index: int) -> str:
        """Determine variation type based on index"""
        variation_types = [
            "conservative", "balanced", "aggressive",
            "high_confidence", "high_value", "low_risk",
            "market_coverage", "hedged", "diversified", "optimal"
        ]
        return variation_types[index % len(variation_types)]
    
    def _vary_matches(self, matches: List[Dict], variation_index: int) -> List[Dict]:
        """Create variations of match selections"""
        varied_matches = []
        
        for match in matches:
            # Create a copy of the match
            varied_match = match.copy()
            
            # Apply variation based on index
            if variation_index % 3 == 0:
                # Vary odds slightly
                varied_match['selected_market']['odds'] *= np.random.uniform(0.95, 1.05)
            elif variation_index % 3 == 1:
                # Vary home advantage
                varied_match['home_advantage'] *= np.random.uniform(0.9, 1.1)
            else:
                # Vary goal averages
                varied_match['home_avg_goals'] *= np.random.uniform(0.9, 1.1)
                varied_match['away_avg_goals'] *= np.random.uniform(0.9, 1.1)
            
            varied_matches.append(varied_match)
        
        return varied_matches