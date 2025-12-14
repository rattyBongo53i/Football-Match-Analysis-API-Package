// components/match/EnhancedMatchForm.jsx
import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Autocomplete,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Delete,
  HelpOutline,
  Save,
  SportsSoccer,
  TrendingUp,
  AddCircle,
} from "@mui/icons-material";
import OddsInputTable from "./OddsInputTable";
import Last10Form from "./Last10Form";
import axios from "axios";

const initialMatchState = {
  // Basic match info
  home_team: "",
  home_team_code: "",
  away_team: "",
  away_team_code: "",
  league: "",
  competition: "",
  match_date: "",
  venue: "",
  match_time: "",
  
  // Head to Head data
  head_to_head_summary: "",
  head_to_head_stats: {
    home_wins: 0,
    away_wins: 0,
    draws: 0,
    total_meetings: 0,
    last_meeting_result: "",
    last_meeting_date: "",
    avg_home_goals: 0,
    avg_away_goals: 0,
  },
  
  // Team forms (comprehensive data)
  home_team_form: {
    raw_form: [],
    form_string: "",
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
    form_rating: 5.0,
    form_momentum: 0,
    opponent_strength: {
      avg_opponent_rank: 0,
      strong_opponents: 0,
      weak_opponents: 0,
    },
  },
  
  away_team_form: {
    raw_form: [],
    form_string: "",
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
    form_rating: 5.0,
    form_momentum: 0,
    opponent_strength: {
      avg_opponent_rank: 0,
      strong_opponents: 0,
      weak_opponents: 0,
    },
  },
  
  // Odds data
  odds: {
    home_win: 0,
    draw: 0,
    away_win: 0,
    over_2_5: 0,
    under_2_5: 0,
    btts_yes: 0,
    btts_no: 0,
    home_dnb: 0,
    away_dnb: 0,
  },
  
  // Additional match data
  weather_conditions: "Clear",
  referee: "",
  importance: "regular", // regular, derby, cup_final, relegation, title_decider
  tv_coverage: "local",
  predicted_attendance: 0,
  
  // ML flags
  for_ml_training: false,
  prediction_ready: false,
};

const leagueOptions = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "FA Cup",
  "EFL Cup",
  "International Friendly",
];

const competitionOptions = [
  "League",
  "Cup",
  "Friendly",
  "Tournament",
  "Playoff",
];

const venueOptions = [
  "Home",
  "Away",
  "Neutral",
];

// Memoized components
const MemoizedTextField = memo(({ label, value, onChange, ...props }) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    onChange={onChange}
    variant="outlined"
    color="primary"
    {...props}
  />
));

