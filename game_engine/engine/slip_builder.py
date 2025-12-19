# game_engine/engine/slip_builder.py

from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer
from .scoring import ScoringEngine
from ..utils import EngineHelpers, MathUtils

from typing import Any

class SlipBuilder:
    def __init__(self):
        self.prob_engine = ProbabilityEngine()
        self.simulator = MonteCarloSimulator()
        self.scoring = ScoringEngine()

    def generate(self, payload: Any) -> list:
        # Access the inner data from the "master_slip" wrapper
        data = payload.master_slip
        match_sims = []

        # 1. Analyze matches using the rich data
        for m in data.matches:
            true_p = self.prob_engine.get_blended_probabilities(m)
            sim_success = self.simulator.simulate_match(true_p)
            
            match_sims.append({
                "match": m,
                "sim_success": sim_success,
                "base_odds": m.selected_market.odds
            })

        # 2. Generate 100 Variations
        slips = []
        for i in range(100):
            legs = []
            total_odds = 1.0
            
            for sim in match_sims:
                m = sim["match"]
                # For the first 30 slips, we use the "Master Selection" (High confidence)
                # For the rest, we pick from "full_markets" to ensure coverage
                if i < 30:
                    sel = m.selected_market
                    market_name = sel.market_type
                    selection_label = sel.selection
                    odds = sel.odds
                else:
                    # Logic to pick a 'hedge' market from full_markets
                    # For example, if master is 1X2 Home, hedge with 'both_teams_to_score'
                    alt_market = m.full_markets[-1] # Simplification
                    sel = alt_market.options[0]
                    market_name = alt_market.market_name
                    selection_label = sel.selection or sel.score or "Outcome"
                    odds = sel.odds

                legs.append({
                    "match_id": m.match_id,
                    "market": market_name,
                    "selection": selection_label,
                    "odds": odds
                })
                total_odds *= odds

            slips.append({
                "slip_id": EngineHelpers.generate_unique_id(),
                "legs": legs,
                "total_odds": round(total_odds, 2),
                "confidence_score": self.scoring.calculate_confidence_score(match_sims)
            })

        # 3. Stake Distribution
        confidences = [s["confidence_score"] for s in slips]
        stakes = CoverageOptimizer.distribute_stake(data.stake, 100, confidences)

        for i, slip in enumerate(slips):
            slip["stake"] = EngineHelpers.format_money(stakes[i])
            slip["possible_return"] = EngineHelpers.format_money(slip["stake"] * slip["total_odds"])
            slip["risk_level"] = self.scoring.assign_risk_category(slip["confidence_score"])

        return self.scoring.rank_slips(slips)