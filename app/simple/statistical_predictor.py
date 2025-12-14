# python_backend/app/statistical_predictor.py
import random

class StatisticalPredictor:
    def __init__(self):
        pass
    
    def predict(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make statistical prediction"""
        return {
            "prediction": random.choice(["home", "draw", "away"]),
            "confidence": random.uniform(0.5, 0.9),
            "probabilities": {
                "home": random.uniform(0.2, 0.6),
                "draw": random.uniform(0.2, 0.4),
                "away": random.uniform(0.2, 0.6)
            },
            "method": "statistical"
        }