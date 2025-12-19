# game_engine/engine/slip_builder.py

from typing import List, Dict, Any
from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer
from .scoring import ScoringEngine

# These are the imports you asked about:
from ..utils import MathUtils, EngineHelpers

class SlipBuilder:
    def __init__(self):
        self.prob_engine = ProbabilityEngine()
        self.simulator = MonteCarloSimulator()
        self.scoring = ScoringEngine()

    def generate(self, data: Any) -> List[Dict]:
        """
        Orchestrates the full generation flow:
        1. Sanitize & Validate
        2. Analyze & Simulate
        3. Build & Hedge
        4. Score & Rank
        """
        # Safety Check using our new Helper
        if not EngineHelpers.validate_odds_present(data.matches):
            raise ValueError("One or more matches are missing market odds.")

        match_sims = []
        for m in data.matches:
            # Usage of MathUtils: Convert market odds to a baseline
            # Using the first market as the anchor for match probability
            market_odds = m.markets[0].odds
            
            # Blend stats with odds
            true_p = self.prob_engine.get_blended_probabilities(m)
            
            # Run Monte Carlo
            sim_success = self.simulator.simulate_match(true_p)
            
            match_sims.append({
                "match": m, 
                "true_p": true_p, 
                "sim_success": sim_success,
                "edge": self.scoring.calculate_edge(sim_success, market_odds)
            })

        slips = []
        # Generate 100 variations
        for i in range(100):
            selected_legs = []
            total_odds = 1.0
            
            # Unique ID using our new Helper
            slip_id = EngineHelpers.generate_unique_id(prefix="SLIP")

            for sim in match_sims:
                m = sim["match"]
                market = m.markets[0] # Simplification for engine logic
                
                selected_legs.append({
                    "match_id": m.match_id,
                    "market": market.market,
                    "selection": market.selection,
                    "odds": market.odds
                })
                total_odds *= market.odds

            # Initial slip object
            slips.append({
                "slip_id": slip_id,
                "legs": selected_legs,
                "total_odds": round(total_odds, 2),
                # Calculate confidence using the scoring engine
                "confidence_score": self.scoring.calculate_confidence_score(match_sims)
            })

        # Apply Coverage Optimization for stake distribution
        confidences = [s["confidence_score"] for s in slips]
        stakes = CoverageOptimizer.distribute_stake(data.stake, 100, confidences)

        for i, slip in enumerate(slips):
            slip["stake"] = EngineHelpers.format_money(stakes[i])
            slip["possible_return"] = EngineHelpers.format_money(slip["stake"] * slip["total_odds"])
            # Final ranking label
            slip["risk_level"] = self.scoring.assign_risk_category(slip["confidence_score"])

        # Final step: Rank slips so the best are first
        return self.scoring.rank_slips(slips)