const TeamSearchField = memo(({ label, value, onChange, onTeamSelect, teams }) => {
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearch = useCallback(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/teams/search?q=${searchTerm}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, []);
  
  return (
    <Autocomplete
      freeSolo
      options={searchResults}
      getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
      onInputChange={(event, newValue) => {
        onChange(newValue);
        handleSearch(newValue);
      }}
      onChange={(event, newValue) => {
        if (typeof newValue === 'object' && newValue) {
          onTeamSelect(newValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsSoccer fontSize="small" />
            <Box>
              <Typography variant="body1">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.code} • {option.country}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
    />
  );
});

const EnhancedMatchForm = memo(({ onSubmit, teams = [] }) => {
  const [match, setMatch] = useState(initialMatchState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  
  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);
  
  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      // Store teams if needed for dropdowns
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };
  
  // Auto-calculate form statistics when raw form changes
  useEffect(() => {
    if (autoCalculate) {
      calculateFormStats('home');
      calculateFormStats('away');
    }
  }, [match.home_team_form.raw_form, match.away_team_form.raw_form, autoCalculate]);
  
  const calculateFormStats = (teamType) => {
    const formKey = `${teamType}_team_form`;
    const rawForm = match[formKey].raw_form;
    
    if (!rawForm || rawForm.length === 0) return;
    
    let wins = 0, draws = 0, losses = 0;
    let goalsScored = 0, goalsConceded = 0;
    let cleanSheets = 0, failedToScore = 0;
    let formString = '';
    
    rawForm.forEach((match, index) => {
      // Parse score
      const score = match.result?.split('-') || ['0', '0'];
      const teamScore = parseInt(score[0]);
      const opponentScore = parseInt(score[1]);
      
      goalsScored += teamScore;
      goalsConceded += opponentScore;
      
      if (teamScore === 0) failedToScore++;
      if (opponentScore === 0) cleanSheets++;
      
      // Count outcomes
      switch (match.outcome) {
        case 'W': 
          wins++; 
          formString += 'W';
          break;
        case 'D': 
          draws++; 
          formString += 'D';
          break;
        case 'L': 
          losses++; 
          formString += 'L';
          break;
        default:
          formString += '?';
      }
    });
    
    const matchesPlayed = rawForm.length;
    const avgGoalsScored = matchesPlayed > 0 ? goalsScored / matchesPlayed : 0;
    const avgGoalsConceded = matchesPlayed > 0 ? goalsConceded / matchesPlayed : 0;
    
    // Calculate form rating (simplified)
    let formRating = 5.0;
    if (matchesPlayed > 0) {
      const winPoints = wins * 3;
      const drawPoints = draws * 1;
      const totalPoints = winPoints + drawPoints;
      const maxPoints = matchesPlayed * 3;
      formRating = (totalPoints / maxPoints) * 10;
    }
    
    // Calculate momentum (last 3 vs previous 3)
    let momentum = 0;
    if (rawForm.length >= 6) {
      const recent = rawForm.slice(0, 3);
      const previous = rawForm.slice(3, 6);
      
      const recentPoints = calculatePoints(recent);
      const previousPoints = calculatePoints(previous);
      momentum = (recentPoints - previousPoints) / 9; // Normalize to -1 to 1
    }
    
    setMatch(prev => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        matches_played: matchesPlayed,
        wins,
        draws,
        losses,
        goals_scored: goalsScored,
        goals_conceded: goalsConceded,
        avg_goals_scored: parseFloat(avgGoalsScored.toFixed(2)),
        avg_goals_conceded: parseFloat(avgGoalsConceded.toFixed(2)),
        clean_sheets: cleanSheets,
        failed_to_score: failedToScore,
        form_string: formString,
        form_rating: parseFloat(formRating.toFixed(2)),
        form_momentum: parseFloat(momentum.toFixed(2)),
      }
    }));
  };
  
  const calculatePoints = (matches) => {
    return matches.reduce((points, match) => {
      switch (match.outcome) {
        case 'W': return points + 3;
        case 'D': return points + 1;
        case 'L': return points + 0;
        default: return points;
      }
    }, 0);
  };
  
  // Field update handler
  const updateField = useCallback((field, value) => {
    setMatch(prev => {
      // Handle nested fields
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);
  
  // Team selection handler
  const handleTeamSelect = useCallback((teamType, teamData) => {
    setMatch(prev => ({
      ...prev,
      [`${teamType}_team`]: teamData.name,
      [`${teamType}_team_code`]: teamData.code,
      [`${teamType}_team_form`]: {
        ...prev[`${teamType}_team_form`],
        // You could fetch existing team form data here
      }
    }));
  }, []);
  
  // Form submission handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!match.home_team || !match.away_team || !match.league) {
      alert("Please fill in required fields: Home Team, Away Team, and League");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare final match data
      const matchData = {
        ...match,
        // Ensure numeric fields are properly typed
        home_team_form: {
          ...match.home_team_form,
          matches_played: parseInt(match.home_team_form.matches_played) || 0,
          wins: parseInt(match.home_team_form.wins) || 0,
          draws: parseInt(match.home_team_form.draws) || 0,
          losses: parseInt(match.home_team_form.losses) || 0,
          goals_scored: parseInt(match.home_team_form.goals_scored) || 0,
          goals_conceded: parseInt(match.home_team_form.goals_conceded) || 0,
        },
        away_team_form: {
          ...match.away_team_form,
          matches_played: parseInt(match.away_team_form.matches_played) || 0,
          wins: parseInt(match.away_team_form.wins) || 0,
          draws: parseInt(match.away_team_form.draws) || 0,
          losses: parseInt(match.away_team_form.losses) || 0,
          goals_scored: parseInt(match.away_team_form.goals_scored) || 0,
          goals_conceded: parseInt(match.away_team_form.goals_conceded) || 0,
        },
        // Convert date to proper format
        match_date: match.match_date ? new Date(match.match_date).toISOString().split('T')[0] : null,
      };
      
      await onSubmit(matchData);
      setMatch(initialMatchState);
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Error submitting match: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [match, onSubmit]);
  
  const handleReset = useCallback(() => {
    setMatch(initialMatchState);
  }, []);
  
  // Handle form data from Last10Form component
  const handleHomeFormChange = useCallback((rawForm) => {
    setMatch(prev => ({
      ...prev,
      home_team_form: {
        ...prev.home_team_form,
        raw_form: rawForm
      }
    }));
  }, []);
  
  const handleAwayFormChange = useCallback((rawForm) => {
    setMatch(prev => ({
      ...prev,
      away_team_form: {
        ...prev.away_team_form,
        raw_form: rawForm
      }
    }));
  }, []);
  
  // Handle odds change
  const handleOddsChange = useCallback((odds) => {
    updateField('odds', odds);
  }, [updateField]);
  
  // Form validation
  const isFormValid = useMemo(() => {
    return match.home_team && match.away_team && match.league;
  }, [match.home_team, match.away_team, match.league]);
  
  // Form sections
  const BasicInfoSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "primary.main" }}>
        Basic Match Information
      </Typography>
      
      <Grid container spacing={3}>
        {/* Home Team */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Home Team *
            </Typography>
            <MemoizedTextField
              label="Home Team Name"
              value={match.home_team}
              onChange={(e) => updateField('home_team', e.target.value)}
              required
              fullWidth
            />
          </Box>
          <MemoizedTextField
            label="Home Team Code"
            value={match.home_team_code}
            onChange={(e) => updateField('home_team_code', e.target.value.toUpperCase())}
            placeholder="e.g., MUN, LIV, ARS"
            fullWidth
          />
        </Grid>
        
        {/* Away Team */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Away Team *
            </Typography>
            <MemoizedTextField
              label="Away Team Name"
              value={match.away_team}
              onChange={(e) => updateField('away_team', e.target.value)}
              required
              fullWidth
            />
          </Box>
          <MemoizedTextField
            label="Away Team Code"
            value={match.away_team_code}
            onChange={(e) => updateField('away_team_code', e.target.value.toUpperCase())}
            placeholder="e.g., MCI, CHE, TOT"
            fullWidth
          />
        </Grid>
        
        {/* League and Competition */}
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            select
            label="League *"
            value={match.league}
            onChange={(e) => updateField('league', e.target.value)}
            required
            fullWidth
            SelectProps={{
              native: true,
            }}
          >
            <option value=""></option>
            {leagueOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </MemoizedTextField>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            select
            label="Competition Type"
            value={match.competition}
            onChange={(e) => updateField('competition', e.target.value)}
            fullWidth
            SelectProps={{
              native: true,
            }}
          >
            <option value=""></option>
            {competitionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </MemoizedTextField>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            select
            label="Venue"
            value={match.venue}
            onChange={(e) => updateField('venue', e.target.value)}
            fullWidth
            SelectProps={{
              native: true,
            }}
          >
            <option value=""></option>
            {venueOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </MemoizedTextField>
        </Grid>
        
        {/* Match Date and Time */}
        <Grid item xs={12} md={6}>
          <MemoizedTextField
            label="Match Date"
            type="date"
            value={match.match_date}
            onChange={(e) => updateField('match_date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <MemoizedTextField
            label="Match Time"
            type="time"
            value={match.match_time}
            onChange={(e) => updateField('match_time', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Paper>
  ), [match, updateField]);
  
  const FormStatsSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "secondary.main" }}>
          Team Form Statistics
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              color="primary"
            />
          }
          label="Auto-calculate from form"
        />
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Statistics are automatically calculated from the form data below. 
        You can also manually edit these values.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Home Team Stats */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {match.home_team || "Home Team"} Form Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Form Rating"
                  type="number"
                  value={match.home_team_form.form_rating}
                  onChange={(e) => updateField('home_team_form.form_rating', e.target.value)}
                  inputProps={{ step: "0.1", min: "0", max: "10" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Momentum"
                  type="number"
                  value={match.home_team_form.form_momentum}
                  onChange={(e) => updateField('home_team_form.form_momentum', e.target.value)}
                  inputProps={{ step: "0.01", min: "-1", max: "1" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Wins"
                  type="number"
                  value={match.home_team_form.wins}
                  onChange={(e) => updateField('home_team_form.wins', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Draws"
                  type="number"
                  value={match.home_team_form.draws}
                  onChange={(e) => updateField('home_team_form.draws', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Losses"
                  type="number"
                  value={match.home_team_form.losses}
                  onChange={(e) => updateField('home_team_form.losses', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Goals Scored"
                  type="number"
                  value={match.home_team_form.avg_goals_scored}
                  onChange={(e) => updateField('home_team_form.avg_goals_scored', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Goals Conceded"
                  type="number"
                  value={match.home_team_form.avg_goals_conceded}
                  onChange={(e) => updateField('home_team_form.avg_goals_conceded', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
            </Grid>
            {match.home_team_form.form_string && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Form String: <Chip label={match.home_team_form.form_string} size="small" />
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Away Team Stats */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {match.away_team || "Away Team"} Form Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Form Rating"
                  type="number"
                  value={match.away_team_form.form_rating}
                  onChange={(e) => updateField('away_team_form.form_rating', e.target.value)}
                  inputProps={{ step: "0.1", min: "0", max: "10" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Momentum"
                  type="number"
                  value={match.away_team_form.form_momentum}
                  onChange={(e) => updateField('away_team_form.form_momentum', e.target.value)}
                  inputProps={{ step: "0.01", min: "-1", max: "1" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Wins"
                  type="number"
                  value={match.away_team_form.wins}
                  onChange={(e) => updateField('away_team_form.wins', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Draws"
                  type="number"
                  value={match.away_team_form.draws}
                  onChange={(e) => updateField('away_team_form.draws', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Losses"
                  type="number"
                  value={match.away_team_form.losses}
                  onChange={(e) => updateField('away_team_form.losses', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Goals Scored"
                  type="number"
                  value={match.away_team_form.avg_goals_scored}
                  onChange={(e) => updateField('away_team_form.avg_goals_scored', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Goals Conceded"
                  type="number"
                  value={match.away_team_form.avg_goals_conceded}
                  onChange={(e) => updateField('away_team_form.avg_goals_conceded', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
            </Grid>
            {match.away_team_form.form_string && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Form String: <Chip label={match.away_team_form.form_string} size="small" />
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  ), [match, autoCalculate, updateField]);
  
  const TeamFormsSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "info.main" }}>
        Team Recent Form (Last 10 Matches)
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        Enter the last 10 matches for each team. Format: "Opponent Score Outcome" (e.g., "Liverpool 2-1 W")
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Last10Form
              title={`${match.home_team || "Home Team"} Recent Form`}
              onChange={handleHomeFormChange}
              initialData={match.home_team_form.raw_form}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Last10Form
              title={`${match.away_team || "Away Team"} Recent Form`}
              onChange={handleAwayFormChange}
              initialData={match.away_team_form.raw_form}
            />
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  ), [match.home_team, match.away_team, match.home_team_form.raw_form, match.away_team_form.raw_form, handleHomeFormChange, handleAwayFormChange]);
  
  const HeadToHeadSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "warning.main" }}>
        Head-to-Head Statistics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MemoizedTextField
            label="Head-to-Head Summary"
            value={match.head_to_head_summary}
            onChange={(e) => updateField('head_to_head_summary', e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Historical context, rivalry notes, etc."
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Head-to-Head Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Home Wins"
                  type="number"
                  value={match.head_to_head_stats.home_wins}
                  onChange={(e) => updateField('head_to_head_stats.home_wins', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Away Wins"
                  type="number"
                  value={match.head_to_head_stats.away_wins}
                  onChange={(e) => updateField('head_to_head_stats.away_wins', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  label="Draws"
                  type="number"
                  value={match.head_to_head_stats.draws}
                  onChange={(e) => updateField('head_to_head_stats.draws', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Home Goals"
                  type="number"
                  value={match.head_to_head_stats.avg_home_goals}
                  onChange={(e) => updateField('head_to_head_stats.avg_home_goals', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <MemoizedTextField
                  label="Avg Away Goals"
                  type="number"
                  value={match.head_to_head_stats.avg_away_goals}
                  onChange={(e) => updateField('head_to_head_stats.avg_away_goals', e.target.value)}
                  inputProps={{ step: "0.01" }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  ), [match.head_to_head_summary, match.head_to_head_stats, updateField]);
  
  const OddsSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <OddsInputTable title="Market Odds" onChange={handleOddsChange} />
    </Paper>
  ), [handleOddsChange]);
  
  const AdditionalInfoSection = useMemo(() => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "success.main" }}>
        Additional Match Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            label="Weather Conditions"
            value={match.weather_conditions}
            onChange={(e) => updateField('weather_conditions', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            label="Referee"
            value={match.referee}
            onChange={(e) => updateField('referee', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MemoizedTextField
            select
            label="Match Importance"
            value={match.importance}
            onChange={(e) => updateField('importance', e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="regular">Regular</option>
            <option value="derby">Derby</option>
            <option value="cup_final">Cup Final</option>
            <option value="relegation">Relegation Battle</option>
            <option value="title_decider">Title Decider</option>
          </MemoizedTextField>
        </Grid>
      </Grid>
    </Paper>
  ), [match.weather_conditions, match.referee, match.importance, updateField]);
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {BasicInfoSection}
      {TeamFormsSection}
      {FormStatsSection}
      {HeadToHeadSection}
      {OddsSection}
      {AdditionalInfoSection}
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
          disabled={isSubmitting}
          startIcon={<Delete />}
        >
          Clear Form
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!isFormValid || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            sx={{ minWidth: 150 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Match'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

EnhancedMatchForm.displayName = 'EnhancedMatchForm';

export default EnhancedMatchForm;