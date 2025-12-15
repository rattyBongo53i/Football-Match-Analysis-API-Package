import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '../../services/api/matchService';
import { createMarketFormHandler } from '../../utils/marketFormHandler';
import MarketOddsInput from '../../components/matches/MarketOddsInput';
import TeamFormInput from '../../components/matches/TeamFormInput';
import './MatchEntryForm.css';

const MatchEntryForm = ({ matchId, initialData = null }) => {
  const navigate = useNavigate();
  const marketHandler = createMarketFormHandler();
  
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    league: '',
    match_date: new Date().toISOString().split('T')[0],
    match_time: '15:00',
    venue: '',
    referee: '',
    weather: 'Clear',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    home_form: {},
    away_form: {},
    head_to_head: {},
    notes: ''
  });

  const [markets, setMarkets] = useState(marketHandler.getDefaultMarkets());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [marketErrors, setMarketErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.markets) {
        setMarkets(initialData.markets);
      }
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMarketChange = (index, updatedMarket) => {
    setMarkets(prev => {
      const newMarkets = [...prev];
      newMarkets[index] = updatedMarket;
      return newMarkets;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.home_team.trim()) {
      newErrors.home_team = 'Home team is required';
    }
    
    if (!formData.away_team.trim()) {
      newErrors.away_team = 'Away team is required';
    }
    
    if (formData.home_team === formData.away_team) {
      newErrors.away_team = 'Teams must be different';
    }
    
    if (!formData.league.trim()) {
      newErrors.league = 'League is required';
    }
    
    if (!formData.match_date) {
      newErrors.match_date = 'Match date is required';
    }
    
    // Validate markets
    const { isValid: marketsValid, errors: marketValidationErrors } = 
      marketHandler.validateMarkets(markets);
    
    if (!marketsValid) {
      setMarketErrors(marketValidationErrors);
    } else {
      setMarketErrors({});
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && marketsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const matchData = {
        ...formData,
        markets: marketHandler.prepareMarketsForBackend(markets)
      };
      
      let savedMatch;
      if (matchId) {
        savedMatch = await matchService.updateMatch(matchId, matchData);
        alert('Match updated successfully!');
      } else {
        savedMatch = await matchService.createMatch(matchData);
        alert('Match saved successfully!');
      }
      
      // Navigate to match details
      navigate(`/matches/${savedMatch.id}`);
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Failed to save match. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      navigate('/matches');
    }
  };

  return (
    <div className="match-entry-form-container">
      <form onSubmit={handleSubmit} className="match-entry-form">
        <div className="form-header">
          <h2>{matchId ? 'Edit Match' : 'Add New Match'}</h2>
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (matchId ? 'Update Match' : 'Save Match')}
            </button>
          </div>
        </div>

        <div className="form-grid">
          {/* Basic Match Info */}
          <div className="form-section">
            <h3>🏟️ Match Information</h3>
            
            <div className="form-group">
              <label htmlFor="home_team">Home Team *</label>
              <input
                id="home_team"
                type="text"
                value={formData.home_team}
                onChange={(e) => handleInputChange('home_team', e.target.value)}
                className={errors.home_team ? 'error' : ''}
                placeholder="Enter home team name"
              />
              {errors.home_team && (
                <span className="error-message">{errors.home_team}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="away_team">Away Team *</label>
              <input
                id="away_team"
                type="text"
                value={formData.away_team}
                onChange={(e) => handleInputChange('away_team', e.target.value)}
                className={errors.away_team ? 'error' : ''}
                placeholder="Enter away team name"
              />
              {errors.away_team && (
                <span className="error-message">{errors.away_team}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="league">League *</label>
                <input
                  id="league"
                  type="text"
                  value={formData.league}
                  onChange={(e) => handleInputChange('league', e.target.value)}
                  className={errors.league ? 'error' : ''}
                  placeholder="e.g., Premier League"
                />
              </div>

              <div className="form-group">
                <label htmlFor="match_date">Match Date *</label>
                <input
                  id="match_date"
                  type="date"
                  value={formData.match_date}
                  onChange={(e) => handleInputChange('match_date', e.target.value)}
                  className={errors.match_date ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="match_time">Match Time</label>
                <input
                  id="match_time"
                  type="time"
                  value={formData.match_time}
                  onChange={(e) => handleInputChange('match_time', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="venue">Venue</label>
                <input
                  id="venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Stadium name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="referee">Referee</label>
                <input
                  id="referee"
                  type="text"
                  value={formData.referee}
                  onChange={(e) => handleInputChange('referee', e.target.value)}
                  placeholder="Referee name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weather">Weather</label>
                <select
                  id="weather"
                  value={formData.weather}
                  onChange={(e) => handleInputChange('weather', e.target.value)}
                >
                  <option value="Clear">Clear</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Snow">Snow</option>
                  <option value="Windy">Windy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Team Forms */}
          <div className="form-section">
            <h3>📈 Team Forms</h3>
            <TeamFormInput
              homeForm={formData.home_form}
              awayForm={formData.away_form}
              onChange={(homeForm, awayForm) => {
                handleInputChange('home_form', homeForm);
                handleInputChange('away_form', awayForm);
              }}
            />
          </div>

          {/* Market Odds - CRITICAL SECTION */}
          <div className="form-section">
            <h3>🎯 Market Odds *</h3>
            <div className="market-odds-section">
              {markets.map((market, index) => (
                <div key={market.id} className="market-card">
                  <div className="market-header">
                    <h4>{market.name} {market.required && '*'}</h4>
                    {!market.required && (
                      <button
                        type="button"
                        className="btn-remove-market"
                        onClick={() => {
                          setMarkets(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <MarketOddsInput
                    market={market}
                    onChange={(updatedMarket) => handleMarketChange(index, updatedMarket)}
                    errors={marketErrors}
                  />
                </div>
              ))}
            </div>

            {/* Add More Markets Button */}
            <button
              type="button"
              className="btn-add-market"
              onClick={() => {
                setMarkets(prev => [
                  ...prev,
                  {
                    id: `market_${Date.now()}`,
                    name: 'Double Chance',
                    market_type: 'double_chance',
                    odds: 0,
                    required: false
                  }
                ]);
              }}
            >
              + Add Another Market
            </button>
          </div>

          {/* Additional Info */}
          <div className="form-section">
            <h3>📝 Additional Information</h3>
            
            <div className="form-group">
              <label htmlFor="head_to_head">Head to Head (JSON)</label>
              <textarea
                id="head_to_head"
                value={JSON.stringify(formData.head_to_head, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('head_to_head', parsed);
                  } catch {
                    // Keep as string if invalid JSON
                    handleInputChange('head_to_head', {});
                  }
                }}
                rows="4"
                placeholder='{"last_5_meetings": [], "home_wins": 0, "away_wins": 0, "draws": 0}'
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="3"
                placeholder="Additional notes about this match..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MatchEntryForm;