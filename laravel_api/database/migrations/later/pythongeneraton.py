# python_generator/head_to_head_analyzer.py
import requests
import numpy as np
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import logging
from collections import Counter

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class H2HPrediction:
    prediction: str  # 'home', 'draw', 'away'
    confidence: float
    weight_factor: float
    trend: str
    statistics: Dict[str, float]
    reasoning: List[str]
    raw_data: Dict

class EnhancedHeadToHeadAnalyzer:
    def __init__(self, api_base_url: str = "http://localhost:8000/api"):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        
        # Configure session
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })
        
        # Analysis parameters
        self.weights = {
            'historical_dominance': 0.35,
            'recent_trend': 0.25,
            'goal_supremacy': 0.20,
            'meeting_frequency': 0.10,
            'competitive_balance': 0.10,
        }
        
        # Thresholds
        self.thresholds = {
            'strong_dominance': 0.65,  # Win rate > 65%
            'moderate_dominance': 0.55,  # Win rate 55-65%
            'balanced': 0.45,  # Win rate 45-55%
            'recent_weight': 0.6,  # Weight for last 5 meetings
            'goal_margin_factor': 2.0,  # Factor for goal difference importance
        }
    
    def fetch_head_to_head(self, match_id: int) -> Optional[Dict]:
        """Fetch head-to-head data for a match"""
        try:
            url = f"{self.api_base_url}/head-to-head/{match_id}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json().get('data', {})
                if data:
                    # Enrich data with calculated metrics
                    return self.enrich_h2h_data(data)
            
            # If no specific H2H found, try to generate from team history
            return self.generate_h2h_from_teams(match_id)
            
        except requests.RequestException as e:
            logger.error(f"Error fetching H2H for match {match_id}: {e}")
            return None
    
    def generate_h2h_from_teams(self, match_id: int) -> Optional[Dict]:
        """Generate H2H data by fetching team histories"""
        try:
            # First get match details to get team IDs
            match_url = f"{self.api_base_url}/matches/{match_id}"
            match_response = self.session.get(match_url, timeout=5)
            
            if match_response.status_code != 200:
                return None
            
            match_data = match_response.json().get('data', {})
            home_team_code = match_data.get('home_team_code')
            away_team_code = match_data.get('away_team_code')
            
            if not home_team_code or not away_team_code:
                return None
            
            # Search for historical matches between these teams
            params = {
                'home_team': home_team_code,
                'away_team': away_team_code,
                'include_historical': True,
                'limit': 20,
            }
            
            search_url = f"{self.api_base_url}/matches/search"
            response = self.session.get(search_url, params=params, timeout=10)
            
            if response.status_code != 200:
                return None
            
            historical_matches = response.json().get('data', [])
            
            if not historical_matches:
                return None
            
            # Analyze historical matches
            return self.analyze_historical_matches(historical_matches, home_team_code, away_team_code)
            
        except Exception as e:
            logger.error(f"Error generating H2H from teams: {e}")
            return None
    
    def analyze_historical_matches(self, matches: List[Dict], home_team: str, away_team: str) -> Dict:
        """Analyze historical matches to create H2H data"""
        home_wins = 0
        away_wins = 0
        draws = 0
        total = 0
        
        home_goals = 0
        away_goals = 0
        
        last_meetings = []
        meeting_dates = []
        
        for match in matches:
            # Determine result
            home_score = match.get('home_score', 0)
            away_score = match.get('away_score', 0)
            result = match.get('result', '')
            
            if home_score > away_score:
                home_wins += 1
                result_code = 'home'
            elif away_score > home_score:
                away_wins += 1
                result_code = 'away'
            else:
                draws += 1
                result_code = 'draw'
            
            total += 1
            home_goals += home_score
            away_goals += away_score
            
            # Add to last meetings
            last_meetings.append({
                'date': match.get('match_date', ''),
                'result': result_code,
                'score': f"{home_score}-{away_score}",
                'competition': match.get('league', ''),
                'venue': match.get('venue', 'home'),
            })
            
            meeting_dates.append(match.get('match_date', ''))
        
        # Calculate statistics
        stats = self.calculate_h2h_statistics(
            home_wins, away_wins, draws, home_goals, away_goals, total
        )
        
        # Get last meeting date
        last_meeting_date = max(meeting_dates) if meeting_dates else None
        
        return {
            'match_id': None,  # Not tied to specific current match
            'form': f"{home_wins}-{draws}-{away_wins}",
            'home_wins': home_wins,
            'away_wins': away_wins,
            'draws': draws,
            'total_meetings': total,
            'home_goals': home_goals,
            'away_goals': away_goals,
            'last_meeting_date': last_meeting_date,
            'last_meeting_result': last_meetings[0]['result'] if last_meetings else None,
            'last_meetings': last_meetings[:10],  # Last 10 meetings
            'stats': stats,
            'generated': True,  # Flag as generated data
        }
    
    def enrich_h2h_data(self, h2h_data: Dict) -> Dict:
        """Enrich raw H2H data with calculated metrics"""
        home_wins = h2h_data.get('home_wins', 0)
        away_wins = h2h_data.get('away_wins', 0)
        draws = h2h_data.get('draws', 0)
        total = h2h_data.get('total_meetings', 0)
        home_goals = h2h_data.get('home_goals', 0)
        away_goals = h2h_data.get('away_goals', 0)
        
        # Calculate statistics
        stats = self.calculate_h2h_statistics(
            home_wins, away_wins, draws, home_goals, away_goals, total
        )
        
        # Add calculated fields
        h2h_data['stats'] = stats
        
        # Parse form string if it exists
        if 'form' in h2h_data and isinstance(h2h_data['form'], str):
            form_parts = self.parse_form_string(h2h_data['form'])
            if form_parts:
                h2h_data['home_wins'] = form_parts[0]
                h2h_data['draws'] = form_parts[1]
                h2h_data['away_wins'] = form_parts[2]
                h2h_data['total_meetings'] = sum(form_parts)
        
        # Analyze last meetings if available
        last_meetings = h2h_data.get('last_meetings', [])
        if last_meetings:
            recent_analysis = self.analyze_recent_meetings(last_meetings)
            h2h_data['recent_analysis'] = recent_analysis
        
        return h2h_data
    
    def calculate_h2h_statistics(self, home_wins: int, away_wins: int, draws: int,
                               home_goals: int, away_goals: int, total: int) -> Dict:
        """Calculate comprehensive H2H statistics"""
        if total == 0:
            return {
                'home_win_percentage': 0,
                'away_win_percentage': 0,
                'draw_percentage': 0,
                'avg_home_goals': 0,
                'avg_away_goals': 0,
                'avg_total_goals': 0,
                'goal_difference': 0,
                'home_dominance': 0,
                'competitiveness': 0,
            }
        
        # Win percentages
        home_win_pct = (home_wins / total) * 100
        away_win_pct = (away_wins / total) * 100
        draw_pct = (draws / total) * 100
        
        # Goal statistics
        avg_home_goals = home_goals / total
        avg_away_goals = away_goals / total
        avg_total_goals = (home_goals + away_goals) / total
        goal_difference = home_goals - away_goals
        
        # Dominance metrics
        home_dominance = ((home_wins - away_wins) / total) * 100
        competitiveness = 100 - abs(home_dominance)  # Higher = more competitive
        
        # Both teams scored percentage (estimate)
        # This would ideally come from match-level data
        estimated_both_scored = (min(home_wins, away_wins) / total) * 100 if total > 0 else 0
        
        return {
            'home_win_percentage': round(home_win_pct, 1),
            'away_win_percentage': round(away_win_pct, 1),
            'draw_percentage': round(draw_pct, 1),
            'avg_home_goals': round(avg_home_goals, 2),
            'avg_away_goals': round(avg_away_goals, 2),
            'avg_total_goals': round(avg_total_goals, 2),
            'goal_difference': goal_difference,
            'home_dominance': round(home_dominance, 1),
            'competitiveness': round(competitiveness, 1),
            'estimated_both_scored_pct': round(estimated_both_scored, 1),
            'goal_supremacy': round((avg_home_goals - avg_away_goals) / max(avg_total_goals, 0.1), 2),
        }
    
    def parse_form_string(self, form_string: str) -> Optional[List[int]]:
        """Parse '2-1-2' or 'W-D-L' format strings"""
        if not form_string:
            return None
        
        # Handle '2-1-2' format
        if '-' in form_string and form_string[0].isdigit():
            parts = form_string.split('-')
            if len(parts) == 3:
                try:
                    return [int(parts[0]), int(parts[1]), int(parts[2])]
                except ValueError:
                    return None
        
        # Handle 'W-D-L' format (count occurrences)
        elif any(c in form_string.upper() for c in ['W', 'D', 'L']):
            form_string = form_string.upper()
            home_wins = form_string.count('W')
            draws = form_string.count('D')
            away_wins = form_string.count('L')
            return [home_wins, draws, away_wins]
        
        return None
    
    def analyze_recent_meetings(self, last_meetings: List[Dict]) -> Dict:
        """Analyze recent meetings for trends"""
        if not last_meetings:
            return {'trend': 'neutral', 'momentum': 0, 'patterns': []}
        
        # Limit to last 10 meetings
        recent = last_meetings[:10]
        total_recent = len(recent)
        
        # Count recent results
        recent_results = [m.get('result', '') for m in recent]
        recent_home_wins = recent_results.count('home')
        recent_away_wins = recent_results.count('away')
        recent_draws = recent_results.count('draw')
        
        # Calculate recent win percentages
        recent_home_pct = (recent_home_wins / total_recent) * 100 if total_recent > 0 else 0
        recent_away_pct = (recent_away_wins / total_recent) * 100 if total_recent > 0 else 0
        
        # Analyze momentum (last 3 vs previous 3)
        momentum = 0
        if total_recent >= 6:
            last_three = recent_results[:3]
            previous_three = recent_results[3:6]
            
            last_points = self.calculate_points(last_three)
            previous_points = self.calculate_points(previous_three)
            
            # Momentum: positive = improving, negative = declining
            momentum = (last_points - previous_points) / 9  # Normalize to -1 to 1
        
        # Identify patterns
        patterns = self.identify_patterns(recent_results)
        
        # Determine trend
        if recent_home_pct > 60:
            trend = 'strong_home'
        elif recent_home_pct > 55:
            trend = 'moderate_home'
        elif recent_away_pct > 60:
            trend = 'strong_away'
        elif recent_away_pct > 55:
            trend = 'moderate_away'
        elif abs(recent_home_pct - recent_away_pct) < 10:
            trend = 'balanced'
        else:
            trend = 'neutral'
        
        return {
            'trend': trend,
            'momentum': round(momentum, 3),
            'recent_home_win_pct': round(recent_home_pct, 1),
            'recent_away_win_pct': round(recent_away_pct, 1),
            'recent_draw_pct': round((recent_draws / total_recent) * 100, 1) if total_recent > 0 else 0,
            'patterns': patterns,
            'sequence': ''.join([r[0].upper() if r else '?' for r in recent_results]),
        }
    
    def calculate_points(self, results: List[str]) -> int:
        """Calculate points from results (W=3, D=1, L=0)"""
        points = 0
        for result in results:
            if result == 'home' or result == 'W':
                points += 3
            elif result == 'draw' or result == 'D':
                points += 1
            elif result == 'away' or result == 'L':
                points += 0
        return points
    
    def identify_patterns(self, results: List[str]) -> List[str]:
        """Identify patterns in result sequences"""
        patterns = []
        
        if len(results) < 3:
            return patterns
        
        # Check for streaks
        current_streak = 1
        current_result = results[0]
        
        for i in range(1, len(results)):
            if results[i] == current_result:
                current_streak += 1
            else:
                if current_streak >= 3:
                    patterns.append(f"{current_result}_streak_{current_streak}")
                current_streak = 1
                current_result = results[i]
        
        # Check for alternating patterns
        if len(results) >= 4:
            alternating = True
            for i in range(2, len(results)):
                if results[i] != results[i-2]:
                    alternating = False
                    break
            if alternating:
                patterns.append("alternating_pattern")
        
        # Check for home/away bias
        home_count = results.count('home')
        away_count = results.count('away')
        total = len(results)
        
        if home_count > 0 and away_count > 0:
            if home_count / total > 0.7:
                patterns.append("strong_home_bias")
            elif away_count / total > 0.7:
                patterns.append("strong_away_bias")
        
        return patterns
    
    def calculate_comprehensive_weight(self, h2h_data: Dict) -> Dict:
        """Calculate comprehensive weight factors for H2H analysis"""
        if not h2h_data:
            return {
                'overall_weight': 0.5,
                'dominance_factor': 0.0,
                'trend_factor': 0.0,
                'goal_factor': 0.0,
                'frequency_factor': 0.0,
                'balance_factor': 0.0,
            }
        
        stats = h2h_data.get('stats', {})
        total = h2h_data.get('total_meetings', 0)
        recent_analysis = h2h_data.get('recent_analysis', {})
        
        # 1. Historical dominance factor
        home_win_pct = stats.get('home_win_percentage', 0) / 100
        away_win_pct = stats.get('away_win_percentage', 0) / 100
        dominance_diff = home_win_pct - away_win_pct
        
        if abs(dominance_diff) > 0.3:
            dominance_factor = dominance_diff * 1.5
        elif abs(dominance_diff) > 0.15:
            dominance_factor = dominance_diff * 1.0
        else:
            dominance_factor = dominance_diff * 0.5
        
        # 2. Recent trend factor
        trend = recent_analysis.get('trend', 'neutral')
        momentum = recent_analysis.get('momentum', 0)
        
        trend_map = {
            'strong_home': 0.4,
            'moderate_home': 0.2,
            'strong_away': -0.4,
            'moderate_away': -0.2,
            'balanced': 0.0,
            'neutral': 0.0,
        }
        trend_factor = trend_map.get(trend, 0) + (momentum * 0.2)
        
        # 3. Goal supremacy factor
        goal_supremacy = stats.get('goal_supremacy', 0)
        goal_factor = goal_supremacy * 0.3
        
        # 4. Meeting frequency factor
        if total >= 20:
            frequency_factor = 1.0  # Very reliable
        elif total >= 10:
            frequency_factor = 0.8  # Reliable
        elif total >= 5:
            frequency_factor = 0.5  # Somewhat reliable
        elif total >= 2:
            frequency_factor = 0.3  # Limited reliability
        else:
            frequency_factor = 0.1  # Very limited
        
        # 5. Competitive balance factor
        competitiveness = stats.get('competitiveness', 50) / 100
        balance_factor = (1 - competitiveness) * 0.5  # Higher for more one-sided rivalries
        
        # Combine factors with weights
        overall_weight = (
            dominance_factor * self.weights['historical_dominance'] +
            trend_factor * self.weights['recent_trend'] +
            goal_factor * self.weights['goal_supremacy'] +
            frequency_factor * self.weights['meeting_frequency'] +
            balance_factor * self.weights['competitive_balance']
        )
        
        # Normalize to 0-1 range (0.5 = neutral)
        normalized_weight = 0.5 + (overall_weight / 2)
        
        return {
            'overall_weight': round(max(0.1, min(0.9, normalized_weight)), 3),
            'dominance_factor': round(dominance_factor, 3),
            'trend_factor': round(trend_factor, 3),
            'goal_factor': round(goal_factor, 3),
            'frequency_factor': round(frequency_factor, 3),
            'balance_factor': round(balance_factor, 3),
            'total_meetings': total,
            'reliability': 'high' if total >= 10 else ('medium' if total >= 5 else 'low'),
        }
    
    def generate_comprehensive_prediction(self, match_id: int) -> H2HPrediction:
        """Generate comprehensive H2H-based prediction"""
        try:
            # Fetch H2H data
            h2h_data = self.fetch_head_to_head(match_id)
            
            if not h2h_data:
                return H2HPrediction(
                    prediction='neutral',
                    confidence=0.5,
                    weight_factor=0.5,
                    trend='no_data',
                    statistics={},
                    reasoning=['No head-to-head data available'],
                    raw_data={}
                )
            
            # Calculate weight factors
            weight_factors = self.calculate_comprehensive_weight(h2h_data)
            overall_weight = weight_factors['overall_weight']
            
            # Get recent trend
            recent_analysis = h2h_data.get('recent_analysis', {})
            trend = recent_analysis.get('trend', 'neutral')
            
            # Generate prediction based on weight
            if overall_weight > 0.6:
                prediction = 'home'
                confidence = overall_weight
                reasoning = [
                    f"Historical home dominance ({h2h_data.get('form')})",
                    f"Home win rate: {h2h_data['stats'].get('home_win_percentage', 0)}%",
                ]
            elif overall_weight < 0.4:
                prediction = 'away'
                confidence = 1 - overall_weight
                reasoning = [
                    f"Historical away dominance ({h2h_data.get('form')})",
                    f"Away win rate: {h2h_data['stats'].get('away_win_percentage', 0)}%",
                ]
            else:
                prediction = 'draw'
                confidence = 0.5
                reasoning = [
                    f"Historically balanced rivalry ({h2h_data.get('form')})",
                    f"Draw rate: {h2h_data['stats'].get('draw_percentage', 0)}%",
                ]
            
            # Add trend-based reasoning
            if trend != 'neutral':
                reasoning.append(f"Recent trend: {trend.replace('_', ' ')}")
            
            # Add meeting frequency reasoning
            total = h2h_data.get('total_meetings', 0)
            if total > 0:
                reliability = weight_factors['reliability']
                reasoning.append(f"Based on {total} previous meetings ({reliability} reliability)")
            
            # Adjust confidence based on data quality
            if total < 3:
                confidence *= 0.7  # Reduce confidence for limited data
            elif h2h_data.get('generated', False):
                confidence *= 0.9  # Slightly reduce for generated data
            
            # Ensure confidence is within bounds
            confidence = max(0.1, min(0.95, confidence))
            
            return H2HPrediction(
                prediction=prediction,
                confidence=round(confidence, 3),
                weight_factor=overall_weight,
                trend=trend,
                statistics=h2h_data.get('stats', {}),
                reasoning=reasoning,
                raw_data=h2h_data
            )
            
        except Exception as e:
            logger.error(f"Error generating H2H prediction for match {match_id}: {e}")
            return H2HPrediction(
                prediction='error',
                confidence=0.0,
                weight_factor=0.5,
                trend='error',
                statistics={},
                reasoning=[f"Error: {str(e)}"],
                raw_data={}
            )
    
    def batch_analyze_matches(self, match_ids: List[int]) -> Dict:
        """Analyze H2H for multiple matches"""
        results = []
        errors = []
        
        for match_id in match_ids:
            try:
                prediction = self.generate_comprehensive_prediction(match_id)
                if prediction.prediction == 'error':
                    errors.append({'match_id': match_id, 'error': prediction.reasoning[0]})
                else:
                    results.append({
                        'match_id': match_id,
                        'prediction': prediction.prediction,
                        'confidence': prediction.confidence,
                        'weight_factor': prediction.weight_factor,
                        'trend': prediction.trend,
                        'total_meetings': prediction.raw_data.get('total_meetings', 0),
                        'form': prediction.raw_data.get('form', '0-0-0'),
                    })
            except Exception as e:
                errors.append({'match_id': match_id, 'error': str(e)})
        
        # Calculate statistics
        if results:
            predictions = [r['prediction'] for r in results]
            confidences = [r['confidence'] for r in results]
            
            stats = {
                'total_analyzed': len(results),
                'home_predictions': predictions.count('home'),
                'away_predictions': predictions.count('away'),
                'draw_predictions': predictions.count('draw'),
                'avg_confidence': round(np.mean(confidences), 3),
                'high_confidence_predictions': sum(1 for c in confidences if c > 0.7),
                'low_confidence_predictions': sum(1 for c in confidences if c < 0.6),
                'errors': len(errors),
            }
        else:
            stats = {}
        
        return {
            'results': results,
            'errors': errors,
            'statistics': stats,
        }
    
    def generate_ml_features(self, h2h_data: Dict) -> Dict:
        """Generate ML-ready features from H2H data"""
        if not h2h_data:
            return {}
        
        stats = h2h_data.get('stats', {})
        recent = h2h_data.get('recent_analysis', {})
        total = h2h_data.get('total_meetings', 0)
        
        features = {
            # Basic statistics
            'h2h_home_win_pct': stats.get('home_win_percentage', 0) / 100,
            'h2h_away_win_pct': stats.get('away_win_percentage', 0) / 100,
            'h2h_draw_pct': stats.get('draw_percentage', 0) / 100,
            'h2h_total_meetings': total,
            
            # Goal statistics
            'h2h_avg_home_goals': stats.get('avg_home_goals', 0),
            'h2h_avg_away_goals': stats.get('avg_away_goals', 0),
            'h2h_avg_total_goals': stats.get('avg_total_goals', 0),
            'h2h_goal_difference': stats.get('goal_difference', 0),
            'h2h_goal_supremacy': stats.get('goal_supremacy', 0),
            
            # Dominance metrics
            'h2h_home_dominance': stats.get('home_dominance', 0) / 100,
            'h2h_competitiveness': stats.get('competitiveness', 50) / 100,
            
            # Recent trends
            'h2h_recent_home_pct': recent.get('recent_home_win_pct', 0) / 100,
            'h2h_recent_away_pct': recent.get('recent_away_win_pct', 0) / 100,
            'h2h_recent_momentum': recent.get('momentum', 0),
            
            # Derived features
            'h2h_win_rate_difference': (stats.get('home_win_percentage', 0) - 
                                       stats.get('away_win_percentage', 0)) / 100,
            'h2h_goal_margin': stats.get('avg_home_goals', 0) - stats.get('avg_away_goals', 0),
            'h2h_meeting_frequency': min(total / 20, 1.0),  # Normalized to 0-1
        }
        
        # Add pattern indicators
        patterns = recent.get('patterns', [])
        features['h2h_has_streak'] = 1.0 if any('streak' in p for p in patterns) else 0.0
        features['h2h_has_alternating'] = 1.0 if 'alternating_pattern' in patterns else 0.0
        
        # Round features
        for key in features:
            if isinstance(features[key], float):
                features[key] = round(features[key], 4)
        
        return features
    
    def save_prediction_to_api(self, match_id: int, prediction: H2HPrediction) -> bool:
        """Save H2H prediction back to Laravel API"""
        try:
            data = {
                'prediction': prediction.prediction,
                'confidence': prediction.confidence,
                'weight_factor': prediction.weight_factor,
                'trend': prediction.trend,
                'reasoning': prediction.reasoning,
                'statistics': prediction.statistics,
                'analysis_timestamp': datetime.now().isoformat(),
            }
            
            url = f"{self.api_base_url}/matches/{match_id}/h2h-prediction"
            response = self.session.post(url, json=data, timeout=10)
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error saving H2H prediction for match {match_id}: {e}")
            return False


