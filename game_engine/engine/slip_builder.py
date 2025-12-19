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
    It transforms raw match data from Laravel into a structured portfolio
    of 100+ optimized and hedged betting slips.
    """

    def __init__(self):
        # Initialize the 'Brain' components
        self.prob_engine = ProbabilityEngine()
        self.simulator = MonteCarloSimulator(iterations=10000)
        self.scoring = ScoringEngine()

    def generate(self, payload: Any) -> List[Dict[str, Any]]:
        """
        Executes the full analytical pipeline.
        Note: Accesses data via payload.master_slip based on our MasterSlipRequest schema.
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

        # --- 2. PORTFOLIO GENERATION (100 variations) ---
        raw_slips = []
        for i in range(100):
            selected_legs = []
            cumulative_odds = 1.0

            # Use helper for consistent ID generation
            slip_id = EngineHelpers.generate_unique_id(prefix="SLIP")

            for sim in match_sims:
                m = sim["match"]

                # Logic: Use the 'Selected Market' for 30% of slips (Core Strategy)
                # Use 'Full Markets' for 70% of slips (Hedging Strategy)
                if i < 30:
                    market_obj = m.selected_market
                    market_name = market_obj.market_type
                    selection_label = market_obj.selection
                    odds = market_obj.odds
                else:
                    # Pick a different market from the full list to create coverage
                    # We cycle through full_markets based on index 'i'
                    market_idx = (i % len(m.full_markets))
                    alt_market = m.full_markets[market_idx]

                    # Pick the first option in that market
                    opt = alt_market.options[0]
                    market_name = alt_market.market_name

                    # Dynamic label based on what's available (Score, Handicap, or Selection)
                    selection_label = opt.selection or opt.score or opt.handicap or "N/A"
                    odds = opt.odds

                selected_legs.append({
                    "match_id": m.match_id,
                    "market": market_name,
                    "selection": selection_label,
                    "odds": odds
                })
                cumulative_odds *= odds

            raw_slips.append({
                "slip_id": slip_id,
                "legs": selected_legs,
                "total_odds": round(cumulative_odds, 2),
                # Score the slip based on the combined simulation results
                "confidence_score": self.scoring.calculate_confidence_score(match_sims)
            })

        # --- 3. STAKE DISTRIBUTION (COVERAGE) ---
        confidences = [s["confidence_score"] for s in raw_slips]
        distributed_stakes = CoverageOptimizer.distribute_stake(
            total_stake=data.stake,
            num_slips=100,
            confidence_scores=confidences
        )

        # --- 4. FINAL ASSEMBLY & RANKING ---
        final_slips = []
        for i, slip in enumerate(raw_slips):
            slip["stake"] = EngineHelpers.format_money(distributed_stakes[i])
            slip["possible_return"] = EngineHelpers.format_money(slip["stake"] * slip["total_odds"])

            # Assign risk category based on confidence
            slip["risk_level"] = self.scoring.assign_risk_category(slip["confidence_score"])
            final_slips.append(slip)

        # Return sorted by confidence (highest first)
        return self.scoring.rank_slips(final_slips)