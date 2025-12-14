# python_generator/team_form_analyzer.py
import requests
import numpy as np
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FormPrediction:
    prediction: str  # 'home', 'draw', 'away'
    confidence: float
    form_advantage: float
    momentum_advantage: float
    goal_supremacy: float
    features: Dict[str, float]
    probabilities: Dict[str, float]  # home, draw, away probabilities

class EnhancedTeamFormAnalyzer:
    def __init__(self, api_base_url: str = "http://localhost:8000/api"):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        
        # Configure session headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })
        
        # Feature weights for ML predictions
        self.feature_weights = {
            'form_rating': 0.35,
            'form_momentum': 0.25,
            'goal_supremacy': 0.20,
            'win_probability': 0.15,
            'clean_sheets': 0.05,
        }
        
        # ML model parameters (can be loaded from saved model)
        self.ml_params = {
            'home_win_threshold': 0.55,
            'away_win_threshold': 0.45,
            'confidence_threshold': 0.65,
        }
    
    def fetch_match_data(self, match_id: int) -> Optional[Dict]:
        """Fetch complete match data including teams and forms"""
        try:
            # Fetch match details
            match_url = f"{self.api_base_url}/matches/{match_id}"
            match_response = self.session.get(match_url, timeout=10)
            
            if match_response.status_code != 200:
                logger.error(f"Failed to fetch match {match_id}: {match_response.status_code}")
                return None
            
            match_data = match_response.json().get('data', {})
            
            if not match_data:
                logger.error(f"No data for match {match_id}")
                return None
            
            # Get team details
            home_team_code = match_data.get('home_team_code')
            away_team_code = match_data.get('away_team_code')
            
            if not home_team_code or not away_team_code:
                logger.error(f"Missing team codes for match {match_id}")
                return None
            
            # Fetch team details and forms
            match_data['home_team_details'] = self.fetch_team_data(home_team_code)
            match_data['away_team_details'] = self.fetch_team_data(away_team_code)
            
            # Fetch team forms for this match
            match_data['home_team_form'] = self.fetch_team_form_for_match(
                match_id, home_team_code, 'home'
            )
            match_data['away_team_form'] = self.fetch_team_form_for_match(
                match_id, away_team_code, 'away'
            )
            
            # Fetch head-to-head data
            match_data['head_to_head'] = self.fetch_head_to_head(match_id)
            
            return match_data
            
        except requests.RequestException as e:
            logger.error(f"Request error fetching match {match_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching match {match_id}: {e}")
            return None
    
    def fetch_team_data(self, team_code: str) -> Optional[Dict]:
        """Fetch team details and statistics"""
        try:
            url = f"{self.api_base_url}/teams/{team_code}"
            response = self.session.get(url, timeout=5)
            
            if response.status_code == 200:
                return response.json().get('data', {})
            return None
            
        except requests.RequestException as e:
            logger.error(f"Error fetching team {team_code}: {e}")
            return None
    
    def fetch_team_form_for_match(self, match_id: int, team_code: str, venue: str) -> Optional[Dict]:
        """Fetch team form data for a specific match"""
        try:
            # First try to get form specifically for this match
            params = {
                'match_id': match_id,
                'team_id': team_code,
                'venue': venue
            }
            
            url = f"{self.api_base_url}/team-forms"
            response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json().get('data', [])
                if data and len(data) > 0:
                    return data[0]
            
            # If no specific form found, get team's recent forms
            return self.fetch_team_recent_forms(team_code, venue)
            
        except requests.RequestException as e:
            logger.error(f"Error fetching team form for {team_code}: {e}")
            return None
    
    def fetch_team_recent_forms(self, team_code: str, venue: str, limit: int = 5) -> Optional[Dict]:
        """Fetch team's recent forms"""
        try:
            params = {
                'team_id': team_code,
                'venue': venue,
                'limit': limit,
                'order_by': 'created_at',
                'order': 'desc'
            }
            
            url = f"{self.api_base_url}/team-forms"
            response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json().get('data', [])
                if data and len(data) > 0:
                    # Calculate aggregate statistics from recent forms
                    return self.aggregate_recent_forms(data)
            
            return None
            
        except requests.RequestException as e:
            logger.error(f"Error fetching recent forms for {team_code}: {e}")
            return None
    
    def fetch_head_to_head(self, match_id: int) -> Optional[Dict]:
        """Fetch head-to-head data for match"""
        try:
            url = f"{self.api_base_url}/head-to-head/{match_id}"
            response = self.session.get(url, timeout=5)
            
            if response.status_code == 200:
                return response.json().get('data', {})
            return None
            
        except requests.RequestException as e:
            logger.error(f"Error fetching head-to-head for match {match_id}: {e}")
            return None
    
    def aggregate_recent_forms(self, forms: List[Dict]) -> Dict:
        """Calculate aggregate statistics from multiple forms"""
        if not forms:
            return {}
        
        # Initialize accumulators
        total_matches = 0
        total_wins = 0
        total_draws = 0
        total_losses = 0
        total_goals_scored = 0
        total_goals_conceded = 0
        total_clean_sheets = 0
        total_failed_to_score = 0
        form_ratings = []
        form_momentums = []
        win_probabilities = []
        
        for form in forms:
            total_matches += form.get('matches_played', 0)
            total_wins += form.get('wins', 0)
            total_draws += form.get('draws', 0)
            total_losses += form.get('losses', 0)
            total_goals_scored += form.get('goals_scored', 0)
            total_goals_conceded += form.get('goals_conceded', 0)
            total_clean_sheets += form.get('clean_sheets', 0)
            total_failed_to_score += form.get('failed_to_score', 0)
            
            if 'form_rating' in form:
                form_ratings.append(form['form_rating'])
            if 'form_momentum' in form:
                form_momentums.append(form['form_momentum'])
            if 'win_probability' in form:
                win_probabilities.append(form['win_probability'])
        
        # Calculate averages
        avg_form_rating = np.mean(form_ratings) if form_ratings else 5.0
        avg_momentum = np.mean(form_momentums) if form_momentums else 0.0
        avg_win_probability = np.mean(win_probabilities) if win_probabilities else 0.33
        
        avg_goals_scored = total_goals_scored / total_matches if total_matches > 0 else 0
        avg_goals_conceded = total_goals_conceded / total_matches if total_matches > 0 else 0
        
        # Build form string from recent matches
        form_string = self.build_form_string(forms)
        
        return {
            'matches_played': total_matches,
            'wins': total_wins,
            'draws': total_draws,
            'losses': total_losses,
            'goals_scored': total_goals_scored,
            'goals_conceded': total_goals_conceded,
            'avg_goals_scored': round(avg_goals_scored, 2),
            'avg_goals_conceded': round(avg_goals_conceded, 2),
            'clean_sheets': total_clean_sheets,
            'failed_to_score': total_failed_to_score,
            'form_rating': round(avg_form_rating, 2),
            'form_momentum': round(avg_momentum, 3),
            'win_probability': round(avg_win_probability, 3),
            'form_string': form_string,
            'raw_form': self.extract_raw_form_data(forms),
        }
    
    def build_form_string(self, forms: List[Dict]) -> str:
        """Build form string from recent forms"""
        form_chars = []
        
        for form in forms:
            raw_form = form.get('raw_form', [])
            for match in raw_form[:3]:  # Take first 3 matches from each form
                outcome = match.get('outcome', '')
                if outcome in ['W', 'D', 'L']:
                    form_chars.append(outcome)
        
        # Return last 5 matches
        return ''.join(form_chars[-5:]) if form_chars else ""
    
    def extract_raw_form_data(self, forms: List[Dict]) -> List[Dict]:
        """Extract and combine raw form data"""
        raw_data = []
        
        for form in forms:
            raw_form = form.get('raw_form', [])
            if isinstance(raw_form, list):
                raw_data.extend(raw_form)
        
        # Return last 10 matches maximum
        return raw_data[:10]
    
    def calculate_form_comparison(self, home_form: Dict, away_form: Dict) -> Dict:
        """Calculate comprehensive form comparison metrics"""
        if not home_form or not away_form:
            return {}
        
        # Basic form metrics
        form_advantage = home_form.get('form_rating', 5.0) - away_form.get('form_rating', 5.0)
        momentum_advantage = home_form.get('form_momentum', 0.0) - away_form.get('form_momentum', 0.0)
        
        # Goal-based metrics
        home_goal_supremacy = home_form.get('avg_goals_scored', 0) - away_form.get('avg_goals_conceded', 0)
        away_goal_supremacy = away_form.get('avg_goals_scored', 0) - home_form.get('avg_goals_conceded', 0)
        net_goal_supremacy = home_goal_supremacy - away_goal_supremacy
        
        # Win probability advantage
        win_prob_advantage = home_form.get('win_probability', 0.33) - away_form.get('win_probability', 0.33)
        
        # Recent performance (form string analysis)
        home_form_string = home_form.get('form_string', '')
        away_form_string = away_form.get('form_string', '')
        
        home_form_points = self.calculate_form_points(home_form_string)
        away_form_points = self.calculate_form_points(away_form_string)
        form_points_advantage = home_form_points - away_form_points
        
        # Clean sheets advantage
        home_clean_sheet_rate = home_form.get('clean_sheets', 0) / max(home_form.get('matches_played', 1), 1)
        away_clean_sheet_rate = away_form.get('clean_sheets', 0) / max(away_form.get('matches_played', 1), 1)
        clean_sheet_advantage = home_clean_sheet_rate - away_clean_sheet_rate
        
        # Scoring consistency
        home_failed_to_score_rate = home_form.get('failed_to_score', 0) / max(home_form.get('matches_played', 1), 1)
        away_failed_to_score_rate = away_form.get('failed_to_score', 0) / max(away_form.get('matches_played', 1), 1)
        scoring_consistency_advantage = away_failed_to_score_rate - home_failed_to_score_rate
        
        return {
            'form_advantage': round(form_advantage, 2),
            'momentum_advantage': round(momentum_advantage, 3),
            'goal_supremacy': round(net_goal_supremacy, 2),
            'win_probability_advantage': round(win_prob_advantage, 3),
            'form_points_advantage': round(form_points_advantage, 1),
            'clean_sheet_advantage': round(clean_sheet_advantage, 3),
            'scoring_consistency_advantage': round(scoring_consistency_advantage, 3),
            'home_form_rating': round(home_form.get('form_rating', 5.0), 2),
            'away_form_rating': round(away_form.get('form_rating', 5.0), 2),
            'home_momentum': round(home_form.get('form_momentum', 0.0), 3),
            'away_momentum': round(away_form.get('form_momentum', 0.0), 3),
            'home_avg_goals_scored': round(home_form.get('avg_goals_scored', 0), 2),
            'away_avg_goals_scored': round(away_form.get('avg_goals_scored', 0), 2),
            'home_avg_goals_conceded': round(home_form.get('avg_goals_conceded', 0), 2),
            'away_avg_goals_conceded': round(away_form.get('avg_goals_conceded', 0), 2),
        }
    
    def calculate_form_points(self, form_string: str) -> float:
        """Calculate points from form string (W=3, D=1, L=0)"""
        points = 0
        for char in form_string:
            if char == 'W':
                points += 3
            elif char == 'D':
                points += 1
            elif char == 'L':
                points += 0
        return points
    
    def predict_from_form(self, home_form: Dict, away_form: Dict) -> FormPrediction:
        """Make comprehensive prediction based on form analysis"""
        comparison = self.calculate_form_comparison(home_form, away_form)
        
        if not comparison:
            return FormPrediction(
                prediction='draw',
                confidence=0.5,
                form_advantage=0.0,
                momentum_advantage=0.0,
                goal_supremacy=0.0,
                features={},
                probabilities={'home': 0.33, 'draw': 0.34, 'away': 0.33}
            )
        
        # Calculate weighted advantage score
        advantage_score = (
            comparison['form_advantage'] * self.feature_weights['form_rating'] +
            comparison['momentum_advantage'] * self.feature_weights['form_momentum'] * 10 +  # Scale momentum
            comparison['goal_supremacy'] * self.feature_weights['goal_supremacy'] * 2 +      # Scale goals
            comparison['win_probability_advantage'] * self.feature_weights['win_probability'] * 3 +
            comparison['clean_sheet_advantage'] * self.feature_weights['clean_sheets'] * 10
        )
        
        # Calculate probabilities using softmax-like function
        home_advantage = advantage_score
        base_home_prob = 0.33 + (home_advantage * 0.5)  # Scale advantage to probability
        base_away_prob = 0.33 - (home_advantage * 0.5)
        base_draw_prob = 0.34
        
        # Normalize probabilities
        total = base_home_prob + base_draw_prob + base_away_prob
        home_prob = max(0.1, min(0.9, base_home_prob / total))
        draw_prob = max(0.1, min(0.9, base_draw_prob / total))
        away_prob = max(0.1, min(0.9, base_away_prob / total))
        
        # Normalize again to ensure sum = 1
        total_norm = home_prob + draw_prob + away_prob
        home_prob /= total_norm
        draw_prob /= total_norm
        away_prob /= total_norm
        
        # Determine prediction
        if home_prob > self.ml_params['home_win_threshold']:
            prediction = 'home'
            confidence = home_prob
        elif away_prob > self.ml_params['away_win_threshold']:
            prediction = 'away'
            confidence = away_prob
        else:
            prediction = 'draw'
            confidence = draw_prob
        
        # Adjust confidence based on clear advantage
        if abs(advantage_score) > 1.0:
            confidence = min(0.95, confidence * 1.2)
        
        return FormPrediction(
            prediction=prediction,
            confidence=round(confidence, 3),
            form_advantage=comparison['form_advantage'],
            momentum_advantage=comparison['momentum_advantage'],
            goal_supremacy=comparison['goal_supremacy'],
            features=comparison,
            probabilities={
                'home': round(home_prob, 3),
                'draw': round(draw_prob, 3),
                'away': round(away_prob, 3)
            }
        )
    
    def analyze_match(self, match_id: int) -> Dict:
        """Complete match analysis including form, team stats, and predictions"""
        try:
            # Fetch all match data
            match_data = self.fetch_match_data(match_id)
            
            if not match_data:
                logger.error(f"No data available for match {match_id}")
                return {
                    'match_id': match_id,
                    'error': 'No data available',
                    'prediction': 'unknown',
                    'confidence': 0.0
                }
            
            home_form = match_data.get('home_team_form', {})
            away_form = match_data.get('away_team_form', {})
            home_team = match_data.get('home_team_details', {})
            away_team = match_data.get('away_team_details', {})
            head_to_head = match_data.get('head_to_head', {})
            
            # Make form-based prediction
            form_prediction = self.predict_from_form(home_form, away_form)
            
            # Calculate team strength factors
            home_strength = self.calculate_team_strength(home_team, home_form)
            away_strength = self.calculate_team_strength(away_team, away_form)
            
            # Incorporate head-to-head data if available
            h2h_factor = self.analyze_head_to_head(head_to_head)
            
            # Combine predictions (weighted)
            final_prediction = self.combine_predictions(
                form_prediction, 
                home_strength, 
                away_strength, 
                h2h_factor
            )
            
            return {
                'match_id': match_id,
                'match_data': {
                    'home_team': match_data.get('home_team'),
                    'away_team': match_data.get('away_team'),
                    'league': match_data.get('league'),
                    'match_date': match_data.get('match_date'),
                },
                'form_analysis': {
                    'home_form': self.extract_key_form_metrics(home_form),
                    'away_form': self.extract_key_form_metrics(away_form),
                    'comparison': form_prediction.features,
                },
                'team_strength': {
                    'home': home_strength,
                    'away': away_strength,
                    'advantage': round(home_strength - away_strength, 2),
                },
                'head_to_head': h2h_factor,
                'predictions': {
                    'form_based': {
                        'prediction': form_prediction.prediction,
                        'confidence': form_prediction.confidence,
                        'probabilities': form_prediction.probabilities,
                    },
                    'final': final_prediction,
                },
                'recommendations': self.generate_recommendations(
                    form_prediction, home_strength, away_strength
                ),
                'ml_features': self.prepare_ml_features(
                    home_form, away_form, home_team, away_team, head_to_head
                ),
            }
            
        except Exception as e:
            logger.error(f"Error analyzing match {match_id}: {e}")
            return {
                'match_id': match_id,
                'error': str(e),
                'prediction': 'error',
                'confidence': 0.0
            }
    
    def calculate_team_strength(self, team_data: Dict, form_data: Dict) -> float:
        """Calculate overall team strength rating"""
        if not team_data:
            return 5.0
        
        # Base rating from team data
        base_rating = team_data.get('overall_rating', 5.0)
        
        # Adjust based on form
        form_rating = form_data.get('form_rating', 5.0)
        form_momentum = form_data.get('form_momentum', 0.0)
        
        # Adjust for home/away strength if available
        venue_strength = team_data.get('home_strength', 5.0)  # Assuming home, adjust if away
        
        # Calculate weighted strength
        strength = (
            base_rating * 0.4 +
            form_rating * 0.3 +
            venue_strength * 0.2 +
            (form_momentum * 2 + 5.0) * 0.1  # Scale momentum to 0-10 range
        )
        
        return round(strength, 2)
    
    def analyze_head_to_head(self, h2h_data: Dict) -> Dict:
        """Analyze head-to-head data"""
        if not h2h_data:
            return {'factor': 0.0, 'analysis': 'No data'}
        
        home_wins = h2h_data.get('home_wins', 0)
        away_wins = h2h_data.get('away_wins', 0)
        draws = h2h_data.get('draws', 0)
        total = home_wins + away_wins + draws
        
        if total == 0:
            return {'factor': 0.0, 'analysis': 'No previous meetings'}
        
        # Calculate advantage factor
        home_win_rate = home_wins / total
        away_win_rate = away_wins / total
        draw_rate = draws / total
        
        # Factor is positive if home advantage, negative if away advantage
        factor = (home_win_rate - away_win_rate) * 2  # Scale to -2 to 2 range
        
        # Analyze trend
        if home_win_rate > 0.6:
            analysis = 'Strong home advantage'
        elif away_win_rate > 0.6:
            analysis = 'Strong away advantage'
        elif abs(home_win_rate - away_win_rate) < 0.1:
            analysis = 'Evenly matched historically'
        else:
            analysis = 'Slight historical advantage'
        
        return {
            'factor': round(factor, 3),
            'analysis': analysis,
            'stats': {
                'home_win_rate': round(home_win_rate, 3),
                'away_win_rate': round(away_win_rate, 3),
                'draw_rate': round(draw_rate, 3),
                'total_meetings': total,
            }
        }
    
    def combine_predictions(self, form_pred: FormPrediction, 
                          home_strength: float, away_strength: float,
                          h2h_factor: Dict) -> Dict:
        """Combine multiple prediction factors"""
        
        # Form-based probabilities
        form_home_prob = form_pred.probabilities['home']
        form_draw_prob = form_pred.probabilities['draw']
        form_away_prob = form_pred.probabilities['away']
        
        # Strength-based probabilities
        strength_diff = home_strength - away_strength
        strength_home_prob = 0.33 + (strength_diff * 0.05)  # Scale strength difference
        strength_away_prob = 0.33 - (strength_diff * 0.05)
        strength_draw_prob = 0.34
        
        # Head-to-head factor
        h2h_home_boost = h2h_factor.get('factor', 0.0) * 0.1
        h2h_away_boost = -h2h_factor.get('factor', 0.0) * 0.1
        
        # Combine with weights
        combined_home = (
            form_home_prob * 0.6 +
            strength_home_prob * 0.3 +
            0.33 * 0.1 +  # Base probability
            h2h_home_boost
        )
        
        combined_away = (
            form_away_prob * 0.6 +
            strength_away_prob * 0.3 +
            0.33 * 0.1 +
            h2h_away_boost
        )
        
        combined_draw = (
            form_draw_prob * 0.6 +
            strength_draw_prob * 0.3 +
            0.34 * 0.1
        )
        
        # Normalize
        total = combined_home + combined_draw + combined_away
        combined_home /= total
        combined_draw /= total
        combined_away /= total
        
        # Determine final prediction
        if combined_home > combined_away and combined_home > combined_draw:
            prediction = 'home'
            confidence = combined_home
        elif combined_away > combined_home and combined_away > combined_draw:
            prediction = 'away'
            confidence = combined_away
        else:
            prediction = 'draw'
            confidence = combined_draw
        
        return {
            'prediction': prediction,
            'confidence': round(confidence, 3),
            'probabilities': {
                'home': round(combined_home, 3),
                'draw': round(combined_draw, 3),
                'away': round(combined_away, 3),
            },
            'factors': {
                'form_weight': 0.6,
                'strength_weight': 0.3,
                'h2h_weight': 0.1,
                'h2h_factor': h2h_factor.get('factor', 0.0),
            }
        }
    
    def extract_key_form_metrics(self, form_data: Dict) -> Dict:
        """Extract key metrics from form data"""
        return {
            'form_rating': form_data.get('form_rating', 5.0),
            'form_momentum': form_data.get('form_momentum', 0.0),
            'avg_goals_scored': form_data.get('avg_goals_scored', 0),
            'avg_goals_conceded': form_data.get('avg_goals_conceded', 0),
            'win_probability': form_data.get('win_probability', 0.33),
            'form_string': form_data.get('form_string', ''),
            'clean_sheets': form_data.get('clean_sheets', 0),
            'matches_played': form_data.get('matches_played', 0),
        }
    
    def generate_recommendations(self, form_pred: FormPrediction,
                               home_strength: float, away_strength: float) -> List[str]:
        """Generate betting and analysis recommendations"""
        recommendations = []
        
        # Form-based recommendations
        if form_pred.form_advantage > 1.0:
            recommendations.append("Strong form advantage for home team")
        elif form_pred.form_advantage < -1.0:
            recommendations.append("Strong form advantage for away team")
        
        if form_pred.momentum_advantage > 0.3:
            recommendations.append("Home team has strong positive momentum")
        elif form_pred.momentum_advantage < -0.3:
            recommendations.append("Away team has strong positive momentum")
        
        # Goal-based recommendations
        if form_pred.goal_supremacy > 0.5:
            recommendations.append("Home team expected to outscore away team")
        elif form_pred.goal_supremacy < -0.5:
            recommendations.append("Away team expected to outscore home team")
        
        # Strength-based recommendations
        strength_diff = home_strength - away_strength
        if abs(strength_diff) > 1.0:
            recommendations.append(f"Significant team strength difference ({strength_diff:.1f})")
        
        # Confidence-based recommendations
        if form_pred.confidence > 0.7:
            recommendations.append("High confidence in prediction")
        elif form_pred.confidence < 0.55:
            recommendations.append("Low confidence - consider avoiding or small stakes")
        
        return recommendations
    
    def prepare_ml_features(self, home_form: Dict, away_form: Dict,
                           home_team: Dict, away_team: Dict,
                           h2h_data: Dict) -> Dict:
        """Prepare features for ML model training"""
        comparison = self.calculate_form_comparison(home_form, away_form)
        
        features = {
            # Form features
            'form_advantage': comparison.get('form_advantage', 0),
            'momentum_advantage': comparison.get('momentum_advantage', 0),
            'goal_supremacy': comparison.get('goal_supremacy', 0),
            'win_probability_advantage': comparison.get('win_probability_advantage', 0),
            
            # Team features
            'home_rating': home_team.get('overall_rating', 5.0),
            'away_rating': away_team.get('overall_rating', 5.0),
            'rating_difference': home_team.get('overall_rating', 5.0) - away_team.get('overall_rating', 5.0),
            
            # Goal features
            'home_avg_goals_scored': home_form.get('avg_goals_scored', 0),
            'away_avg_goals_scored': away_form.get('avg_goals_scored', 0),
            'home_avg_goals_conceded': home_form.get('avg_goals_conceded', 0),
            'away_avg_goals_conceded': away_form.get('avg_goals_conceded', 0),
            
            # H2H features
            'h2h_home_win_rate': h2h_data.get('home_wins', 0) / max(h2h_data.get('total_meetings', 1), 1),
            'h2h_away_win_rate': h2h_data.get('away_wins', 0) / max(h2h_data.get('total_meetings', 1), 1),
            'h2h_draw_rate': h2h_data.get('draws', 0) / max(h2h_data.get('total_meetings', 1), 1),
            
            # Derived features
            'total_avg_goals': (home_form.get('avg_goals_scored', 0) + 
                               away_form.get('avg_goals_scored', 0) +
                               home_form.get('avg_goals_conceded', 0) + 
                               away_form.get('avg_goals_conceded', 0)) / 2,
            
            'defensive_stability': (home_form.get('clean_sheets', 0) / max(home_form.get('matches_played', 1), 1) -
                                   away_form.get('clean_sheets', 0) / max(away_form.get('matches_played', 1), 1)),
        }
        
        # Round all features
        for key in features:
            if isinstance(features[key], float):
                features[key] = round(features[key], 4)
        
        return features
    
    def batch_analyze_matches(self, match_ids: List[int]) -> Dict:
        """Analyze multiple matches in batch"""
        results = []
        errors = []
        
        for match_id in match_ids:
            try:
                result = self.analyze_match(match_id)
                if 'error' in result:
                    errors.append({'match_id': match_id, 'error': result['error']})
                else:
                    results.append(result)
            except Exception as e:
                errors.append({'match_id': match_id, 'error': str(e)})
        
        # Calculate overall statistics
        predictions = [r['predictions']['final']['prediction'] for r in results]
        confidences = [r['predictions']['final']['confidence'] for r in results]
        
        stats = {
            'total_analyzed': len(results),
            'home_wins_predicted': predictions.count('home'),
            'draws_predicted': predictions.count('draw'),
            'away_wins_predicted': predictions.count('away'),
            'avg_confidence': round(np.mean(confidences), 3) if confidences else 0,
            'errors': len(errors),
        }
        
        return {
            'results': results,
            'errors': errors,
            'statistics': stats,
        }


# Usage examples
if __name__ == "__main__":
    # Initialize analyzer
    analyzer = EnhancedTeamFormAnalyzer(api_base_url="http://localhost:8000/api")
    
    # Analyze single match
    result = analyzer.analyze_match(1)
    print(json.dumps(result, indent=2))
    
    # Batch analyze multiple matches
    batch_result = analyzer.batch_analyze_matches([1, 2, 3, 4, 5])
    print(f"\nBatch Analysis Stats:")
    print(f"Matches analyzed: {batch_result['statistics']['total_analyzed']}")
    print(f"Home wins predicted: {batch_result['statistics']['home_wins_predicted']}")
    print(f"Away wins predicted: {batch_result['statistics']['away_wins_predicted']}")
    print(f"Average confidence: {batch_result['statistics']['avg_confidence']}")