# Usage examples
if __name__ == "__main__":
    # Initialize analyzer
    analyzer = EnhancedHeadToHeadAnalyzer(api_base_url="http://localhost:8000/api")
    
    # Analyze single match
    prediction = analyzer.generate_comprehensive_prediction(1)
    
    print(f"Match ID: 1")
    print(f"Prediction: {prediction.prediction}")
    print(f"Confidence: {prediction.confidence}")
    print(f"Weight Factor: {prediction.weight_factor}")
    print(f"Trend: {prediction.trend}")
    print(f"Reasoning: {', '.join(prediction.reasoning)}")
    print(f"Total Meetings: {prediction.raw_data.get('total_meetings', 0)}")
    print(f"Form: {prediction.raw_data.get('form', 'N/A')}")
    
    # Generate ML features
    if prediction.raw_data:
        ml_features = analyzer.generate_ml_features(prediction.raw_data)
        print(f"\nML Features (first 5):")
        for key in list(ml_features.keys())[:5]:
            print(f"  {key}: {ml_features[key]}")
    
    # Batch analyze multiple matches
    print(f"\n{'='*50}")
    print("Batch Analysis Example")
    print('='*50)
    
    batch_result = analyzer.batch_analyze_matches([1, 2, 3, 4, 5])
    
    if batch_result['results']:
        print(f"Total analyzed: {batch_result['statistics']['total_analyzed']}")
        print(f"Home predictions: {batch_result['statistics']['home_predictions']}")
        print(f"Away predictions: {batch_result['statistics']['away_predictions']}")
        print(f"Draw predictions: {batch_result['statistics']['draw_predictions']}")
        print(f"Average confidence: {batch_result['statistics']['avg_confidence']}")
        print(f"Errors: {batch_result['statistics']['errors']}")
        
        # Show individual results
        print(f"\nIndividual Results:")
        for result in batch_result['results'][:3]:  # Show first 3
            print(f"  Match {result['match_id']}: {result['prediction']} "
                  f"(conf: {result['confidence']}, meetings: {result['total_meetings']})")