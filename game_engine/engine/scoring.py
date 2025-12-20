from typing import List, Dict, Any
import math

class ScoringEngine:
    """
    Evaluates and ranks generated slips based on Expected Value (EV),
    Confidence, and Risk-to-Reward ratios.
    """

    @staticmethod
    def calculate_edge(simulated_prob: float, market_odds: float) -> float:
        """
        Calculates the 'Edge' or Expected Value (EV).
        Formula: (Probability * Odds) - 1
        A positive result indicates the selection is underpriced by the bookmaker.
        """
        if market_odds <= 1.0:
            return 0.0
        
        # EV calculation: If we run this match 100 times, how much do we keep?
        edge = (simulated_prob * market_odds) - 1
        return round(edge, 4)

    def calculate_confidence_score(self, match_sims: List[Dict[str, Any]]) -> float:
        """
        Calculates a score from 0-100 based on simulation success 
        and market value.
        """
        total_score = 0
        
        for m in match_sims:
            # sim_success is the % of 10,000 iterations that hit
            sim_success_rate = m['sim_success'] 
            
            # FIX: Changed m['match'].markets[0].odds to m['match'].selected_market.odds
            market_odds = m['match'].selected_market.odds
            
            # Implied probability from the bookmaker
            market_implied = 1 / market_odds
            
            # A 'Value' score: How much higher is our simulation than the bookie's odds?
            value_gap = max(0, sim_success_rate - market_implied)
            
            # Weight: 80% on pure simulation hit rate, 20% on the 'value' found
            match_score = (sim_success_rate * 80) + (value_gap * 20)
            total_score += match_score

        # Average across all matches in the slip
        avg_score = total_score / len(match_sims)
        return round(avg_score, 2)

    def assign_risk_category(self, confidence_score: float) -> str:
        if confidence_score > 75:
            return "Low Risk"
        elif confidence_score > 50:
            return "Medium Risk"
        else:
            return "High Risk"

    def rank_slips(self, slips: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Sorts slips so Laravel receives the best ones first
        return sorted(slips, key=lambda x: x['confidence_score'], reverse=True)