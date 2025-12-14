# python_generator/statistical_predictor.py

import numpy as np
from typing import Dict, Any

class StatisticalPredictor:
    """Statistical prediction methods for Monte Carlo simulations"""
    
    def __init__(self):
        self.config = {
            'home_advantage': 0.1,
            'form_weight': 0.4,
            'h2h_weight': 0.3,
            'odds_weight': 0.3
        }
    
    def predict(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate statistical prediction for a match"""
        # Extract data
        home_form = match_data.get('home_form', {})
        away_form = match_data.get('away_form', {})
        h2h_data = match_data.get('head_to_head', {})
        odds = match_data.get('odds', {})
        
        # Base probabilities
        home_base = 0.33
        draw_base = 0.34
        away_base = 0.33
        
        # Adjust for form
        home_form_rating = home_form.get('form_rating', 5.0)
        away_form_rating = away_form.get('form_rating', 5.0)
        form_advantage = (home_form_rating - away_form_rating) / 10  # Normalize to -1 to 1
        
        home_base += form_advantage * self.config['form_weight']
        away_base -= form_advantage * self.config['form_weight']
        
        # Adjust for head-to-head
        if h2h_data:
            total_meetings = h2h_data.get('total_meetings', 0)
            if total_meetings > 0:
                home_wins = h2h_data.get('home_wins', 0)
                away_wins = h2h_data.get('away_wins', 0)
                draws = h2h_data.get('draws', 0)
                
                h2h_home_advantage = (home_wins - away_wins) / total_meetings
                
                home_base += h2h_home_advantage * self.config['h2h_weight']
                away_base -= h2h_home_advantage * self.config['h2h_weight']
        
        # Adjust for home advantage
        home_base += self.config['home_advantage']
        away_base -= self.config['home_advantage'] * 0.7
        draw_base -= self.config['home_advantage'] * 0.3
        
        # Ensure non-negative
        home_base = max(0.05, home_base)
        draw_base = max(0.05, draw_base)
        away_base = max(0.05, away_base)
        
        # Normalize
        total = home_base + draw_base + away_base
        home_prob = home_base / total
        draw_prob = draw_base / total
        away_prob = away_base / total
        
        # Determine prediction
        max_prob = max(home_prob, draw_prob, away_prob)
        if max_prob == home_prob:
            prediction = 'home'
        elif max_prob == away_prob:
            prediction = 'away'
        else:
            prediction = 'draw'
        
        # Calculate confidence
        confidence = abs(home_prob - away_prob) * 2  # Higher difference = more confident
        
        return {
            'probabilities': {
                'home': round(home_prob, 3),
                'draw': round(draw_prob, 3),
                'away': round(away_prob, 3)
            },
            'prediction': prediction,
            'confidence': min(0.95, max(0.3, confidence)),
            'method': 'statistical'
        }