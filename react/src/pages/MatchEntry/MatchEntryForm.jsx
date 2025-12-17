import React, { useState,  useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Card,
  Snackbar,
  CardContent
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, SportsSoccer as SoccerIcon, FourGMobiledataOutlined } from '@mui/icons-material';

import Last10Form from "../../components/matches/TeamForm/Last10Form";
import TeamFormStats from "../../components/matches/TeamForm/TeamFormStats";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";

import { matchService } from '../../services/api/matchService';
import { useBetslip } from '../../contexts/BetslipContext';
import { createMarketFormHandler } from '../../utils/marketFormHandler';
// import TeamFormInput from '../../components/matches/TeamFormInput';
import './MatchEntryForm.css';

// Memoized components
const MemoizedTextField = memo(TextField);
const MemoizedSelect = memo(({ children, ...props }) => (
  <Select {...props}>{children}</Select>
));
const MemoizedMenuItem = memo(MenuItem);
const MemoizedCard = memo(Card);
const MemoizedIconButton = memo(IconButton);

// Initial form data
const INITIAL_FORM_DATA = {
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
  home_form: { last_5: ['', '', '', '', ''] },
  away_form: { last_5: ['', '', '', '', ''] },
  head_to_head: { home_wins: 0, away_wins: 0, draws: 0 },
  notes: ''
};

const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rainy', 'Snow', 'Windy'];

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

