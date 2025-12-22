# game_engine/engine/coverage.py

from typing import List

class CoverageOptimizer:
    """
    Optimizes stake distribution across a refined portfolio.
    Shifts from 100-slip flat distribution to an aggressive 50-slip 
    weighted model that prioritizes high-conviction outcomes.
    """
    @staticmethod
    def distribute_stake(total_stake: float, num_slips: int, confidence_scores: List[float]) -> List[float]:
        """
        Distributes the Master Stake using a 30/70 Power-Weighted Split.
        30% is spread evenly (Base Floor).
        70% is spread based on the square of the confidence (Performance Bonus).
        """
        if not confidence_scores or num_slips == 0:
            return []

        # 1. Establish the 'Base Floor' (30% of total stake)
        # This ensures every slip has enough money to be worth the user's time.
        base_pool = total_stake * 0.30
        stake_floor = base_pool / num_slips
        
        # 2. Establish the 'Performance Pool' (70% of total stake)
        performance_pool = total_stake * 0.70
        
        # 3. Calculate Power-Weights
        # Squaring the confidence score (conf^2) creates a steeper curve,
        # giving significantly more to the top-ranked slips.
        power_weights = [score ** 2 for score in confidence_scores]
        total_weight = sum(power_weights)
        
        # 4. Generate the final distribution
        stakes = []
        for i in range(num_slips):
            # Calculate the bonus from the performance pool
            weight_ratio = power_weights[i] / total_weight
            bonus = performance_pool * weight_ratio
            
            # Combine floor and bonus
            final_amount = round(stake_floor + bonus, 2)
            stakes.append(final_amount)

        # 5. Final Adjustment (Floating Point Correction)
        # Ensures the sum of stakes matches the total_stake exactly.
        diff = round(total_stake - sum(stakes), 2)
        if diff != 0 and len(stakes) > 0:
            stakes[0] = round(stakes[0] + diff, 2)

        return stakes