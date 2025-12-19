from typing import List

class CoverageOptimizer:
    """
    Ensures that our 100 slips are not all identical.
    It distributes the 'Master Stake' across different outcomes 
    to guarantee that if the primary favorite fails, a secondary slip wins.
    """
    @staticmethod
    def distribute_stake(total_stake: float, num_slips: int, confidence_scores: List[float]) -> List[float]:
        # Weighted distribution: Higher confidence slips get slightly more stake
        total_conf = sum(confidence_scores)
        # Use a flat base + a variable bonus to ensure even small slips have value
        base_stake = (total_stake * 0.4) / num_slips
        variable_pool = total_stake * 0.6
        
        stakes = [
            round(base_stake + (variable_pool * (conf / total_conf)), 2)
            for conf in confidence_scores
        ]
        return stakes