const venueOptions = ["Home", "Away", "Neutral"];

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
  
  const handleOddsChange = useCallback((field, value) => {
    const updated = { ...market };
    if (field === 'odds') {
      updated.odds = parseFloat(value) || 0;
    } else {
      updated[field] = parseFloat(value) || 0;
    }
    onMarketChange(index, updated);
  }, [market, index, onMarketChange]);

  return (
    <Grid item xs={12} md={6}>
      <MemoizedCard variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
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
          ) : (
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

const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [markets, setMarkets] = useState(() =>
    marketHandler.getDefaultMarkets()
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [marketErrors, setMarketErrors] = useState({});
  const [homeFormMatches, setHomeFormMatches] = useState([]);
  const [awayFormMatches, setAwayFormMatches] = useState([]);
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: "",
      severity: "success",
    });

  const formStatus = useMemo(
    () => ({
      isUpdate: Boolean(matchId),
      hasErrors: Object.keys(errors).length > 0,
    }),
    [matchId, errors]
  );

    const showSnackbar = useCallback((message, severity = "success") => {
      setSnackbar({ open: true, message, severity });
    }, []);
  
    const handleCloseSnackbar = useCallback(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);
  
  // useEffect(() => {
  //   if (initialData) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       ...initialData,
  //     }));

  //     if (initialData.markets) {
  //       setMarkets(initialData.markets);
  //     }
  //   }
  // }, [initialData]);

  // Add useEffect to initialize form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.markets) {
        setMarkets(initialData.markets);
      }

      // Initialize team form matches
      if (initialData.home_form?.raw_form) {
        setHomeFormMatches(initialData.home_form.raw_form);
      }
      if (initialData.away_form?.raw_form) {
        setAwayFormMatches(initialData.away_form.raw_form);
      }
    }
  }, [initialData]);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        if (prev[field] === value) return prev;
        return { ...prev, [field]: value };
      });

      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );


  const handleMarketChange = useCallback((index, updatedMarket) => {
    setMarkets((prev) => {
      const currentMarket = prev[index];
      if (JSON.stringify(currentMarket) === JSON.stringify(updatedMarket)) {
        return prev;
      }

      const newMarkets = [...prev];
      newMarkets[index] = updatedMarket;
      return newMarkets;
    });
  }, []);

  const addMarket = useCallback(() => {
    setMarkets((prev) => [
      ...prev,
      {
        id: `market_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        name: "Double Chance",
        market_type: "double_chance",
        odds: 0,
        required: false,
      },
    ]);
  }, []);

  const removeMarket = useCallback(
    (index) => {
      if (!markets[index]?.required) {
        setMarkets((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [markets]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.home_team.trim())
      newErrors.home_team = "Home team is required";
    if (!formData.away_team.trim())
      newErrors.away_team = "Away team is required";
    if (formData.home_team === formData.away_team)
      newErrors.away_team = "Teams must be different";
    if (!formData.league.trim()) newErrors.league = "League is required";
    if (!formData.match_date) newErrors.match_date = "Match date is required";

    const { isValid: marketsValid, errors: marketValidationErrors } =
      marketHandler.validateMarkets(markets);

    if (!marketsValid) {
      setMarketErrors(marketValidationErrors);
    } else {
      setMarketErrors({});
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && marketsValid;
  }, [formData, markets, marketHandler]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!validateForm()) {
        return null;
      }

      setSubmitting(true);
      setSuccess(false);

    try {
      // Normalize team forms for backend
      const normalizedHomeForm = normalizeTeamFormForBackend(homeFormMatches);
      const normalizedAwayForm = normalizeTeamFormForBackend(awayFormMatches);

      const matchData = {
        ...formData,
        home_form: normalizedHomeForm,
        away_form: normalizedAwayForm,
        markets: marketHandler.prepareMarketsForBackend(markets),
      };

      let savedMatch;
      if (matchId) {
        savedMatch = await matchService.updateMatch(matchId, matchData);
      } else {
        savedMatch = await matchService.createMatch(matchData);
      }

      setSuccess(true);
      setSnackbar({
        open: true,
        message: matchId
          ? "Match updated successfully!"
          : "Match saved successfully!",
        severity: "success",
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }

      return savedMatch;
    } catch (error) {
      console.error("Error saving match:", error);
      showSnackbar("Failed to send matches to backend", "error");
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to save match. Please try again.",
      }));
      return null;
    } finally {
      setSubmitting(false);
    }
    },
    [formData, markets, matchId, marketHandler, validateForm, onSuccess]
  );

  const handleSaveAndAddToBetslip = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        const savedMatch = await handleSubmit();
        if (savedMatch) {
          await addMatchToBetslip(savedMatch);
          setSuccess(true);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, handleSubmit, addMatchToBetslip]
  );

  // Input handlers
  const handleHomeTeamChange = useCallback(
    (e) => handleInputChange("home_team", e.target.value),
    [handleInputChange]
  );

  const handleAwayTeamChange = useCallback(
    (e) => handleInputChange("away_team", e.target.value),
    [handleInputChange]
  );

  const handleLeagueChange = useCallback(
    (e) => handleInputChange("league", e.target.value),
    [handleInputChange]
  );

  const handleMatchDateChange = useCallback(
    (e) => handleInputChange("match_date", e.target.value),
    [handleInputChange]
  );

  const handleMatchTimeChange = useCallback(
    (e) => handleInputChange("match_time", e.target.value),
    [handleInputChange]
  );

  const handleVenueChange = useCallback(
    (e) => handleInputChange("venue", e.target.value),
    [handleInputChange]
  );

  const handleRefereeChange = useCallback(
    (e) => handleInputChange("referee", e.target.value),
    [handleInputChange]
  );

  const handleWeatherChange = useCallback(
    (e) => handleInputChange("weather", e.target.value),
    [handleInputChange]
  );

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Match saved successfully!
          </Alert>
        )}

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        {/* Match Information Section */}
        <Box mb={4}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <SoccerIcon /> Match Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <MemoizedTextField
                fullWidth
                label="Home Team *"
                value={formData.home_team}
                onChange={handleHomeTeamChange}
                error={!!errors.home_team}
                helperText={errors.home_team}
                disabled={submitting}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={2}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" color="text.secondary">
                VS
              </Typography>
            </Grid>

            <Grid item xs={12} md={5}>
              <MemoizedTextField
                fullWidth
                label="Away Team *"
                value={formData.away_team}
                onChange={handleAwayTeamChange}
                error={!!errors.away_team}
                helperText={errors.away_team}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <MemoizedTextField
                select
                label="League *"
                value={formData.league}
                onChange={ handleLeagueChange}
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

            <Grid item xs={12} md={3}>
              <MemoizedTextField
                fullWidth
                label="Match Date *"
                type="date"
                value={formData.match_date}
                onChange={handleMatchDateChange}
                error={!!errors.match_date}
                helperText={errors.match_date}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <MemoizedTextField
                fullWidth
                label="Match Time"
                type="time"
                value={formData.match_time}
                onChange={handleMatchTimeChange}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <MemoizedTextField
                select
                label="Venue"
                value={FourGMobiledataOutlined.venue}
                
                onChange={handleVenueChange}
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

            <Grid item xs={12} md={4}>
              <MemoizedTextField
                fullWidth
                label="Referee"
                value={formData.referee}
                onChange={handleRefereeChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Weather</InputLabel>
                <MemoizedSelect
                  value={formData.weather}
                  onChange={handleWeatherChange}
                  label="Weather"
                  disabled={submitting}
                >
                  {WEATHER_OPTIONS.map((option) => (
                    <MemoizedMenuItem key={option} value={option}>
                      {option}
                    </MemoizedMenuItem>
                  ))}
                </MemoizedSelect>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Team Forms - NEW IMPLEMENTATION */}
        <Box mb={4}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <AddIcon /> Team Forms (Last 10 Matches)
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box mb={4}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Enter each team's last 10 matches from most recent to oldest.
                The system will automatically calculate form statistics for ML
                analysis.
              </Typography>
            </Alert>
          </Box>

          {/* Home Team Form */}
          <Box mb={4}>
            <Last10Form
              teamName="Home Team"
              color="primary"
              value={homeFormMatches}
              onChange={setHomeFormMatches}
              disabled={submitting}
            />
          </Box>

          {/* Away Team Form */}
          <Box mb={4}>
            <Last10Form
              teamName="Away Team"
              color="error"
              value={awayFormMatches}
              onChange={setAwayFormMatches}
              disabled={submitting}
            />
          </Box>
        </Box>

        {/* Market Odds Section */}
        <Box mb={4}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <AddIcon /> Market Odds *
          </Typography>
          <Divider sx={{ mb: 3 }} />

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

          <Button
            startIcon={<AddIcon />}
            onClick={addMarket}
            sx={{ mt: 2 }}
            disabled={submitting}
          >
            Add Another Market
          </Button>
        </Box>

        {/* Actions Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting
                ? "Saving..."
                : formStatus.isUpdate
                  ? "Update Match"
                  : "Save Match"}
            </Button>

            {!formStatus.isUpdate && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSaveAndAddToBetslip}
                disabled={submitting}
              >
                Save & Add to Betslip
              </Button>
            )}
          </Box>
        </Box>
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};;

export default memo(MatchEntryForm);