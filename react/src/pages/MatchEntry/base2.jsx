import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Autocomplete,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

// Memoized components
const MemoizedTextField = memo(TextField);
const MemoizedCard = memo(Card);
const MemoizedIconButton = memo(IconButton);

// Separate MarketItem component to fix hook issue
const MarketItem = memo(({ 
  market, 
  index, 
  marketErrors, 
  submitting, 
  onRemoveMarket, 
  onMarketChange 
}) => {
  const is1X2Market = market.name === '1X2';
  const isCorrectScore = market.name === 'Correct Score';
  const isAsianHandicap = market.name === 'Asian Handicap';
  const isBothTeamsScore = market.name === 'Both Teams to Score';
  const isOverUnder = market.name === 'Over/Under';
  const isHalftime = market.name === 'Halftime';
  const isCorners = market.name === 'Corners';
  const isPlayers = market.name === 'Player Markets';
  
  const handleOddsChange = useCallback((field, value, outcomeIndex = null) => {
    const updated = { ...market };
    
    if (outcomeIndex !== null && market.outcomes && market.outcomes[outcomeIndex]) {
      // Update specific outcome odds
      const updatedOutcomes = [...market.outcomes];
      updatedOutcomes[outcomeIndex] = {
        ...updatedOutcomes[outcomeIndex],
        odds: parseFloat(value) || 0
      };
      updated.outcomes = updatedOutcomes;
    } else if (field === 'odds') {
      updated.odds = parseFloat(value) || 0;
    } else if (field.startsWith('outcome_')) {
      // Handle outcomes for markets like Both Teams to Score
      const outcomeField = field.replace('outcome_', '');
      if (!updated.outcomes) updated.outcomes = [];
      const existingIndex = updated.outcomes.findIndex(o => o.outcome === outcomeField);
      if (existingIndex >= 0) {
        updated.outcomes[existingIndex] = {
          ...updated.outcomes[existingIndex],
          odds: parseFloat(value) || 0
        };
      } else {
        updated.outcomes.push({
          outcome: outcomeField,
          odds: parseFloat(value) || 0
        });
      }
    } else {
      updated[field] = parseFloat(value) || 0;
    }
    
    onMarketChange(index, updated);
  }, [market, index, onMarketChange]);

  // Get default outcomes based on market type
  const getDefaultOutcomes = () => {
    switch(market.name) {
      case 'Correct Score':
        return [
          { score: '1-0', odds: '' },
          { score: '0-1', odds: '' },
          { score: '1-1', odds: '' },
          { score: '2-1', odds: '' },
          { score: '1-2', odds: '' },
          { score: '0-0', odds: '' },
          { score: '2-2', odds: '' },
          { score: '2-3', odds: '' },
          { score: '3-2', odds: '' },
          { score: '3-1', odds: '' },
          { score: '1-3', odds: '' },
          { score: 'Any Other', odds: '' }
        ];
      case 'Asian Handicap':
        return [
          { handicap: 'Home +1', odds: '' },
          { handicap: 'Home -1', odds: '' },
          { handicap: 'Away +1', odds: '' },
          { handicap: 'Away -1', odds: '' },
          { handicap: 'Home +2', odds: '' },
          { handicap: 'Home -2', odds: '' },
          { handicap: 'Away +2', odds: '' },
          { handicap: 'Away -2', odds: '' }
        ];
      case 'Both Teams to Score':
        return [
          { outcome: 'Yes', odds: '' },
          { outcome: 'No', odds: '' }
        ];
      case 'Over/Under':
        return [
          { line: 'Over 2.5', odds: '' },
          { line: 'Under 2.5', odds: '' },
          { line: 'Over 3.5', odds: '' },
          { line: 'Under 3.5', odds: '' }
        ];
      case 'Halftime':
        return [
          { outcome: 'Home', odds: '' },
          { outcome: 'Draw', odds: '' },
          { outcome: 'Away', odds: '' }
        ];
      case 'Corners':
        return [
          { type: 'Home Over 7.5', odds: '' },
          { type: 'Home Under 7.5', odds: '' },
          { type: 'Away Over 7.5', odds: '' },
          { type: 'Away Under 7.5', odds: '' },
          { type: 'Total Over 10.5', odds: '' },
          { type: 'Total Under 10.5', odds: '' }
        ];
      case 'Player Markets':
        return [
          { type: 'Anytime Goalscorer', player: '', odds: '' },
          { type: 'First Goalscorer', player: '', odds: '' },
          { type: 'Assists Over 0.5', player: '', odds: '' },
          { type: 'Cards Over 1.5', player: '', odds: '' }
        ];
      default:
        return [];
    }
  };

  // Initialize outcomes if not present
  useEffect(() => {
    if ((isCorrectScore || isAsianHandicap || isBothTeamsScore || isOverUnder || isHalftime || isCorners || isPlayers) && 
        (!market.outcomes || market.outcomes.length === 0)) {
      const defaultOutcomes = getDefaultOutcomes();
      onMarketChange(index, { ...market, outcomes: defaultOutcomes });
    }
  }, [market.name, index, onMarketChange]);

  // Render correct score inputs
  const renderCorrectScore = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={4} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.score}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ''}
            onChange={(e) => handleOddsChange('odds', e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render asian handicap inputs
  const renderAsianHandicap = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={3} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.handicap}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ''}
            onChange={(e) => handleOddsChange('odds', e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render both teams to score inputs
  const renderBothTeamsScore = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <MemoizedTextField
          fullWidth
          label="Yes"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === 'Yes')?.odds || ''}
          onChange={(e) => handleOddsChange('outcome_Yes', e.target.value)}
          disabled={submitting}
        />
      </Grid>
      <Grid item xs={6}>
        <MemoizedTextField
          fullWidth
          label="No"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === 'No')?.odds || ''}
          onChange={(e) => handleOddsChange('outcome_No', e.target.value)}
          disabled={submitting}
        />
      </Grid>
    </Grid>
  );

  // Render over/under inputs
  const renderOverUnder = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={3} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.line}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ''}
            onChange={(e) => handleOddsChange('odds', e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render halftime inputs
  const renderHalftime = () => (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <MemoizedTextField
          fullWidth
          label="Home"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === 'Home')?.odds || ''}
          onChange={(e) => handleOddsChange('outcome_Home', e.target.value)}
          disabled={submitting}
        />
      </Grid>
      <Grid item xs={4}>
        <MemoizedTextField
          fullWidth
          label="Draw"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === 'Draw')?.odds || ''}
          onChange={(e) => handleOddsChange('outcome_Draw', e.target.value)}
          disabled={submitting}
        />
      </Grid>
      <Grid item xs={4}>
        <MemoizedTextField
          fullWidth
          label="Away"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === 'Away')?.odds || ''}
          onChange={(e) => handleOddsChange('outcome_Away', e.target.value)}
          disabled={submitting}
        />
      </Grid>
    </Grid>
  );

  // Render corners inputs
  const renderCorners = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={4} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.type}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ''}
            onChange={(e) => handleOddsChange('odds', e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render player markets inputs
  const renderPlayerMarkets = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={12} key={idx}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={5}>
              <MemoizedTextField
                fullWidth
                label="Type"
                value={outcome.type}
                disabled
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <MemoizedTextField
                fullWidth
                label="Player"
                value={outcome.player || ''}
                onChange={(e) => {
                  const updated = { ...market };
                  if (!updated.outcomes) updated.outcomes = [];
                  const updatedOutcomes = [...updated.outcomes];
                  updatedOutcomes[idx] = {
                    ...updatedOutcomes[idx],
                    player: e.target.value
                  };
                  updated.outcomes = updatedOutcomes;
                  onMarketChange(index, updated);
                }}
                disabled={submitting}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={3}>
              <MemoizedTextField
                fullWidth
                label="Odds"
                type="number"
                step="0.01"
                min="1.01"
                value={outcome.odds || ''}
                onChange={(e) => handleOddsChange('odds', e.target.value, idx)}
                disabled={submitting}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Grid item xs={12}>
      <MemoizedCard variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {market.name} {market.required && '*'}
            </Typography>
            {!market.required && (
              <MemoizedIconButton
                size="small"
                onClick={() => onRemoveMarket(index)}
                disabled={submitting}
              >
                <DeleteIcon />
              </MemoizedIconButton>
            )}
          </Box>
          
          {/* Render appropriate market type */}
          {is1X2Market ? (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <MemoizedTextField
                  fullWidth
                  label="Home"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={market.home_odds || ''}
                  onChange={(e) => handleOddsChange('home_odds', e.target.value)}
                  error={!!marketErrors.home_odds}
                  helperText={marketErrors.home_odds}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  fullWidth
                  label="Draw"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={market.draw_odds || ''}
                  onChange={(e) => handleOddsChange('draw_odds', e.target.value)}
                  error={!!marketErrors.draw_odds}
                  helperText={marketErrors.draw_odds}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  fullWidth
                  label="Away"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={market.away_odds || ''}
                  onChange={(e) => handleOddsChange('away_odds', e.target.value)}
                  error={!!marketErrors.away_odds}
                  helperText={marketErrors.away_odds}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          ) : isCorrectScore ? renderCorrectScore() :
            isAsianHandicap ? renderAsianHandicap() :
            isBothTeamsScore ? renderBothTeamsScore() :
            isOverUnder ? renderOverUnder() :
            isHalftime ? renderHalftime() :
            isCorners ? renderCorners() :
            isPlayers ? renderPlayerMarkets() : (
            <MemoizedTextField
              fullWidth
              label="Odds"
              type="number"
              step="0.01"
              min="1.01"
              value={market.odds || ''}
              onChange={(e) => handleOddsChange('odds', e.target.value)}
              disabled={submitting}
            />
          )}
        </CardContent>
      </MemoizedCard>
    </Grid>
  );
});

