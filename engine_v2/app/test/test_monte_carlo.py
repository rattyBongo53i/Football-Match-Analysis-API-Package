import pytest
import numpy as np
from app.services.monte_carlo import MonteCarloAnalyzer, MonteCarloConfig

@pytest.fixture
def monte_carlo():
    return MonteCarloAnalyzer(MonteCarloConfig(simulations=1000, random_seed=42))

@pytest.fixture
def sample_match():
    return {
        "match_id": "test_match_001",
        "home_avg_goals": 1.8,
        "away_avg_goals": 1.2,
        "home_advantage": 0.2,
        "venue_factor": 1.0,
        "selected_market": {"odds": 1.85}
    }

def test_simulate_match(monte_carlo, sample_match):
    """Test basic match simulation"""
    home_goals, away_goals = monte_carlo.simulate_match(
        sample_match["home_avg_goals"],
        sample_match["away_avg_goals"],
        sample_match["home_advantage"],
        sample_match["venue_factor"]
    )
    
    assert len(home_goals) == 1000
    assert len(away_goals) == 1000
    assert np.mean(home_goals) > np.mean(away_goals)  # Home advantage

def test_calculate_outcome_probabilities(monte_carlo):
    """Test probability calculation"""
    home_goals = np.array([2, 1, 3, 0, 2])
    away_goals = np.array([0, 1, 1, 0, 3])
    
    probs = monte_carlo.calculate_outcome_probabilities(home_goals, away_goals)
    
    assert "home_win" in probs
    assert "draw" in probs
    assert "away_win" in probs
    assert 0 <= probs["home_win"] <= 1
    assert abs(probs["home_win"] + probs["draw"] + probs["away_win"] - 1.0) < 0.01

def test_simulate_slip(monte_carlo):
    """Test full slip simulation"""
    matches = [
        {
            "match_id": "match_1",
            "home_avg_goals": 1.8,
            "away_avg_goals": 1.2,
            "home_advantage": 0.2,
            "venue_factor": 1.0,
            "selected_market": {"odds": 1.85}
        },
        {
            "match_id": "match_2",
            "home_avg_goals": 1.5,
            "away_avg_goals": 1.5,
            "home_advantage": 0.15,
            "venue_factor": 1.0,
            "selected_market": {"odds": 2.10}
        }
    ]
    
    stake = 0.5
    result = monte_carlo.simulate_slip(matches, stake)
    
    assert "total_odds" in result
    assert "possible_return" in result
    assert "confidence_score" in result
    assert "risk_level" in result
    assert result["total_odds"] > 1.0
    assert result["possible_return"] > stake

def test_generate_alternative_slips(monte_carlo):
    """Test alternative slip generation"""
    base_slip = {
        "master_slip_id": "test_slip_001",
        "stake": 0.5,
        "matches": [
            {
                "match_id": "match_1",
                "home_avg_goals": 1.8,
                "away_avg_goals": 1.2,
                "selected_market": {"odds": 1.85}
            }
        ]
    }
    
    alternatives = monte_carlo.generate_alternative_slips(base_slip, num_alternatives=3)
    
    assert len(alternatives) == 3
    assert all("slip_id" in alt for alt in alternatives)
    assert all("expected_value" in alt for alt in alternatives)