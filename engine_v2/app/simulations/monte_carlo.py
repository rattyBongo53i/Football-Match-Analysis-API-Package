# services/simulation/monte_carlo.py - Optimized implementation
# A. Move Intensive Operations to Background Workers
# Instead of running Monte Carlo simulations in request handlers, use a task queue:
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass
import asyncio

@dataclass
class SimulationConfig:
    iterations: int = 10000
    confidence_level: float = 0.95
    risk_tolerance: float = 0.1

class MonteCarloSimulator:
    def __init__(self, config: SimulationConfig = None):
        self.config = config or SimulationConfig()
        
    async def run_batch_simulations(
        self, 
        matches: List[Dict],
        market_odds: Dict,
        stake: float
    ) -> Dict:
        """Run parallel Monte Carlo simulations for multiple matches"""
        tasks = [
            self._simulate_single_match(match, market_odds, stake)
            for match in matches
        ]
        results = await asyncio.gather(*tasks)
        return self._aggregate_results(results)
    
    async def _simulate_single_match(self, match: Dict, odds: Dict, stake: float):
        """Simulate a single match with vectorized operations"""
        # Use NumPy for vectorized operations instead of loops
        outcomes = np.random.choice(
            [0, 1, 2],  # Home win, Draw, Away win
            size=self.config.iterations,
            p=self._calculate_probabilities(match)
        )
        
        # Calculate returns
        returns = np.where(
            outcomes == 0, stake * odds['home'] - stake,
            np.where(outcomes == 1, stake * odds['draw'] - stake,
                    stake * odds['away'] - stake)
        )
        
        return {
            'expected_value': np.mean(returns),
            'std_deviation': np.std(returns),
            'risk_of_ruin': self._calculate_risk_of_ruin(returns),
            'percentile_analysis': self._percentile_analysis(returns)
        }