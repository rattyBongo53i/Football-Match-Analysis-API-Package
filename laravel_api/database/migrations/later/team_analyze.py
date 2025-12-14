# python_generator/team_analyzer.py

class TeamAnalyzer:
    def __init__(self, api_base_url="http://laravel-api.test/api"):
        self.api_base_url = api_base_url
    
    def get_team_data(self, team_code):
        """Fetch team data for ML analysis"""
        url = f"{self.api_base_url}/teams/{team_code}"
        response = requests.get(url)
        
        if response.status_code == 200:
            return response.json()['data']
        return None
    
    def compare_teams(self, home_team_code, away_team_code):
        """Compare two teams for prediction"""
        home_data = self.get_team_data(home_team_code)
        away_data = self.get_team_data(away_team_code)
        
        if not home_data or not away_data:
            return None
        
        # Calculate advantage metrics
        rating_advantage = home_data['ratings']['overall'] - away_data['ratings']['overall']
        form_advantage = home_data['ratings']['form'] - away_data['ratings']['form']
        home_advantage = home_data['ratings']['home'] - away_data['ratings']['away']
        
        # Calculate combined strength
        combined_rating = (home_data['ratings']['overall'] + away_data['ratings']['overall']) / 2
        
        return {
            'home_team': home_data['name'],
            'away_team': away_data['name'],
            'advantages': {
                'rating': round(rating_advantage, 2),
                'form': round(form_advantage, 2),
                'home': round(home_advantage, 2)
            },
            'combined_strength': round(combined_rating, 2),
            'expected_goals': self.calculate_expected_goals(home_data, away_data)
        }