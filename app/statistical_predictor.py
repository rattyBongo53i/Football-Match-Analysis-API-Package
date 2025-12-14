# python_generator/statistical_predictor.py

import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from dataclasses import dataclass
from datetime import datetime
import logging
import math

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class StatisticalPrediction:
    """Data class for statistical prediction results"""
    prediction: str  # 'home', 'draw', 'away'
    confidence: float
    probabilities: Dict[str, float]
    factors: Dict[str, float]
    method: str
    risk_level: str
    expected_goals: Dict[str, float]
    analysis: Dict[str, Any]

class StatisticalPredictor:
    """Statistical prediction methods using traditional betting models"""
    
    def __init__(self):
        # Configuration parameters
        self.config = {
            'home_advantage': 0.1,  # Base home advantage factor
            'form_weight': 0.4,     # Weight for team form
            'h2h_weight': 0.3,      # Weight for head-to-head history
            'odds_weight': 0.3,     # Weight for market odds
            'recent_form_weight': 0.7,  # Weight for recent form vs historical
            'goal_factor': 0.15,    # Weight for goal supremacy
            'momentum_factor': 0.1, # Weight for momentum
            'defense_factor': 0.25, # Weight for defensive strength
            'attack_factor': 0.25,  # Weight for attacking strength
            
            # Elo rating parameters
            'elo_k_factor': 30,     # K-factor for Elo rating updates
            'elo_spread': 400,      # Rating spread for probability calculation
            
            # Poisson distribution parameters
            'poisson_max_goals': 5,  # Maximum goals to calculate in Poisson
            
            # Confidence calculation
            'min_confidence': 0.3,
            'max_confidence': 0.95,
            'confidence_scaling': 2.0
        }
        
        # League-specific adjustments (can be extended)
        self.league_adjustments = {
            'default': {
                'home_advantage': 0.1,
                'draw_rate': 0.27,
                'avg_goals': 2.7
            },
            'premier_league': {
                'home_advantage': 0.12,
                'draw_rate': 0.25,
                'avg_goals': 2.8
            },
            'la_liga': {
                'home_advantage': 0.08,
                'draw_rate': 0.28,
                'avg_goals': 2.6
            },
            'bundesliga': {
                'home_advantage': 0.15,
                'draw_rate': 0.23,
                'avg_goals': 3.0
            },
            'serie_a': {
                'home_advantage': 0.09,
                'draw_rate': 0.30,
                'avg_goals': 2.5
            }
        }
    
    def predict(self, match_data: Dict[str, Any]) -> StatisticalPrediction:
        """
        Generate statistical prediction for a match
        
        Args:
            match_data: Dictionary containing match information
            
        Returns:
            StatisticalPrediction object with prediction results
        """
        try:
            logger.info(f"Generating statistical prediction for match data")
            
            # Extract data from match_data
            home_team = match_data.get('home_team', {})
            away_team = match_data.get('away_team', {})
            home_form = match_data.get('home_form', {})
            away_form = match_data.get('away_form', {})
            h2h_data = match_data.get('head_to_head', {})
            odds = match_data.get('odds', {})
            league = match_data.get('league', 'default').lower()
            
            # Get league-specific adjustments
            league_adj = self.league_adjustments.get(league, self.league_adjustments['default'])
            
            # Calculate base probabilities using multiple methods
            probabilities_elo = self._calculate_elo_probabilities(home_form, away_form, h2h_data)
            probabilities_form = self._calculate_form_probabilities(home_form, away_form, league_adj)
            probabilities_poisson = self._calculate_poisson_probabilities(home_form, away_form, league_adj)
            
            # Blend probabilities from different methods
            final_probabilities = self._blend_probabilities(
                probabilities_elo, 
                probabilities_form, 
                probabilities_poisson,
                odds
            )
            
            # Adjust for home advantage
            final_probabilities = self._adjust_for_home_advantage(final_probabilities, league_adj)
            
            # Determine predicted outcome
            prediction = self._determine_outcome(final_probabilities)
            
            # Calculate confidence
            confidence = self._calculate_confidence(final_probabilities, home_form, away_form, h2h_data)
            
            # Calculate expected goals
            expected_goals = self._calculate_expected_goals(home_form, away_form, league_adj)
            
            # Calculate risk level
            risk_level = self._calculate_risk_level(confidence, final_probabilities)
            
            # Generate analysis
            analysis = self._generate_analysis(
                final_probabilities, 
                home_form, 
                away_form, 
                h2h_data, 
                expected_goals
            )
            
            # Calculate influencing factors
            factors = self._calculate_factors(home_form, away_form, h2h_data)
            
            logger.info(f"Statistical prediction complete: {prediction} with {confidence:.3f} confidence")
            
            return StatisticalPrediction(
                prediction=prediction,
                confidence=confidence,
                probabilities=final_probabilities,
                factors=factors,
                method='statistical_ensemble',
                risk_level=risk_level,
                expected_goals=expected_goals,
                analysis=analysis
            )
            
        except Exception as e:
            logger.error(f"Error in statistical prediction: {str(e)}")
            # Return fallback prediction
            return self._generate_fallback_prediction()
    
    def _calculate_elo_probabilities(self, home_form: Dict[str, Any], 
                                   away_form: Dict[str, Any], 
                                   h2h_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate probabilities using Elo rating system"""
        # Get Elo ratings (or estimate from form ratings)
        home_elo = self._estimate_elo_from_form(home_form, is_home=True)
        away_elo = self._estimate_elo_from_form(away_form, is_home=False)
        
        # Adjust for head-to-head if available
        if h2h_data:
            h2h_factor = self._calculate_h2h_factor(h2h_data)
            home_elo += h2h_factor * 50  # Adjust by up to 50 Elo points
        
        # Calculate expected score (home win probability)
        expected_home = 1 / (1 + 10 ** ((away_elo - home_elo) / self.config['elo_spread']))
        
        # Calculate draw probability based on rating similarity
        rating_diff = abs(home_elo - away_elo)
        draw_prob = max(0.1, 0.3 - (rating_diff / 1000))
        
        # Calculate away probability
        expected_away = 1 - expected_home - draw_prob
        
        # Ensure probabilities are reasonable
        expected_home = max(0.05, min(0.9, expected_home))
        expected_away = max(0.05, min(0.9, expected_away))
        draw_prob = max(0.05, min(0.4, draw_prob))
        
        # Normalize
        total = expected_home + draw_prob + expected_away
        expected_home /= total
        draw_prob /= total
        expected_away /= total
        
        return {
            'home': round(expected_home, 3),
            'draw': round(draw_prob, 3),
            'away': round(expected_away, 3)
        }
    
    def _estimate_elo_from_form(self, form_data: Dict[str, Any], is_home: bool = True) -> float:
        """Estimate Elo rating from form data"""
        base_elo = 1500.0  # Default Elo rating
        
        if not form_data:
            return base_elo
        
        # Extract form metrics
        form_rating = form_data.get('form_rating', 5.0)
        form_momentum = form_data.get('form_momentum', 0.0)
        avg_goals_scored = form_data.get('avg_goals_scored', 1.2)
        avg_goals_conceded = form_data.get('avg_goals_conceded', 1.2)
        win_rate = form_data.get('wins', 0) / max(form_data.get('matches_played', 1), 1)
        
        # Calculate Elo adjustment
        elo_adjustment = 0
        
        # Form rating contribution (0-10 scale to 0-500 Elo points)
        elo_adjustment += (form_rating - 5.0) * 100
        
        # Momentum contribution
        elo_adjustment += form_momentum * 50
        
        # Goal difference contribution
        goal_difference = avg_goals_scored - avg_goals_conceded
        elo_adjustment += goal_difference * 75
        
        # Win rate contribution
        elo_adjustment += (win_rate - 0.33) * 200
        
        # Home/away adjustment
        if is_home:
            elo_adjustment += 50  # Home advantage in Elo
        
        final_elo = base_elo + elo_adjustment
        
        # Constrain to reasonable range
        return max(1000, min(2000, final_elo))
    
    def _calculate_h2h_factor(self, h2h_data: Dict[str, Any]) -> float:
        """Calculate head-to-head adjustment factor"""
        total_meetings = h2h_data.get('total_meetings', 0)
        
        if total_meetings == 0:
            return 0.0
        
        home_wins = h2h_data.get('home_wins', 0)
        away_wins = h2h_data.get('away_wins', 0)
        
        # Calculate win difference normalized by total meetings
        win_difference = (home_wins - away_wins) / total_meetings
        
        # Weight by sample size (more meetings = more reliable)
        sample_weight = min(1.0, total_meetings / 10)
        
        return win_difference * sample_weight
    
    def _calculate_form_probabilities(self, home_form: Dict[str, Any], 
                                    away_form: Dict[str, Any], 
                                    league_adj: Dict[str, float]) -> Dict[str, float]:
        """Calculate probabilities based on team form"""
        
        if not home_form or not away_form:
            # Default probabilities if no form data
            return {
                'home': 0.33 + league_adj['home_advantage'],
                'draw': league_adj['draw_rate'],
                'away': 0.33 - league_adj['home_advantage'] * 0.7
            }
        
        # Extract form metrics
        home_rating = home_form.get('form_rating', 5.0)
        away_rating = away_form.get('form_rating', 5.0)
        
        home_momentum = home_form.get('form_momentum', 0.0)
        away_momentum = away_form.get('form_momentum', 0.0)
        
        home_goals_scored = home_form.get('avg_goals_scored', 1.2)
        away_goals_scored = away_form.get('avg_goals_scored', 1.2)
        
        home_goals_conceded = home_form.get('avg_goals_conceded', 1.2)
        away_goals_conceded = away_form.get('avg_goals_conceded', 1.2)
        
        # Calculate rating difference
        rating_diff = home_rating - away_rating
        
        # Calculate momentum difference
        momentum_diff = home_momentum - away_momentum
        
        # Calculate goal supremacy
        home_goal_supremacy = home_goals_scored - away_goals_conceded
        away_goal_supremacy = away_goals_scored - home_goals_conceded
        goal_diff = home_goal_supremacy - away_goal_supremacy
        
        # Calculate form-based probabilities
        home_advantage = league_adj['home_advantage']
        
        # Base probability from rating difference (normalized to -1 to 1)
        rating_factor = rating_diff / 10  # Since rating is 0-10 scale
        
        # Momentum factor
        momentum_factor = momentum_diff * 0.5  # Scale momentum
        
        # Goal factor
        goal_factor = goal_diff * 0.2  # Scale goal difference
        
        # Calculate probability adjustments
        home_prob_adjust = (
            home_advantage +
            rating_factor * self.config['form_weight'] +
            momentum_factor * self.config['momentum_factor'] +
            goal_factor * self.config['goal_factor']
        )
        
        # Apply adjustments
        home_prob = 0.33 + home_prob_adjust
        away_prob = 0.33 - home_prob_adjust * 0.7  # Away gets less negative impact
        draw_prob = league_adj['draw_rate'] - home_prob_adjust * 0.3
        
        # Ensure reasonable values
        home_prob = max(0.05, min(0.9, home_prob))
        away_prob = max(0.05, min(0.9, away_prob))
        draw_prob = max(0.05, min(0.4, draw_prob))
        
        # Normalize
        total = home_prob + draw_prob + away_prob
        home_prob /= total
        draw_prob /= total
        away_prob /= total
        
        return {
            'home': round(home_prob, 3),
            'draw': round(draw_prob, 3),
            'away': round(away_prob, 3)
        }
    
    def _calculate_poisson_probabilities(self, home_form: Dict[str, Any], 
                                       away_form: Dict[str, Any], 
                                       league_adj: Dict[str, float]) -> Dict[str, float]:
        """Calculate probabilities using Poisson distribution for goals"""
        
        # Estimate goal expectations
        home_attack = home_form.get('avg_goals_scored', 1.2)
        away_defense = away_form.get('avg_goals_conceded', 1.2)
        away_attack = away_form.get('avg_goals_scored', 1.2)
        home_defense = home_form.get('avg_goals_conceded', 1.2)
        
        # Adjust for league average
        league_avg = league_adj['avg_goals']
        home_attack = (home_attack / 2.7) * league_avg  # Normalize to league
        away_defense = (away_defense / 2.7) * league_avg
        away_attack = (away_attack / 2.7) * league_avg
        home_defense = (home_defense / 2.7) * league_avg
        
        # Calculate expected goals using attack/defense model
        home_expected = home_attack * (1 - (away_defense / (2 * league_avg)))
        away_expected = away_attack * (1 - (home_defense / (2 * league_avg)))
        
        # Apply home advantage
        home_expected *= (1 + league_adj['home_advantage'])
        away_expected *= (1 - league_adj['home_advantage'] * 0.7)
        
        # Ensure reasonable values
        home_expected = max(0.2, min(4.0, home_expected))
        away_expected = max(0.2, min(4.0, away_expected))
        
        # Calculate probabilities using Poisson distribution
        max_goals = self.config['poisson_max_goals']
        
        # Calculate probability of each score combination
        home_win_prob = 0.0
        draw_prob = 0.0
        away_win_prob = 0.0
        
        for i in range(max_goals + 1):  # Home goals
            home_prob = self._poisson_probability(i, home_expected)
            for j in range(max_goals + 1):  # Away goals
                away_prob = self._poisson_probability(j, away_expected)
                score_prob = home_prob * away_prob
                
                if i > j:
                    home_win_prob += score_prob
                elif i == j:
                    draw_prob += score_prob
                else:
                    away_win_prob += score_prob
        
        # Normalize (since we truncated at max_goals)
        total = home_win_prob + draw_prob + away_win_prob
        
        if total > 0:
            home_win_prob /= total
            draw_prob /= total
            away_win_prob /= total
        
        return {
            'home': round(home_win_prob, 3),
            'draw': round(draw_prob, 3),
            'away': round(away_win_prob, 3)
        }
    
    def _poisson_probability(self, k: int, lambda_val: float) -> float:
        """Calculate Poisson probability P(X = k) with mean lambda"""
        if k < 0:
            return 0.0
        return (math.exp(-lambda_val) * (lambda_val ** k)) / math.factorial(k)
    
    def _blend_probabilities(self, *probability_sets: Dict[str, float], 
                           odds: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """Blend probabilities from different methods"""
        
        # Initialize blended probabilities
        blended = {'home': 0.0, 'draw': 0.0, 'away': 0.0}
        total_weight = 0.0
        
        # Method 1: Elo probabilities (weight: 0.4)
        if len(probability_sets) > 0:
            weight = 0.4
            for outcome in blended:
                blended[outcome] += probability_sets[0].get(outcome, 0.33) * weight
            total_weight += weight
        
        # Method 2: Form probabilities (weight: 0.3)
        if len(probability_sets) > 1:
            weight = 0.3
            for outcome in blended:
                blended[outcome] += probability_sets[1].get(outcome, 0.33) * weight
            total_weight += weight
        
        # Method 3: Poisson probabilities (weight: 0.3)
        if len(probability_sets) > 2:
            weight = 0.3
            for outcome in blended:
                blended[outcome] += probability_sets[2].get(outcome, 0.33) * weight
            total_weight += weight
        
        # Incorporate odds if available (weight: 0.3, reduces other weights)
        if odds and 'home' in odds and 'draw' in odds and 'away' in odds:
            # Calculate implied probabilities from odds
            implied_home = 1 / odds['home']
            implied_draw = 1 / odds['draw']
            implied_away = 1 / odds['away']
            
            total_implied = implied_home + implied_draw + implied_away
            
            if total_implied > 0:
                # Normalize implied probabilities
                implied_home /= total_implied
                implied_draw /= total_implied
                implied_away /= total_implied
                
                # Apply odds weight (blend with existing probabilities)
                odds_weight = 0.3
                for outcome in blended:
                    # Reduce existing weights proportionally
                    blended[outcome] *= (1 - odds_weight)
                    
                # Add odds probabilities
                blended['home'] += implied_home * odds_weight
                blended['draw'] += implied_draw * odds_weight
                blended['away'] += implied_away * odds_weight
        
        # Ensure non-negative and normalize
        for outcome in blended:
            blended[outcome] = max(0.01, blended[outcome])
        
        total = sum(blended.values())
        for outcome in blended:
            blended[outcome] /= total
        
        return {k: round(v, 3) for k, v in blended.items()}
    
    def _adjust_for_home_advantage(self, probabilities: Dict[str, float], 
                                 league_adj: Dict[str, float]) -> Dict[str, float]:
        """Adjust probabilities for home advantage"""
        home_advantage = league_adj['home_advantage']
        
        # Increase home probability, decrease away and draw
        probabilities['home'] += home_advantage
        probabilities['away'] -= home_advantage * 0.7
        probabilities['draw'] -= home_advantage * 0.3
        
        # Ensure non-negative
        for outcome in probabilities:
            probabilities[outcome] = max(0.05, probabilities[outcome])
        
        # Normalize
        total = sum(probabilities.values())
        for outcome in probabilities:
            probabilities[outcome] /= total
        
        return {k: round(v, 3) for k, v in probabilities.items()}
    
    def _determine_outcome(self, probabilities: Dict[str, float]) -> str:
        """Determine predicted outcome from probabilities"""
        max_prob = max(probabilities.values())
        
        for outcome, prob in probabilities.items():
            if prob == max_prob:
                return outcome
        
        return 'draw'  # Default fallback
    
    def _calculate_confidence(self, probabilities: Dict[str, float], 
                            home_form: Dict[str, Any], 
                            away_form: Dict[str, Any], 
                            h2h_data: Dict[str, Any]) -> float:
        """Calculate confidence in the prediction"""
        
        # Base confidence from probability spread
        max_prob = max(probabilities.values())
        min_prob = min(probabilities.values())
        prob_spread = max_prob - min_prob
        
        # Normalize spread to confidence (0-1)
        base_confidence = min(1.0, prob_spread * self.config['confidence_scaling'])
        
        # Adjust for form data quality
        form_quality = self._calculate_form_quality(home_form, away_form)
        
        # Adjust for head-to-head data quality
        h2h_quality = self._calculate_h2h_quality(h2h_data)
        
        # Calculate weighted confidence
        confidence = (
            base_confidence * 0.5 +
            form_quality * 0.3 +
            h2h_quality * 0.2
        )
        
        # Constrain to reasonable range
        confidence = max(self.config['min_confidence'], 
                        min(self.config['max_confidence'], confidence))
        
        return round(confidence, 3)
    
    def _calculate_form_quality(self, home_form: Dict[str, Any], away_form: Dict[str, Any]) -> float:
        """Calculate quality/consistency of form data"""
        home_matches = home_form.get('matches_played', 0) if home_form else 0
        away_matches = away_form.get('matches_played', 0) if away_form else 0
        
        # More matches = higher quality
        home_quality = min(1.0, home_matches / 8)
        away_quality = min(1.0, away_matches / 8)
        
        return (home_quality + away_quality) / 2
    
    def _calculate_h2h_quality(self, h2h_data: Dict[str, Any]) -> float:
        """Calculate quality of head-to-head data"""
        if not h2h_data:
            return 0.0
        
        total_meetings = h2h_data.get('total_meetings', 0)
        
        # More meetings = higher quality
        return min(1.0, total_meetings / 10)
    
    def _calculate_expected_goals(self, home_form: Dict[str, Any], 
                                away_form: Dict[str, Any], 
                                league_adj: Dict[str, float]) -> Dict[str, float]:
        """Calculate expected goals for the match"""
        
        if not home_form or not away_form:
            # Default values
            return {
                'home': round(league_adj['avg_goals'] / 2, 2),
                'away': round(league_adj['avg_goals'] / 2, 2),
                'total': round(league_adj['avg_goals'], 2)
            }
        
        # Get goal metrics
        home_attack = home_form.get('avg_goals_scored', 1.2)
        home_defense = home_form.get('avg_goals_conceded', 1.2)
        away_attack = away_form.get('avg_goals_scored', 1.2)
        away_defense = away_form.get('avg_goals_conceded', 1.2)
        
        # Normalize to league average
        league_avg = league_adj['avg_goals']
        home_attack = (home_attack / 2.7) * league_avg
        home_defense = (home_defense / 2.7) * league_avg
        away_attack = (away_attack / 2.7) * league_avg
        away_defense = (away_defense / 2.7) * league_avg
        
        # Calculate expected goals using attack/defense model
        home_expected = home_attack * (1 - (away_defense / (2 * league_avg)))
        away_expected = away_attack * (1 - (home_defense / (2 * league_avg)))
        
        # Apply home advantage
        home_expected *= (1 + league_adj['home_advantage'])
        away_expected *= (1 - league_adj['home_advantage'] * 0.7)
        
        # Ensure reasonable values
        home_expected = max(0.2, min(4.0, home_expected))
        away_expected = max(0.2, min(4.0, away_expected))
        
        return {
            'home': round(home_expected, 2),
            'away': round(away_expected, 2),
            'total': round(home_expected + away_expected, 2)
        }
    
    def _calculate_risk_level(self, confidence: float, probabilities: Dict[str, float]) -> str:
        """Calculate risk level for the prediction"""
        max_prob = max(probabilities.values())
        
        if confidence >= 0.7 and max_prob >= 0.6:
            return 'low'
        elif confidence >= 0.55 and max_prob >= 0.5:
            return 'medium'
        else:
            return 'high'
    
    def _generate_analysis(self, probabilities: Dict[str, float], 
                         home_form: Dict[str, Any], 
                         away_form: Dict[str, Any], 
                         h2h_data: Dict[str, Any],
                         expected_goals: Dict[str, float]) -> Dict[str, Any]:
        """Generate analysis and insights for the prediction"""
        
        analysis = {
            'key_factors': [],
            'strengths': [],
            'weaknesses': [],
            'match_type': 'balanced',
            'goal_expectation': 'moderate',
            'recommendations': []
        }
        
        # Analyze probabilities
        max_prob = max(probabilities.values())
        if max_prob > 0.55:
            analysis['key_factors'].append('Clear favorite identified')
        elif max_prob < 0.4:
            analysis['match_type'] = 'unpredictable'
            analysis['key_factors'].append('Highly competitive match')
        
        # Analyze form
        if home_form and away_form:
            home_rating = home_form.get('form_rating', 5.0)
            away_rating = away_form.get('form_rating', 5.0)
            
            if home_rating - away_rating > 1.0:
                analysis['strengths'].append('Home team has significant form advantage')
            elif away_rating - home_rating > 1.0:
                analysis['strengths'].append('Away team has significant form advantage')
        
        # Analyze head-to-head
        if h2h_data:
            total_meetings = h2h_data.get('total_meetings', 0)
            if total_meetings >= 5:
                home_wins = h2h_data.get('home_wins', 0)
                away_wins = h2h_data.get('away_wins', 0)
                
                if home_wins > away_wins * 1.5:
                    analysis['key_factors'].append('Historical home advantage')
                elif away_wins > home_wins * 1.5:
                    analysis['key_factors'].append('Historical away advantage')
        
        # Analyze expected goals
        total_goals = expected_goals.get('total', 2.7)
        if total_goals > 3.0:
            analysis['goal_expectation'] = 'high'
            analysis['recommendations'].append('Consider over/under markets')
        elif total_goals < 2.0:
            analysis['goal_expectation'] = 'low'
            analysis['recommendations'].append('Consider under markets')
        
        # Add general recommendations
        confidence = self._calculate_confidence(probabilities, home_form, away_form, h2h_data)
        if confidence > 0.7:
            analysis['recommendations'].append('High confidence prediction - consider standard stake')
        elif confidence < 0.55:
            analysis['recommendations'].append('Low confidence - consider smaller stake or avoid')
        
        return analysis
    
    def _calculate_factors(self, home_form: Dict[str, Any], 
                         away_form: Dict[str, Any], 
                         h2h_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate influencing factors for the prediction"""
        factors = {
            'form_advantage': 0.0,
            'momentum_advantage': 0.0,
            'goal_supremacy': 0.0,
            'h2h_advantage': 0.0,
            'home_advantage': 0.1
        }
        
        if home_form and away_form:
            # Form advantage
            home_rating = home_form.get('form_rating', 5.0)
            away_rating = away_form.get('form_rating', 5.0)
            factors['form_advantage'] = (home_rating - away_rating) / 10  # Normalize to -1 to 1
            
            # Momentum advantage
            home_momentum = home_form.get('form_momentum', 0.0)
            away_momentum = away_form.get('form_momentum', 0.0)
            factors['momentum_advantage'] = home_momentum - away_momentum
            
            # Goal supremacy
            home_goals_scored = home_form.get('avg_goals_scored', 1.2)
            away_goals_conceded = away_form.get('avg_goals_conceded', 1.2)
            away_goals_scored = away_form.get('avg_goals_scored', 1.2)
            home_goals_conceded = home_form.get('avg_goals_conceded', 1.2)
            
            factors['goal_supremacy'] = (
                (home_goals_scored - away_goals_conceded) -
                (away_goals_scored - home_goals_conceded)
            ) / 2  # Normalize
        
        if h2h_data:
            total_meetings = h2h_data.get('total_meetings', 0)
            if total_meetings > 0:
                home_wins = h2h_data.get('home_wins', 0)
                away_wins = h2h_data.get('away_wins', 0)
                factors['h2h_advantage'] = (home_wins - away_wins) / total_meetings
        
        # Round factors
        for key in factors:
            factors[key] = round(factors[key], 3)
        
        return factors
    
    def _generate_fallback_prediction(self) -> StatisticalPrediction:
        """Generate fallback prediction when main prediction fails"""
        logger.warning("Using fallback prediction")
        
        return StatisticalPrediction(
            prediction='draw',
            confidence=0.5,
            probabilities={'home': 0.33, 'draw': 0.34, 'away': 0.33},
            factors={'form_advantage': 0.0, 'momentum_advantage': 0.0, 
                    'goal_supremacy': 0.0, 'h2h_advantage': 0.0, 'home_advantage': 0.1},
            method='fallback',
            risk_level='high',
            expected_goals={'home': 1.2, 'away': 1.2, 'total': 2.4},
            analysis={
                'key_factors': ['Using fallback prediction due to system error'],
                'strengths': [],
                'weaknesses': [],
                'match_type': 'unknown',
                'goal_expectation': 'moderate',
                'recommendations': ['Proceed with caution - prediction confidence is low']
            }
        )
    
    # Public utility methods
    
    def calculate_kelly_criterion(self, probability: float, odds: float) -> float:
        """
        Calculate Kelly Criterion stake percentage
        
        Args:
            probability: True probability of outcome
            odds: Decimal odds offered
            
        Returns:
            Kelly percentage (0-1)
        """
        if odds <= 1.0:
            return 0.0
        
        # Kelly formula: f* = (bp - q) / b
        # where b = odds - 1, p = probability, q = 1 - p
        b = odds - 1
        p = probability
        q = 1 - p
        
        kelly = (b * p - q) / b
        
        # Ensure non-negative
        kelly = max(0.0, kelly)
        
        # Conservative Kelly (half Kelly)
        return kelly * 0.5
    
    def calculate_value_bet(self, true_probability: float, odds: float, 
                          threshold: float = 0.05) -> Dict[str, Any]:
        """
        Determine if a bet offers value
        
        Args:
            true_probability: Estimated true probability
            odds: Market odds
            threshold: Minimum value threshold
            
        Returns:
            Dictionary with value analysis
        """
        implied_probability = 1 / odds
        value = true_probability - implied_probability
        value_percentage = value * 100
        
        is_value_bet = value > threshold
        kelly = self.calculate_kelly_criterion(true_probability, odds)
        
        return {
            'is_value_bet': is_value_bet,
            'value': round(value, 4),
            'value_percentage': round(value_percentage, 2),
            'true_probability': round(true_probability, 3),
            'implied_probability': round(implied_probability, 3),
            'kelly_percentage': round(kelly * 100, 2),
            'recommended_action': 'bet' if is_value_bet else 'avoid'
        }