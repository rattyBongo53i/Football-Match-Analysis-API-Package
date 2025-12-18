// src/components/matches/MatchEntryForm.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
// react\src\services\normalization\marketNormalizer.js
import { matchService } from '../../../services/api/matchService';
import { useBetslip } from '../../../contexts/BetslipContext';
import { createMarketFormHandler } from '../../../utils/marketFormHandler';
import { normalizeTeamFormForBackend } from '../../../hooks/useTeamFormCalculator';

import HeadToHeadInput from './HeadToHeadInput';
import MarketsSection from './MarketsSection';
import TeamFormsSection from './TeamFormsSection';

import './MatchEntryForm.css';

const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();

  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    league: '',
    match_date: new Date().toISOString().split('T')[0],
    match_time: '21:00',
    venue: 'Home',
    referee: '',
    weather_conditions: 'Clear',
    status: 'scheduled'
  });

  const [markets, setMarkets] = useState(() => marketHandler.getDefaultMarkets());
  const [homeFormMatches, setHomeFormMatches] = useState([]);
  const [awayFormMatches, setAwayFormMatches] = useState([]);
  const [headToHeadMatches, setHeadToHeadMatches] = useState([]);

  const [errors, setErrors] = useState({});
  const [marketErrors, setMarketErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedMatchId, setSavedMatchId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.markets) setMarkets(initialData.markets);
      if (initialData.home_form?.raw_form) setHomeFormMatches(initialData.home_form.raw_form);
      if (initialData.away_form?.raw_form) setAwayFormMatches(initialData.away_form.raw_form);
      if (initialData.head_to_head_stats?.last_meetings) setHeadToHeadMatches(initialData.head_to_head_stats.last_meetings);
    }
  }, [initialData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.home_team.trim()) newErrors.home_team = 'Required';
    if (!formData.away_team.trim()) newErrors.away_team = 'Required';
    if (formData.home_team === formData.away_team) newErrors.away_team = 'Teams must be different';
    if (!formData.league.trim()) newErrors.league = 'Required';
    if (!formData.match_date) newErrors.match_date = 'Required';

    const { isValid, errors: mErrors } = marketHandler.validateMarkets(markets);
    if (!isValid) setMarketErrors(mErrors);
    else setMarketErrors({});

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        home_form: normalizeTeamFormForBackend(homeFormMatches),
        away_form: normalizeTeamFormForBackend(awayFormMatches),
        head_to_head_stats: headToHeadMatches.length ? {
          home_wins: headToHeadMatches.filter(m => m.result === 'H').length,
          away_wins: headToHeadMatches.filter(m => m.result === 'A').length,
          draws: headToHeadMatches.filter(m => m.result === 'D').length,
          total_meetings: headToHeadMatches.length,
          last_meetings: headToHeadMatches.slice(0, 10)
        } : null,
        markets: marketHandler.prepareMarketsForBackend(markets)
      };

      const saved = matchId
        ? await matchService.updateMatch(matchId, data)
        : await matchService.createMatch(data);

      setSavedMatchId(saved.id);
      showSnackbar(matchId ? 'Match updated!' : 'Match saved!', 'success');
    } catch (error) {
      showSnackbar('Failed to save match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSlips = async () => {
    setIsGenerating(true);
    try {
      const res = await matchService.generatePredictions(savedMatchId);
      showSnackbar('Predictions & slips started! Check soon.', 'success');
    } catch (error) {
      showSnackbar('Failed to generate', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        {/* Match Info */}
        <Typography variant="h5" gutterBottom>Match Details</Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}><TextField fullWidth label="Home Team *" value={formData.home_team} onChange={e => setFormData({ ...formData, home_team: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Away Team *" value={formData.away_team} onChange={e => setFormData({ ...formData, away_team: e.target.value })} required /></Grid>
          {/* ... other fields like league, date, etc. */}
        </Grid>

        <TeamFormsSection
          homeFormMatches={homeFormMatches}
          setHomeFormMatches={setHomeFormMatches}
          awayFormMatches={awayFormMatches}
          setAwayFormMatches={setAwayFormMatches}
          submitting={submitting}
        />

        <HeadToHeadInput
          matches={headToHeadMatches}
          onChange={setHeadToHeadMatches}
          disabled={submitting}
        />

        <MarketsSection
          markets={markets}
          onMarketChange={(i, m) => {
            const newMarkets = [...markets];
            newMarkets[i] = m;
            setMarkets(newMarkets);
          }}
          onAddMarket={() => marketHandler.addMarket(setMarkets)}
          onRemoveMarket={i => marketHandler.removeMarket(i, setMarkets)}
          marketErrors={marketErrors}
          submitting={submitting}
        />

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button variant="outlined" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : matchId ? 'Update' : 'Save Match'}
          </Button>
        </Box>

        {savedMatchId && (
          <Box mt={4} textAlign="center">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={handleGenerateSlips}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate Predictions & Slips'}
            </Button>
          </Box>
        )}
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default memo(MatchEntryForm);