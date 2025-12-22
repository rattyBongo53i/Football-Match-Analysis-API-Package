# game_engine/engine/slip_builder.py

from typing import List, Dict, Any
from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer
from .scoring import ScoringEngine

# Using relative imports to access the foundational utilities
from ..utils import MathUtils, EngineHelpers


class SlipBuilder:
    """
    The main orchestrator for the Game Engine.
    Transforms raw match data into an optimized portfolio of the top 50 
    highest-quality betting slips from a pool of 100 generated variations.
    """

    def __init__(self):
        # Initialize the 'Brain' components
        self.prob_engine = ProbabilityEngine()
        self.simulator = MonteCarloSimulator(iterations=10000)
        self.scoring = ScoringEngine()

    def generate(self, payload: Any) -> List[Dict[str, Any]]:
        """
        Executes the analytical pipeline and selects the top 50 slips.
        """
        # Unwrap the Laravel payload
        data = payload.master_slip

        # --- 1. MATCH ANALYSIS ---
        match_sims = []
        for match in data.matches:
            # Determine 'True' probability using the model_inputs (xG, weights)
            true_prob = self.prob_engine.get_blended_probabilities(match)

            # Run Monte Carlo simulation
            sim_success = self.simulator.simulate_match(true_prob)

            match_sims.append({
                "match": match,
                "sim_success": sim_success,
                "base_odds": match.selected_market.odds
            })

        # --- 2. CANDIDATE POOL GENERATION (100 variations) ---
        candidate_pool = []
        for i in range(100):
            selected_legs = []
            cumulative_odds = 1.0
            slip_id = EngineHelpers.generate_unique_id(prefix="SLIP")

            for sim in match_sims:
                m = sim["match"]

                # Strategy: Mix primary selections with market hedges
                if i < 30:
                    market_obj = m.selected_market
                    market_name = market_obj.market_type
                    selection_label = market_obj.selection
                    odds = market_obj.odds
                else:
                    market_idx = (i % len(m.full_markets))
                    alt_market = m.full_markets[market_idx]
                    opt = alt_market.options[0]
                    market_name = alt_market.market_name
                    selection_label = opt.selection or opt.score or opt.handicap or "N/A"
                    odds = opt.odds

                selected_legs.append({
                    "match_id": m.match_id,
                    "market": market_name,
                    "selection": selection_label,
                    "odds": odds
                })
                cumulative_odds *= odds

            candidate_pool.append({
                "slip_id": slip_id,
                "legs": selected_legs,
                "total_odds": round(cumulative_odds, 2),
                "confidence_score": self.scoring.calculate_confidence_score(match_sims)
            })

        # --- 3. HIERARCHICAL SELECTION (Top 50) ---
        # We rank the 100 slips first to find the "Best of the Best"
        ranked_pool = self.scoring.rank_slips(candidate_pool)
        top_50_slips = ranked_pool[:50]

        # --- 4. STAKE DISTRIBUTION (Optimized for the 50) ---
        # We redistribute the total stake across only the top 50 survivors
        confidences = [s["confidence_score"] for s in top_50_slips]
        distributed_stakes = CoverageOptimizer.distribute_stake(
            total_stake=data.stake,
            num_slips=50,
            confidence_scores=confidences
        )

        # --- 5. FINAL ASSEMBLY ---
        final_portfolio = []
        for i, slip in enumerate(top_50_slips):
            slip["stake"] = EngineHelpers.format_money(distributed_stakes[i])
            slip["possible_return"] = EngineHelpers.format_money(slip["stake"] * slip["total_odds"])
            slip["risk_level"] = self.scoring.assign_risk_category(slip["confidence_score"])
            final_portfolio.append(slip)

        return final_portfolio