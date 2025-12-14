# python_generator/enhanced_match_analyzer.py

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from collections import defaultdict
import statistics

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MatchAnalysis:
    """Comprehensive match analysis data class"""
    match_id: int
    home_team: str
    away_team: str
    league: str
    match_date: str
    
    # Form analysis
    home_form_rating: float
    away_form_rating: float
    form_advantage: float
    momentum_advantage: float
    
    # Goal analysis
    home_expected_goals: float
    away_expected_goals: float
    goal_supremacy: float
    both_teams_score_probability: float
    over_under_probabilities: Dict[str, float]
    
    # Head-to-head analysis
    h2h_home_wins: int
    h2h_away_wins: int
    h2h_draws: int
    h2h_home_advantage: float
    
    # Team strength analysis
    home_overall_strength: float
    away_overall_strength: float
    strength_advantage: float
    
    # Situational factors
    home_advantage_factor: float
    importance_factor: float
    fatigue_factor: float
    
    # Predictions
    probabilities: Dict[str, float]
    predicted_outcome: str
    confidence: float
    risk_level: str
    
    # Recommendations
    recommendations: List[str]
    value_bets: List[Dict[str, Any]]
    
    # Features for ML
    ml_features: Dict[str, float]
    feature_importance: Dict[str, float]

class EnhancedMatchAnalyzer:
    """Enhanced match analyzer with comprehensive feature extraction"""
    
    def __init__(self, api_base_url: str = "http://localhost:8000/api"):
        self.api_base_url = api_base_url
        
        # Configuration
        self.config = {
            'form_weights': {
                'recent': 0.4,      # Last 3 matches
                'medium': 0.3,      # Matches 4-6
                'long': 0.2,        # Matches 7-10
                'historical': 0.1   # Older than 10
            },
            'goal_analysis': {
                'attack_weight': 0.4,
                'defense_weight': 0.4,
                'home_advantage': 0.15,
                'momentum_weight': 0.05
            },
            'team_strength': {
                'form': 0.35,
                'h2h': 0.25,
                'goals': 0.20,
                'defense': 0.10,
                'consistency': 0.10
            },
            'situational_factors': {
                'home_advantage_base': 0.1,
                'home_advantage_league_multiplier': {
                    'premier_league': 1.2,
                    'la_liga': 0.9,
                    'bundesliga': 1.3,
                    'serie_a': 0.8,
                    'ligue_1': 0.7,
                    'default': 1.0
                },
                'importance_weights': {
                    'cup_final': 0.3,
                    'title_decider': 0.25,
                    'relegation': 0.2,
                    'derby': 0.15,
                    'european_qualification': 0.15,
                    'midtable': 0.05,
                    'default': 0.1
                }
            }
        }
    
    def analyze_match(self, match_data: Dict[str, Any]) -> MatchAnalysis:
        """
        Perform comprehensive match analysis
        
        Args:
            match_data: Dictionary containing match information
            
        Returns:
            MatchAnalysis object with comprehensive analysis
        """
        try:
            logger.info(f"Starting enhanced analysis for match: {match_data.get('id', 'unknown')}")
            
            # Extract basic match info
            match_id = match_data.get('id')
            home_team = match_data.get('home_team')
            away_team = match_data.get('away_team')
            league = match_data.get('league', 'default')
            match_date = match_data.get('match_date', datetime.now().isoformat())
            
            # Extract team data
            home_team_data = match_data.get('home_team_details', {})
            away_team_data = match_data.get('away_team_details', {})
            
            # Extract form data
            home_form = match_data.get('home_team_form', {})
            away_form = match_data.get('away_team_form', {})
            
            # Extract head-to-head data
            h2h_data = match_data.get('head_to_head', {})
            
            # Extract odds
            odds = match_data.get('odds', {})
            
            # Perform comprehensive analysis
            form_analysis = self._analyze_team_form(home_form, away_form, league)
            goal_analysis = self._analyze_goals(home_form, away_form, home_team_data, away_team_data)
            h2h_analysis = self._analyze_head_to_head(h2h_data)
            strength_analysis = self._analyze_team_strength(home_team_data, away_team_data, form_analysis, h2h_analysis)
            situational_analysis = self._analyze_situational_factors(match_data, home_team_data, away_team_data)
            
            # Calculate probabilities
            probabilities = self._calculate_probabilities(
                form_analysis, goal_analysis, h2h_analysis, 
                strength_analysis, situational_analysis, odds
            )
            
            # Determine outcome and confidence
            predicted_outcome = self._determine_outcome(probabilities)
            confidence = self._calculate_confidence(probabilities, form_analysis, strength_analysis)
            risk_level = self._assess_risk_level(confidence, probabilities, form_analysis)
            
            # Generate recommendations and value bets
            recommendations = self._generate_recommendations(
                probabilities, confidence, form_analysis, goal_analysis, odds
            )
            value_bets = self._identify_value_bets(probabilities, odds, confidence)
            
            # Extract ML features
            ml_features = self._extract_ml_features(
                form_analysis, goal_analysis, h2h_analysis, 
                strength_analysis, situational_analysis
            )
            feature_importance = self._calculate_feature_importance(ml_features)
            
            logger.info(f"Enhanced analysis complete for match {match_id}")
            
            return MatchAnalysis(
                match_id=match_id,
                home_team=home_team,
                away_team=away_team,
                league=league,
                match_date=match_date,
                
                # Form analysis
                home_form_rating=form_analysis['home_form_rating'],
                away_form_rating=form_analysis['away_form_rating'],
                form_advantage=form_analysis['form_advantage'],
                momentum_advantage=form_analysis['momentum_advantage'],
                
                # Goal analysis
                home_expected_goals=goal_analysis['home_expected_goals'],
                away_expected_goals=goal_analysis['away_expected_goals'],
                goal_supremacy=goal_analysis['goal_supremacy'],
                both_teams_score_probability=goal_analysis['both_teams_score_probability'],
                over_under_probabilities=goal_analysis['over_under_probabilities'],
                
                # Head-to-head analysis
                h2h_home_wins=h2h_analysis.get('home_wins', 0),
                h2h_away_wins=h2h_analysis.get('away_wins', 0),
                h2h_draws=h2h_analysis.get('draws', 0),
                h2h_home_advantage=h2h_analysis.get('home_advantage', 0),
                
                # Team strength analysis
                home_overall_strength=strength_analysis['home_strength'],
                away_overall_strength=strength_analysis['away_strength'],
                strength_advantage=strength_analysis['strength_advantage'],
                
                # Situational factors
                home_advantage_factor=situational_analysis['home_advantage'],
                importance_factor=situational_analysis['importance'],
                fatigue_factor=situational_analysis['fatigue'],
                
                # Predictions
                probabilities=probabilities,
                predicted_outcome=predicted_outcome,
                confidence=confidence,
                risk_level=risk_level,
                
                # Recommendations
                recommendations=recommendations,
                value_bets=value_bets,
                
                # ML features
                ml_features=ml_features,
                feature_importance=feature_importance
            )
            
        except Exception as e:
            logger.error(f"Error in enhanced match analysis: {str(e)}")
            raise
    
    def _analyze_team_form(self, home_form: Dict[str, Any], 
                         away_form: Dict[str, Any], 
                         league: str) -> Dict[str, Any]:
        """Analyze team form with time-weighted analysis"""
        
        # Extract form metrics
        home_form_rating = home_form.get('form_rating', 5.0)
        away_form_rating = away_form.get('form_rating', 5.0)
        
        home_momentum = home_form.get('form_momentum', 0.0)
        away_momentum = away_form.get('form_momentum', 0.0)
        
        # Calculate form advantage
        form_advantage = home_form_rating - away_form_rating
        
        # Calculate momentum advantage
        momentum_advantage = home_momentum - away_momentum
        
        # Analyze form consistency
        home_consistency = self._calculate_form_consistency(home_form)
        away_consistency = self._calculate_form_consistency(away_form)
        
        # Analyze form trends
        home_trend = self._analyze_form_trend(home_form)
        away_trend = self._analyze_form_trend(away_form)
        
        # Calculate weighted form rating
        home_weighted_rating = self._calculate_weighted_form_rating(home_form)
        away_weighted_rating = self._calculate_weighted_form_rating(away_form)
        
        return {
            'home_form_rating': round(home_form_rating, 2),
            'away_form_rating': round(away_form_rating, 2),
            'home_weighted_rating': round(home_weighted_rating, 2),
            'away_weighted_rating': round(away_weighted_rating, 2),
            'form_advantage': round(form_advantage, 2),
            'momentum_advantage': round(momentum_advantage, 3),
            'home_consistency': round(home_consistency, 3),
            'away_consistency': round(away_consistency, 3),
            'home_trend': home_trend,
            'away_trend': away_trend
        }
    
    def _calculate_form_consistency(self, form_data: Dict[str, Any]) -> float:
        """Calculate form consistency (0-1 scale)"""
        if not form_data:
            return 0.5
        
        raw_form = form_data.get('raw_form', [])
        if len(raw_form) < 3:
            return 0.5
        
        # Calculate points from last 5 matches
        points = []
        for match in raw_form[:5]:
            outcome = match.get('outcome', '')
            if outcome == 'W':
                points.append(3)
            elif outcome == 'D':
                points.append(1)
            else:
                points.append(0)
        
        if len(points) < 3:
            return 0.5
        
        # Calculate standard deviation (lower = more consistent)
        if len(points) > 1:
            std_dev = statistics.stdev(points)
            # Convert to consistency score (0-1)
            consistency = 1 - (std_dev / 3)  # Max points per match is 3
            return max(0, min(1, consistency))
        
        return 0.5
    
    def _analyze_form_trend(self, form_data: Dict[str, Any]) -> str:
        """Analyze form trend (improving, declining, stable)"""
        if not form_data:
            return 'unknown'
        
        raw_form = form_data.get('raw_form', [])
        if len(raw_form) < 4:
            return 'insufficient_data'
        
        # Calculate points for recent vs older matches
        recent_matches = raw_form[:3]
        older_matches = raw_form[3:6] if len(raw_form) >= 6 else []
        
        if not older_matches:
            return 'stable'
        
        recent_points = sum(3 if m.get('outcome') == 'W' else 1 if m.get('outcome') == 'D' else 0 
                          for m in recent_matches)
        older_points = sum(3 if m.get('outcome') == 'W' else 1 if m.get('outcome') == 'D' else 0 
                          for m in older_matches)
        
        avg_recent = recent_points / len(recent_matches)
        avg_older = older_points / len(older_matches)
        
        if avg_recent > avg_older + 0.5:
            return 'improving'
        elif avg_recent < avg_older - 0.5:
            return 'declining'
        else:
            return 'stable'
    
    def _calculate_weighted_form_rating(self, form_data: Dict[str, Any]) -> float:
        """Calculate time-weighted form rating"""
        if not form_data:
            return 5.0
        
        raw_form = form_data.get('raw_form', [])
        if not raw_form:
            return form_data.get('form_rating', 5.0)
        
        total_weight = 0
        weighted_score = 0
        
        for i, match in enumerate(raw_form[:10]):  # Last 10 matches max
            # Weight based on recency (more recent = higher weight)
            if i < 3:
                weight = self.config['form_weights']['recent']
            elif i < 6:
                weight = self.config['form_weights']['medium']
            elif i < 10:
                weight = self.config['form_weights']['long']
            else:
                weight = self.config['form_weights']['historical']
            
            # Calculate match score
            outcome = match.get('outcome', '')
            if outcome == 'W':
                score = 10
            elif outcome == 'D':
                score = 5
            else:
                score = 0
            
            weighted_score += score * weight
            total_weight += weight
        
        if total_weight > 0:
            return weighted_score / total_weight
        
        return form_data.get('form_rating', 5.0)
    
    def _analyze_goals(self, home_form: Dict[str, Any], 
                     away_form: Dict[str, Any],
                     home_team_data: Dict[str, Any],
                     away_team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze goal scoring and conceding patterns"""
        
        # Get goal metrics from form
        home_goals_scored = home_form.get('avg_goals_scored', 1.2)
        home_goals_conceded = home_form.get('avg_goals_conceded', 1.2)
        away_goals_scored = away_form.get('avg_goals_scored', 1.2)
        away_goals_conceded = away_form.get('avg_goals_conceded', 1.2)
        
        # Get team strength metrics if available
        home_attack_rating = home_team_data.get('attack_rating', 5.0)
        home_defense_rating = home_team_data.get('defense_rating', 5.0)
        away_attack_rating = away_team_data.get('attack_rating', 5.0)
        away_defense_rating = away_team_data.get('defense_rating', 5.0)
        
        # Calculate expected goals
        home_expected = (
            home_goals_scored * self.config['goal_analysis']['attack_weight'] +
            away_goals_conceded * self.config['goal_analysis']['defense_weight'] +
            (home_attack_rating / 10) * 0.1 +  # Team strength contribution
            self.config['goal_analysis']['home_advantage']
        )
        
        away_expected = (
            away_goals_scored * self.config['goal_analysis']['attack_weight'] +
            home_goals_conceded * self.config['goal_analysis']['defense_weight'] +
            (away_attack_rating / 10) * 0.1 -
            self.config['goal_analysis']['home_advantage'] * 0.7
        )
        
        # Adjust for form momentum
        home_momentum = home_form.get('form_momentum', 0.0)
        away_momentum = away_form.get('form_momentum', 0.0)
        
        home_expected *= (1 + home_momentum * self.config['goal_analysis']['momentum_weight'])
        away_expected *= (1 + away_momentum * self.config['goal_analysis']['momentum_weight'])
        
        # Ensure reasonable values
        home_expected = max(0.2, min(4.0, home_expected))
        away_expected = max(0.2, min(4.0, away_expected))
        
        # Calculate goal supremacy
        goal_supremacy = home_expected - away_expected
        
        # Calculate both teams to score probability
        both_teams_score_prob = (1 - np.exp(-home_expected)) * (1 - np.exp(-away_expected))
        
        # Calculate over/under probabilities
        over_under_probs = self._calculate_over_under_probabilities(home_expected, away_expected)
        
        return {
            'home_expected_goals': round(home_expected, 2),
            'away_expected_goals': round(away_expected, 2),
            'goal_supremacy': round(goal_supremacy, 2),
            'both_teams_score_probability': round(both_teams_score_prob, 3),
            'over_under_probabilities': over_under_probs
        }
    
    def _calculate_over_under_probabilities(self, home_expected: float, 
                                          away_expected: float) -> Dict[str, float]:
        """Calculate over/under probabilities using Poisson distribution"""
        total_expected = home_expected + away_expected
        
        # Calculate probabilities using Poisson distribution
        over_2_5 = 1 - sum(self._poisson_probability(i, total_expected) for i in range(3))
        over_3_5 = 1 - sum(self._poisson_probability(i, total_expected) for i in range(4))
        under_2_5 = 1 - over_2_5
        under_1_5 = sum(self._poisson_probability(i, total_expected) for i in range(2))
        
        return {
            'over_2_5': round(over_2_5, 3),
            'over_3_5': round(over_3_5, 3),
            'under_2_5': round(under_2_5, 3),
            'under_1_5': round(under_1_5, 3)
        }
    
    def _poisson_probability(self, k: int, lambda_val: float) -> float:
        """Calculate Poisson probability"""
        import math
        return (math.exp(-lambda_val) * (lambda_val ** k)) / math.factorial(k)
    
    def _analyze_head_to_head(self, h2h_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze head-to-head history"""
        if not h2h_data:
            return {
                'home_wins': 0,
                'away_wins': 0,
                'draws': 0,
                'total_meetings': 0,
                'home_advantage': 0.0,
                'goal_difference': 0.0,
                'recent_trend': 'unknown'
            }
        
        home_wins = h2h_data.get('home_wins', 0)
        away_wins = h2h_data.get('away_wins', 0)
        draws = h2h_data.get('draws', 0)
        total_meetings = h2h_data.get('total_meetings', 0)
        
        # Calculate home advantage
        home_advantage = 0.0
        if total_meetings > 0:
            home_advantage = (home_wins - away_wins) / total_meetings
        
        # Calculate goal difference
        home_goals = h2h_data.get('home_goals', 0)
        away_goals = h2h_data.get('away_goals', 0)
        goal_difference = (home_goals - away_goals) / max(total_meetings, 1)
        
        # Analyze recent trend
        recent_trend = self._analyze_h2h_trend(h2h_data)
        
        return {
            'home_wins': home_wins,
            'away_wins': away_wins,
            'draws': draws,
            'total_meetings': total_meetings,
            'home_advantage': round(home_advantage, 3),
            'goal_difference': round(goal_difference, 2),
            'recent_trend': recent_trend
        }
    
    def _analyze_h2h_trend(self, h2h_data: Dict[str, Any]) -> str:
        """Analyze recent head-to-head trend"""
        last_meetings = h2h_data.get('last_meetings', [])
        if len(last_meetings) < 3:
            return 'insufficient_data'
        
        # Analyze last 3 meetings
        home_wins = 0
        away_wins = 0
        draws = 0
        
        for meeting in last_meetings[:3]:
            result = meeting.get('result', '')
            if result == 'home':
                home_wins += 1
            elif result == 'away':
                away_wins += 1
            elif result == 'draw':
                draws += 1
        
        if home_wins > away_wins:
            return 'home_dominant'
        elif away_wins > home_wins:
            return 'away_dominant'
        else:
            return 'balanced'
    
    def _analyze_team_strength(self, home_team_data: Dict[str, Any],
                             away_team_data: Dict[str, Any],
                             form_analysis: Dict[str, Any],
                             h2h_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze overall team strength"""
        
        # Get base ratings
        home_overall = home_team_data.get('overall_rating', 5.0)
        away_overall = away_team_data.get('overall_rating', 5.0)
        
        # Get form ratings
        home_form_rating = form_analysis['home_weighted_rating']
        away_form_rating = form_analysis['away_weighted_rating']
        
        # Calculate composite strength
        home_strength = (
            home_overall * 0.3 +
            home_form_rating * self.config['team_strength']['form'] +
            (h2h_analysis['home_advantage'] + 1) * self.config['team_strength']['h2h'] * 5  # Scale to 0-10
        )
        
        away_strength = (
            away_overall * 0.3 +
            away_form_rating * self.config['team_strength']['form'] +
            (1 - h2h_analysis['home_advantage']) * self.config['team_strength']['h2h'] * 5
        )
        
        # Add consistency factor
        home_consistency = form_analysis['home_consistency']
        away_consistency = form_analysis['away_consistency']
        
        home_strength *= (0.9 + home_consistency * 0.1)
        away_strength *= (0.9 + away_consistency * 0.1)
        
        # Calculate strength advantage
        strength_advantage = home_strength - away_strength
        
        return {
            'home_strength': round(home_strength, 2),
            'away_strength': round(away_strength, 2),
            'strength_advantage': round(strength_advantage, 2),
            'home_consistency': round(home_consistency, 3),
            'away_consistency': round(away_consistency, 3)
        }
    
    def _analyze_situational_factors(self, match_data: Dict[str, Any],
                                   home_team_data: Dict[str, Any],
                                   away_team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze situational factors affecting the match"""
        
        league = match_data.get('league', 'default').lower()
        importance = match_data.get('importance', 'default')
        venue = match_data.get('venue', '')
        
        # Calculate home advantage
        league_multiplier = self.config['situational_factors']['home_advantage_league_multiplier'].get(
            league, self.config['situational_factors']['home_advantage_league_multiplier']['default']
        )
        home_advantage = self.config['situational_factors']['home_advantage_base'] * league_multiplier
        
        # Calculate importance factor
        importance_weight = self.config['situational_factors']['importance_weights'].get(
            importance, self.config['situational_factors']['importance_weights']['default']
        )
        
        # Estimate fatigue factor (simplified)
        fatigue_factor = self._estimate_fatigue(home_team_data, away_team_data, match_data)
        
        return {
            'home_advantage': round(home_advantage, 3),
            'importance': round(importance_weight, 3),
            'fatigue': round(fatigue_factor, 3),
            'venue': venue
        }
    
    def _estimate_fatigue(self, home_team_data: Dict[str, Any],
                        away_team_data: Dict[str, Any],
                        match_data: Dict[str, Any]) -> float:
        """Estimate team fatigue factor"""
        # Simplified fatigue estimation
        # In a real implementation, you would consider:
        # - Days since last match
        # - Travel distance
        # - Number of matches in short period
        # - Squad depth
        
        return 0.0  # Default no fatigue
    
    def _calculate_probabilities(self, form_analysis: Dict[str, Any],
                               goal_analysis: Dict[str, Any],
                               h2h_analysis: Dict[str, Any],
                               strength_analysis: Dict[str, Any],
                               situational_analysis: Dict[str, Any],
                               odds: Dict[str, Any]) -> Dict[str, float]:
        """Calculate final probabilities"""
        
        # Start with base probabilities
        home_prob = 0.33
        draw_prob = 0.34
        away_prob = 0.33
        
        # Adjust for form advantage
        form_advantage = form_analysis['form_advantage']
        home_prob += form_advantage * 0.05  # Scale form advantage
        away_prob -= form_advantage * 0.05
        
        # Adjust for momentum
        momentum = form_analysis['momentum_advantage']
        home_prob += momentum * 0.03
        away_prob -= momentum * 0.03
        
        # Adjust for goal supremacy
        goal_supremacy = goal_analysis['goal_supremacy']
        home_prob += goal_supremacy * 0.04
        away_prob -= goal_supremacy * 0.04
        
        # Adjust for head-to-head
        h2h_advantage = h2h_analysis['home_advantage']
        home_prob += h2h_advantage * 0.06
        away_prob -= h2h_advantage * 0.06
        
        # Adjust for team strength
        strength_advantage = strength_analysis['strength_advantage'] / 10  # Scale to -1 to 1
        home_prob += strength_advantage * 0.04
        away_prob -= strength_advantage * 0.04
        
        # Adjust for situational factors
        home_advantage = situational_analysis['home_advantage']
        importance = situational_analysis['importance']
        
        home_prob += home_advantage
        away_prob -= home_advantage * 0.7
        draw_prob -= home_advantage * 0.3
        
        # Importance affects all outcomes
        adjustment = importance * 0.1
        home_prob += adjustment
        away_prob += adjustment
        draw_prob -= adjustment * 2  # Draw less likely in important matches
        
        # Ensure non-negative
        home_prob = max(0.05, home_prob)
        draw_prob = max(0.05, draw_prob)
        away_prob = max(0.05, away_prob)
        
        # Normalize
        total = home_prob + draw_prob + away_prob
        home_prob /= total
        draw_prob /= total
        away_prob /= total
        
        # Blend with market odds if available
        if 'home' in odds and 'draw' in odds and 'away' in odds:
            final_probs = self._blend_with_odds(
                {'home': home_prob, 'draw': draw_prob, 'away': away_prob},
                odds
            )
        else:
            final_probs = {
                'home': round(home_prob, 3),
                'draw': round(draw_prob, 3),
                'away': round(away_prob, 3)
            }
        
        return final_probs
    
    def _blend_with_odds(self, model_probs: Dict[str, float], 
                        odds: Dict[str, float]) -> Dict[str, float]:
        """Blend model probabilities with market odds"""
        # Calculate implied probabilities from odds
        implied_home = 1 / odds['home']
        implied_draw = 1 / odds['draw']
        implied_away = 1 / odds['away']
        
        total_implied = implied_home + implied_draw + implied_away
        
        # Normalize implied probabilities
        implied_home /= total_implied
        implied_draw /= total_implied
        implied_away /= total_implied
        
        # Blend 70% model, 30% market
        weight_model = 0.7
        weight_market = 0.3
        
        blended = {
            'home': model_probs['home'] * weight_model + implied_home * weight_market,
            'draw': model_probs['draw'] * weight_model + implied_draw * weight_market,
            'away': model_probs['away'] * weight_model + implied_away * weight_market
        }
        
        # Normalize
        total = sum(blended.values())
        for key in blended:
            blended[key] /= total
        
        return {k: round(v, 3) for k, v in blended.items()}
    
    def _determine_outcome(self, probabilities: Dict[str, float]) -> str:
        """Determine predicted outcome"""
        max_prob = max(probabilities.values())
        for outcome, prob in probabilities.items():
            if prob == max_prob:
                return outcome
        return 'draw'
    
    def _calculate_confidence(self, probabilities: Dict[str, float],
                            form_analysis: Dict[str, Any],
                            strength_analysis: Dict[str, Any]) -> float:
        """Calculate prediction confidence"""
        
        # Confidence from probability spread
        max_prob = max(probabilities.values())
        min_prob = min(probabilities.values())
        prob_spread = max_prob - min_prob
        
        # Confidence from form consistency
        form_consistency = (form_analysis['home_consistency'] + form_analysis['away_consistency']) / 2
        
        # Confidence from strength difference
        strength_diff = abs(strength_analysis['strength_advantage'])
        
        # Combine confidence factors
        confidence = (
            prob_spread * 2.0 * 0.5 +  # Scale spread to 0-1
            form_consistency * 0.3 +
            min(1.0, strength_diff / 5) * 0.2  # Scale strength difference
        )
        
        # Constrain to reasonable range
        confidence = max(0.3, min(0.95, confidence))
        
        return round(confidence, 3)
    
    def _assess_risk_level(self, confidence: float,
                          probabilities: Dict[str, float],
                          form_analysis: Dict[str, Any]) -> str:
        """Assess risk level of prediction"""
        max_prob = max(probabilities.values())
        
        if confidence >= 0.7 and max_prob >= 0.6:
            return 'low'
        elif confidence >= 0.55 and max_prob >= 0.5:
            return 'medium'
        else:
            return 'high'
    
    def _generate_recommendations(self, probabilities: Dict[str, float],
                                confidence: float,
                                form_analysis: Dict[str, Any],
                                goal_analysis: Dict[str, Any],
                                odds: Dict[str, Any]) -> List[str]:
        """Generate betting recommendations"""
        recommendations = []
        
        # Main bet recommendation
        if confidence > 0.7:
            recommendations.append("High confidence prediction - consider standard stake")
        elif confidence > 0.55:
            recommendations.append("Moderate confidence - consider reduced stake")
        else:
            recommendations.append("Low confidence - consider very small stake or avoid")
        
        # Form-based recommendations
        form_advantage = form_analysis['form_advantage']
        if form_advantage > 1.0:
            recommendations.append("Significant form advantage for home team")
        elif form_advantage < -1.0:
            recommendations.append("Significant form advantage for away team")
        
        # Goal-based recommendations
        goal_supremacy = goal_analysis['goal_supremacy']
        if goal_supremacy > 0.5:
            recommendations.append("Home team expected to outscore away team")
        elif goal_supremacy < -0.5:
            recommendations.append("Away team expected to outscore home team")
        
        # BTTS recommendation
        btts_prob = goal_analysis['both_teams_score_probability']
        if btts_prob > 0.6:
            recommendations.append("High probability both teams will score")
        elif btts_prob < 0.4:
            recommendations.append("Low probability both teams will score")
        
        # Over/under recommendations
        over_2_5 = goal_analysis['over_under_probabilities']['over_2_5']
        if over_2_5 > 0.6:
            recommendations.append("High probability of over 2.5 goals")
        elif over_2_5 < 0.4:
            recommendations.append("High probability of under 2.5 goals")
        
        return recommendations
    
    def _identify_value_bets(self, probabilities: Dict[str, float],
                           odds: Dict[str, Any],
                           confidence: float) -> List[Dict[str, Any]]:
        """Identify value betting opportunities"""
        value_bets = []
        
        if not odds or 'home' not in odds or 'draw' not in odds or 'away' not in odds:
            return value_bets
        
        # Calculate implied probabilities
        implied_home = 1 / odds['home']
        implied_draw = 1 / odds['draw']
        implied_away = 1 / odds['away']
        
        total_implied = implied_home + implied_draw + implied_away
        
        # Normalize implied probabilities
        implied_home /= total_implied
        implied_draw /= total_implied
        implied_away /= total_implied
        
        # Check for value in each outcome
        outcomes = [
            ('home', probabilities['home'], implied_home, odds['home']),
            ('draw', probabilities['draw'], implied_draw, odds['draw']),
            ('away', probabilities['away'], implied_away, odds['away'])
        ]
        
        for outcome, true_prob, implied_prob, odds_value in outcomes:
            value = true_prob - implied_prob
            
            if value > 0.05:  # Minimum value threshold
                # Calculate Kelly Criterion
                kelly = self._calculate_kelly_criterion(true_prob, odds_value)
                
                value_bets.append({
                    'outcome': outcome,
                    'true_probability': round(true_prob, 3),
                    'implied_probability': round(implied_prob, 3),
                    'value': round(value, 3),
                    'odds': odds_value,
                    'kelly_percentage': round(kelly * 100, 2),
                    'confidence_adjusted': round(min(1.0, confidence * 1.5), 3)
                })
        
        return value_bets
    
    def _calculate_kelly_criterion(self, probability: float, odds: float) -> float:
        """Calculate Kelly Criterion stake percentage"""
        if odds <= 1.0:
            return 0.0
        
        b = odds - 1
        p = probability
        q = 1 - p
        
        kelly = (b * p - q) / b
        kelly = max(0.0, kelly)  # Non-negative
        
        # Conservative Kelly (half Kelly)
        return kelly * 0.5
    
    def _extract_ml_features(self, form_analysis: Dict[str, Any],
                           goal_analysis: Dict[str, Any],
                           h2h_analysis: Dict[str, Any],
                           strength_analysis: Dict[str, Any],
                           situational_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Extract features for ML models"""
        
        features = {
            # Form features
            'form_advantage': form_analysis['form_advantage'],
            'momentum_advantage': form_analysis['momentum_advantage'],
            'home_form_rating': form_analysis['home_form_rating'],
            'away_form_rating': form_analysis['away_form_rating'],
            'home_consistency': form_analysis['home_consistency'],
            'away_consistency': form_analysis['away_consistency'],
            
            # Goal features
            'home_expected_goals': goal_analysis['home_expected_goals'],
            'away_expected_goals': goal_analysis['away_expected_goals'],
            'goal_supremacy': goal_analysis['goal_supremacy'],
            'both_teams_score_probability': goal_analysis['both_teams_score_probability'],
            
            # Head-to-head features
            'h2h_home_advantage': h2h_analysis['home_advantage'],
            'h2h_goal_difference': h2h_analysis['goal_difference'],
            'h2h_total_meetings': h2h_analysis['total_meetings'],
            
            # Strength features
            'home_strength': strength_analysis['home_strength'],
            'away_strength': strength_analysis['away_strength'],
            'strength_advantage': strength_analysis['strength_advantage'],
            
            # Situational features
            'home_advantage_factor': situational_analysis['home_advantage'],
            'importance_factor': situational_analysis['importance'],
            'fatigue_factor': situational_analysis['fatigue']
        }
        
        # Round features
        for key in features:
            features[key] = round(features[key], 4)
        
        return features
    
    def _calculate_feature_importance(self, features: Dict[str, float]) -> Dict[str, float]:
        """Calculate feature importance scores"""
        # Simplified feature importance calculation
        # In a real implementation, you would use actual ML model feature importance
        
        importance_scores = {
            'form_advantage': 0.25,
            'home_expected_goals': 0.15,
            'away_expected_goals': 0.15,
            'h2h_home_advantage': 0.12,
            'home_strength': 0.10,
            'away_strength': 0.10,
            'goal_supremacy': 0.08,
            'home_advantage_factor': 0.05
        }
        
        # Add remaining features with lower importance
        for feature in features:
            if feature not in importance_scores:
                importance_scores[feature] = 0.01
        
        # Normalize to sum to 1
        total = sum(importance_scores.values())
        for feature in importance_scores:
            importance_scores[feature] = round(importance_scores[feature] / total, 3)
        
        return importance_scores