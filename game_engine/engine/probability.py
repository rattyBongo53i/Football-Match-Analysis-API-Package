import numpy as np

class ProbabilityEngine:
    """
    Blends Implied Odds with Statistical Form to create 
    a 'True Probability' distribution for a match.
    """
    @staticmethod
    def get_blended_probabilities(match: Any) -> Dict[str, float]:
        # 1. Start with Implied Probability from Odds (1 / decimal_odds)
        # We assume the first market is usually 1X2 for baseline
        primary_market = match.markets[0]
        implied_prob = 1.0 / primary_market.odds if primary_market.odds > 0 else 0.33
        
        # 2. Statistical Weighting (simplified for engine logic)
        # If form is provided, shift the probability slightly
        form_weight = 0.0
        if match.team_form:
            # Logic: More recent wins = higher weight
            home_pts = match.team_form.get('home_points_last_5', 7.5)
            away_pts = match.team_form.get('away_points_last_5', 7.5)
            form_weight = (home_pts - away_pts) / 50.0 # Subtle shift
            
        # 3. Blend (60% Market Sentiment / 40% Stats)
        true_prob = (implied_prob * 0.6) + (form_weight * 0.4)
        
        # Ensure bounds [0.05, 0.95] to prevent deterministic simulations
        return max(0.05, min(0.95, true_prob))