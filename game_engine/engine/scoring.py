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

    @staticmethod
    def calculate_confidence_score(match_sim_results: List[Dict[str, Any]]) -> float:
        """
        Generates a 0.0 to 1.0 score representing the reliability of a slip.
        It considers:
        1. Average simulated success rate of all legs.
        2. Market agreement (low variance between our prob and market prob).
        """
        if not match_sim_results:
            return 0.0

        total_sim_success = sum(m['sim_success'] for m in match_sim_results)
        avg_success = total_sim_success / len(match_sim_results)

        # Market validation: If our simulation is wildly different from the odds, 
        # it might be a 'Value' bet, but confidence is actually lower due to high variance.
        # We penalize extreme outliers to keep 'High Confidence' slips stable.
        variance_penalty = 0.0
        for m in match_sim_results:
            market_implied = 1 / m['match'].markets[0].odds
            variance_penalty += abs(m['sim_success'] - market_implied)
        
        normalized_penalty = (variance_penalty / len(match_sim_results)) * 0.2
        
        confidence = avg_success - normalized_penalty
        return max(0.0, min(1.0, round(confidence, 4)))

    @staticmethod
    def rank_slips(slips: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sorts generated slips so Laravel receives the 'best' options first.
        Ranking criteria:
        - Primary: Confidence Score (Probability of winning)
        - Secondary: Possible Return (Reward for the risk)
        """
        # We use a lambda to sort by confidence descending, then return descending
        return sorted(
            slips, 
            key=lambda x: (x['confidence_score'], x['possible_return']), 
            reverse=True
        )

    @staticmethod
    def assign_risk_category(confidence: float) -> str:
        """
        Labels a slip based on its statistical profile.
        Useful for Laravel UI to display tags like 'Safe' or 'High Risk'.
        """
        if confidence >= 0.75:
            return "LOW_RISK"
        elif confidence >= 0.40:
            return "MODERATE_RISK"
        else:
            return "HIGH_RISK"