MarketItem.displayName = 'MarketItem';

// Helper function to get market type
const getMarketType = (marketName) => {
  const typeMap = {
    '1X2': 'match_result',
    'Correct Score': 'correct_score',
    'Asian Handicap': 'asian_handicap',
    'Both Teams to Score': 'both_teams_score',
    'Over/Under': 'over_under',
    'Halftime': 'halftime',
    'Corners': 'corners',
    'Player Markets': 'player_markets',
    'Double Chance': 'double_chance',
    'Draw No Bet': 'draw_no_bet',
    'Half Time/Full Time': 'ht_ft',
    'Total Goals': 'total_goals'
  };
  return typeMap[marketName] || 'general';
};

// Main MatchEntryForm component
const MatchEntryForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Match basic info
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    league: '',
    match_date: '',
    match_time: '21:00',
    venue: 'Home',
    referee: '',
    weather: 'Clear',
    status: 'scheduled',
    home_score: '',
    away_score: '',
    notes: ''
  });
  
  // Form data for home form
  const [homeForm, setHomeForm] = useState({
    raw_form: [],
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_scored: 0,
    goals_conceded: 0,
    avg_goals_scored: 0,
    avg_goals_conceded: 0,
    clean_sheets: 0,
    failed_to_score: 0,
    form_string: '',
    form_rating: 0,
    form_momentum: 0
  });
  
  // Form data for away form
  const [awayForm, setAwayForm] = useState({
    raw_form: [],
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_scored: 0,
    goals_conceded: 0,
    avg_goals_scored: 0,
    avg_goals_conceded: 0,
    clean_sheets: 0,
    failed_to_score: 0,
    form_string: '',
    form_rating: 0,
    form_momentum: 0
  });
  
  // Head to head
  const [headToHead, setHeadToHead] = useState({
    home_wins: 0,
    away_wins: 0,
    draws: 0
  });
  
  // Markets
  const [markets, setMarkets] = useState([
    { id: 1, name: '1X2', required: true, home_odds: '', draw_odds: '', away_odds: '' },
    { id: 2, name: 'Correct Score', required: false, outcomes: [] },
    { id: 3, name: 'Asian Handicap', required: false, outcomes: [] },
    { id: 4, name: 'Both Teams to Score', required: false, outcomes: [] },
    { id: 5, name: 'Over/Under', required: false, outcomes: [] },
    { id: 6, name: 'Halftime', required: false, outcomes: [] },
    { id: 7, name: 'Corners', required: false, outcomes: [] },
    { id: 8, name: 'Player Markets', required: false, outcomes: [] },
    { id: 9, name: 'Double Chance', required: false, odds: '' },
    { id: 10, name: 'Draw No Bet', required: false, odds: '' },
    { id: 11, name: 'Half Time/Full Time', required: false, odds: '' },
    { id: 12, name: 'Total Goals', required: false, odds: '' }
  ]);
  
  const [marketErrors, setMarketErrors] = useState({});
  
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const handleMarketChange = useCallback((index, updatedMarket) => {
    setMarkets(prev => {
      const updated = [...prev];
      updated[index] = updatedMarket;
      return updated;
    });
  }, []);
  
  const removeMarket = useCallback((index) => {
    setMarkets(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const addMarket = useCallback(() => {
    setMarkets(prev => [
      ...prev,
      { 
        id: Date.now(), 
        name: 'Custom Market', 
        required: false, 
        odds: '',
        market_type: 'custom'
      }
    ]);
  }, []);
  
  const validateMarkets = () => {
    const errors = {};
    
    // Check required 1X2 market
    const oneXTwoMarket = markets.find(m => m.name === '1X2');
    if (oneXTwoMarket) {
      if (!oneXTwoMarket.home_odds || parseFloat(oneXTwoMarket.home_odds) < 1.01) {
        errors.home_odds = 'Home odds must be at least 1.01';
      }
      if (!oneXTwoMarket.draw_odds || parseFloat(oneXTwoMarket.draw_odds) < 1.01) {
        errors.draw_odds = 'Draw odds must be at least 1.01';
      }
      if (!oneXTwoMarket.away_odds || parseFloat(oneXTwoMarket.away_odds) < 1.01) {
        errors.away_odds = 'Away odds must be at least 1.01';
      }
    }
    
    setMarketErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateMarkets()) {
      setError('Please fix market errors before submitting');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare markets data for API
      const marketsData = markets.map(market => {
        const marketData = {
          name: market.name,
          market_type: getMarketType(market.name),
          odds: market.odds || 0
        };
        
        // Add outcomes based on market type
        if (market.name === '1X2') {
          marketData.outcomes = [
            { outcome: 'home', odds: market.home_odds || 0 },
            { outcome: 'draw', odds: market.draw_odds || 0 },
            { outcome: 'away', odds: market.away_odds || 0 }
          ];
        } else if (market.outcomes && market.outcomes.length > 0) {
          marketData.outcomes = market.outcomes.map(outcome => {
            if (market.name === 'Correct Score') {
              return { outcome: `score_${outcome.score}`, odds: outcome.odds || 0 };
            } else if (market.name === 'Asian Handicap') {
              return { outcome: `handicap_${outcome.handicap.replace(/\s+/g, '_')}`, odds: outcome.odds || 0 };
            } else if (market.name === 'Both Teams to Score') {
              return { outcome: outcome.outcome.toLowerCase(), odds: outcome.odds || 0 };
            } else if (market.name === 'Over/Under') {
              return { outcome: outcome.line.replace(/\s+/g, '_').toLowerCase(), odds: outcome.odds || 0 };
            } else if (market.name === 'Halftime') {
              return { outcome: outcome.outcome.toLowerCase(), odds: outcome.odds || 0 };
            } else if (market.name === 'Corners') {
              return { outcome: outcome.type.replace(/\s+/g, '_').toLowerCase(), odds: outcome.odds || 0 };
            } else if (market.name === 'Player Markets') {
              return { 
                outcome: `${outcome.type.replace(/\s+/g, '_').toLowerCase()}_${outcome.player || 'player'}`,
                odds: outcome.odds || 0,
                player: outcome.player || ''
              };
            }
            return { outcome: 'default', odds: outcome.odds || 0 };
          });
        }
        
        return marketData;
      });
      
      // Filter out empty markets (optional)
      const filteredMarkets = marketsData.filter(market => {
        if (market.name === '1X2') {
          return market.outcomes.some(o => o.odds > 0);
        } else if (market.outcomes) {
          return market.outcomes.some(o => o.odds > 0);
        }
        return market.odds > 0;
      });
      
      // Prepare final data
      const submitData = {
        ...formData,
        home_form: homeForm,
        away_form: awayForm,
        head_to_head: headToHead,
        markets: filteredMarkets
      };
      
      // Send to API
      const response = await fetch('http://localhost:8000/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setSuccess('Match created successfully!');
      console.log('Success:', result);
      
      // Reset form after successful submission
      setTimeout(() => {
        setActiveStep(0);
        setFormData({
          home_team: '',
          away_team: '',
          league: '',
          match_date: '',
          match_time: '21:00',
          venue: 'Home',
          referee: '',
          weather: 'Clear',
          status: 'scheduled',
          home_score: '',
          away_score: '',
          notes: ''
        });
        setMarkets([
          { id: 1, name: '1X2', required: true, home_odds: '', draw_odds: '', away_odds: '' },
          { id: 2, name: 'Correct Score', required: false, outcomes: [] },
          { id: 3, name: 'Asian Handicap', required: false, outcomes: [] },
          { id: 4, name: 'Both Teams to Score', required: false, outcomes: [] },
          { id: 5, name: 'Over/Under', required: false, outcomes: [] },
          { id: 6, name: 'Halftime', required: false, outcomes: [] },
          { id: 7, name: 'Corners', required: false, outcomes: [] },
          { id: 8, name: 'Player Markets', required: false, outcomes: [] },
          { id: 9, name: 'Double Chance', required: false, odds: '' },
          { id: 10, name: 'Draw No Bet', required: false, odds: '' },
          { id: 11, name: 'Half Time/Full Time', required: false, odds: '' },
          { id: 12, name: 'Total Goals', required: false, odds: '' }
        ]);
        setMarketErrors({});
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to create match: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  const steps = ['Match Details', 'Team Forms', 'Markets', 'Review'];
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Home Team"
                value={formData.home_team}
                onChange={(e) => handleInputChange('home_team', e.target.value)}
                disabled={submitting}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Away Team"
                value={formData.away_team}
                onChange={(e) => handleInputChange('away_team', e.target.value)}
                disabled={submitting}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="League"
                value={formData.league}
                onChange={(e) => handleInputChange('league', e.target.value)}
                disabled={submitting}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Match Date"
                type="date"
                value={formData.match_date}
                onChange={(e) => handleInputChange('match_date', e.target.value)}
                disabled={submitting}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Match Time"
                type="time"
                value={formData.match_time}
                onChange={(e) => handleInputChange('match_time', e.target.value)}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Venue</InputLabel>
                <Select
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  label="Venue"
                  disabled={submitting}
                >
                  <MenuItem value="Home">Home</MenuItem>
                  <MenuItem value="Away">Away</MenuItem>
                  <MenuItem value="Neutral">Neutral</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Referee"
                value={formData.referee}
                onChange={(e) => handleInputChange('referee', e.target.value)}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Weather</InputLabel>
                <Select
                  value={formData.weather}
                  onChange={(e) => handleInputChange('weather', e.target.value)}
                  label="Weather"
                  disabled={submitting}
                >
                  <MenuItem value="Clear">Clear</MenuItem>
                  <MenuItem value="Rainy">Rainy</MenuItem>
                  <MenuItem value="Cloudy">Cloudy</MenuItem>
                  <MenuItem value="Snow">Snow</MenuItem>
                  <MenuItem value="Windy">Windy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Home Team Form</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form String"
                    value={homeForm.form_string}
                    onChange={(e) => setHomeForm(prev => ({ ...prev, form_string: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form Rating"
                    type="number"
                    value={homeForm.form_rating}
                    onChange={(e) => setHomeForm(prev => ({ ...prev, form_rating: parseFloat(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form Momentum"
                    type="number"
                    value={homeForm.form_momentum}
                    onChange={(e) => setHomeForm(prev => ({ ...prev, form_momentum: parseFloat(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Away Team Form</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form String"
                    value={awayForm.form_string}
                    onChange={(e) => setAwayForm(prev => ({ ...prev, form_string: e.target.value }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form Rating"
                    type="number"
                    value={awayForm.form_rating}
                    onChange={(e) => setAwayForm(prev => ({ ...prev, form_rating: parseFloat(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Form Momentum"
                    type="number"
                    value={awayForm.form_momentum}
                    onChange={(e) => setAwayForm(prev => ({ ...prev, form_momentum: parseFloat(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Head to Head</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Home Wins"
                    type="number"
                    value={headToHead.home_wins}
                    onChange={(e) => setHeadToHead(prev => ({ ...prev, home_wins: parseInt(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Draws"
                    type="number"
                    value={headToHead.draws}
                    onChange={(e) => setHeadToHead(prev => ({ ...prev, draws: parseInt(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Away Wins"
                    type="number"
                    value={headToHead.away_wins}
                    onChange={(e) => setHeadToHead(prev => ({ ...prev, away_wins: parseInt(e.target.value) || 0 }))}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Markets</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addMarket}
                disabled={submitting}
              >
                Add Custom Market
              </Button>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {markets.map((market, index) => (
                <MarketItem
                  key={market.id}
                  market={market}
                  index={index}
                  marketErrors={marketErrors}
                  submitting={submitting}
                  onRemoveMarket={removeMarket}
                  onMarketChange={handleMarketChange}
                />
              ))}
            </Grid>
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Match Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Home Team: {formData.home_team}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Away Team: {formData.away_team}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">League: {formData.league}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date: {formData.match_date} at {formData.match_time}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Markets:</Typography>
                {markets.filter(m => {
                  if (m.name === '1X2') return m.home_odds || m.draw_odds || m.away_odds;
                  if (m.outcomes) return m.outcomes.some(o => o.odds);
                  return m.odds;
                }).map((market, idx) => (
                  <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                    • {market.name}: {market.name === '1X2' ? 
                      `H: ${market.home_odds || '-'} | D: ${market.draw_odds || '-'} | A: ${market.away_odds || '-'}` : 
                      market.odds || 'Multiple outcomes'}
                  </Typography>
                ))}
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SportsSoccerIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4">Match Entry Form</Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={<SaveIcon />}
              >
                {submitting ? 'Submitting...' : 'Submit Match'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MatchEntryForm;