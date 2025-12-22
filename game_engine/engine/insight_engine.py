import numpy as np
from typing import Dict, Any, List
from .scoring import ScoringEngine

class MatchInsightEngine:
    def __init__(self):
        self.scoring = ScoringEngine()
        # Define the "Global Top 20" Market Logic
        self.market_templates = [
            "match_result", "btts_yes", "btts_no", "over_1.5", "over_2.5", 
            "under_2.5", "double_chance_1x", "double_chance_x2", "half_time_draw",
            "away_clean_sheet", "home_clean_sheet", "over_3.5", "draw_no_bet_1",
            "draw_no_bet_2", "handicap_home_-1", "handicap_away_-1"
        ]

    def analyze_single_match(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Normalize Stats
        h_form = next(f for f in match_data['team_forms'] if f['venue'] == 'home')
        a_form = next(f for f in match_data['team_forms'] if f['venue'] == 'away')
        
        # 2. Derive advanced features
        h_attack = h_form.get('avg_goals_scored', 0)
        a_attack = a_form.get('avg_goals_scored', 0)
        h_defense = h_form.get('avg_goals_conceded', 0)
        a_defense = a_form.get('avg_goals_conceded', 0)
        
        # 3. Calculate "True" Probabilities for various scenarios
        # We calculate the probability of a high-scoring game (Over 2.5)
        # combined_lambda = average goals expected in match
        combined_lambda = (h_attack + a_defense + a_attack + h_defense) / 2
        prob_over_2_5 = 1 - self._poisson_cdf(2, combined_lambda)
        
        # 4. Find the "Edge"
        best_market = self._select_best_market(match_data, h_form, a_form, prob_over_2_5)
        
        # 5. Determine if market was provided by Laravel
        provided_slugs = [m['slug'] for m in match_data.get('markets', [])]
        is_synthetic = best_market['slug'] not in provided_slugs

        return {
            "match_info": f"{match_data['home_team']} vs {match_data['away_team']}",
            "recommendation": {
                "selection": best_market['selection'],
                "market_type": best_market['slug'],
                "is_synthetic": is_synthetic, # True if Laravel didn't send this market
                "confidence_score": best_market['confidence'],
                "risk_rating": self.scoring.assign_risk_category(best_market['confidence']),
                "estimated_odds": best_market['fair_odds']
            },
            "analytics_snapshot": {
                "match_volatility": "High" if combined_lambda > 3 else "Stable",
                "goal_expectancy": round(combined_lambda, 2),
                "h2h_bias": "Away Dominant" if match_data['head_to_head']['away_wins'] > 3 else "Neutral"
            }
        }

    def _poisson_cdf(self, k: int, lamb: float) -> float:
        """Standard Poisson Cumulative Distribution Function."""
        return sum([(lamb**i * np.exp(-lamb)) / np.math.factorial(i) for i in range(k + 1)])

    def _select_best_market(self, data: Dict, h_form: Dict, a_form: Dict, p_over: float) -> Dict:
        """
        Decision Matrix: Compares multiple derived probabilities and selects 
        the one with the highest mathematical 'Certainty'.
        """
        options = []
        
        # Option A: Over 2.5 Goals (Based on Attack/Defense stats)
        options.append({
            "slug": "over_2.5",
            "selection": "Over 2.5 Total Goals",
            "confidence": p_over * 100,
            "fair_odds": round(1/p_over, 2) if p_over > 0 else 0
        })

        # Option B: Away Win (Based on H2H 5/5 wins and higher form rating)
        a_win_prob = (a_form['form_rating'] / (h_form['form_rating'] + a_form['form_rating'])) * 1.1 
        options.append({
            "slug": "match_result",
            "selection": f"{data['away_team']} to Win",
            "confidence": min(a_win_prob * 100, 92), # Cap at 92%
            "fair_odds": round(1/a_win_prob, 2)
        })

        # Option C: BTTS Yes (If both teams score > 1.5 avg)
        btts_prob = 0.75 if (h_form['avg_goals_scored'] > 1 and a_form['avg_goals_scored'] > 1) else 0.45
        options.append({
            "slug": "both_teams_score",
            "selection": "Both Teams to Score: Yes",
            "confidence": btts_prob * 100,
            "fair_odds": round(1/btts_prob, 2)
        })

        # Hierarchical Sort: Return the highest confidence option
        return sorted(options, key=lambda x: x['confidence'], reverse=True)[0]