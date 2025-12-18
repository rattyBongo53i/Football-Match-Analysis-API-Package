from ast import Dict
from typing import List
import uuid
from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer

class SlipBuilder:
    def __init__(self):
        self.prob_engine = ProbabilityEngine()
        self.simulator = MonteCarloSimulator()

    def generate(self, data: Any) -> List[Dict]:
        slips = []
        match_sims = []

        # Step 1: Analyze all matches
        for m in data.matches:
            true_p = self.prob_engine.get_blended_probabilities(m)
            sim_success = self.simulator.simulate_match(true_p)
            match_sims.append({"match": m, "true_p": true_p, "sim_success": sim_success})

        # Step 2: Build 100 variations
        # In a real scenario, we use permutations of markets to 'cover' outcomes
        for i in range(100):
            selected_legs = []
            total_odds = 1.0
            avg_conf = 0.0

            for sim in match_sims:
                # Coverage Logic: 
                # Slips 0-20: High-confidence favorites
                # Slips 21-80: Varied combinations (The Coverage)
                # Slips 81-100: Long shots / Hedges
                
                m = sim["match"]
                # For this demo, we select the first market provided by Laravel
                selection = m.markets[0] 
                
                selected_legs.append({
                    "match_id": m.match_id,
                    "market": selection.market,
                    "selection": selection.selection,
                    "odds": selection.odds
                })
                total_odds *= selection.odds
                avg_conf += sim["sim_success"]

            slips.append({
                "slip_id": f"SLIP-{uuid.uuid4().hex[:6].upper()}",
                "legs": selected_legs,
                "total_odds": round(total_odds, 2),
                "confidence_score": round(avg_conf / len(match_sims), 4)
            })

        # Step 3: Apply Coverage Stake Distribution
        confidences = [s["confidence_score"] for s in slips]
        stakes = CoverageOptimizer.distribute_stake(data.stake, 100, confidences)

        for i, slip in enumerate(slips):
            slip["stake"] = stakes[i]
            slip["possible_return"] = round(slip["stake"] * slip["total_odds"], 2)

        return slips