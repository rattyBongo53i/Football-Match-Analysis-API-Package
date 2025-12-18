import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  CardContent,
  Collapse,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import Last10Form from "../../components/matches/TeamForm/Last10Form";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";

import { matchService } from '../../services/api/matchService';
import { useBetslip } from '../../contexts/BetslipContext';
import { createMarketFormHandler } from '../../utils/marketFormHandler';
import './MatchEntryForm.css';

// Memoized components (unchanged)
const MemoizedTextField = memo(TextField);
const MemoizedSelect = memo(({ children, ...props }) => (
  <Select {...props}>{children}</Select>
));
const MemoizedMenuItem = memo(MenuItem);
const MemoizedCard = memo(Card);
const MemoizedIconButton = memo(IconButton);

// Initial empty H2H match
const EMPTY_H2H_MATCH = {
  date: '',
  home_team: '',
  away_team: '',
  score: '',
  result: '' // 'H', 'D', 'A'
};

// Head-to-Head Input Component
const HeadToHeadInput = memo(({ 
  matches = [], 
  onChange, 
  disabled = false 
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleAddMatch = () => {
    onChange([...matches, { ...EMPTY_H2H_MATCH }]);
  };

  const handleRemoveMatch = (index) => {
    onChange(matches.filter((_, i) => i !== index));
  };

  const handleMatchChange = (index, field, value) => {
    const updated = [...matches];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate result if score is valid
    if (field === 'score' && value.includes('-')) {
      const [home, away] = value.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(home) && !isNaN(away)) {
        if (home > away) updated[index].result = 'H';
        else if (home < away) updated[index].result = 'A';
        else updated[index].result = 'D';
      }
    }

    onChange(updated);
  };

  return (
    <Box mb={4}>
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon /> Head-to-Head (Last {matches.length} Matches)
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Collapse in={expanded}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Optional: Enter past matches between these two teams (most recent first). Helps ML engine.
        </Alert>

        {matches.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={3}>
            No head-to-head matches added yet
          </Typography>
        )}

        {matches.map((match, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">
                  Match #{matches.length - index} (Most recent first)
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveMatch(index)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={match.date}
                    onChange={(e) => handleMatchChange(index, 'date', e.target.value)}
                    disabled={disabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Home Team"
                    value={match.home_team}
                    onChange={(e) => handleMatchChange(index, 'home_team', e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Away Team"
                    value={match.away_team}
                    onChange={(e) => handleMatchChange(index, 'away_team', e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <MemoizedTextField
                    fullWidth
                    label="Score (e.g. 2-1)"
                    value={match.score}
                    onChange={(e) => handleMatchChange(index, 'score', e.target.value)}
                    placeholder="2-1"
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Chip 
                    label={match.result || '?'} 
                    color={match.result === 'H' ? 'success' : match.result === 'A' ? 'error' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddMatch}
          disabled={disabled || matches.length >= 10}
          sx={{ mt: 1 }}
        >
          Add Past Match {matches.length >= 10 && '(Max 10)'}
        </Button>
      </Collapse>
    </Box>
  );
});

HeadToHeadInput.displayName = 'HeadToHeadInput';

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
  const [headToHeadMatches, setHeadToHeadMatches] = useState([]); // ← New state

  const [savedMatchId, setSavedMatchId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Initialize from initialData
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.markets) setMarkets(initialData.markets);
      if (initialData.home_form?.raw_form) setHomeFormMatches(initialData.home_form.raw_form);
      if (initialData.away_form?.raw_form) setAwayFormMatches(initialData.away_form.raw_form);
      if (initialData.head_to_head_stats?.last_meetings) {
        setHeadToHeadMatches(initialData.head_to_head_stats.last_meetings || []);
      }
    }
  }, [initialData]);

  // ... [all your existing handlers unchanged: handleInputChange, handleMarketChange, addMarket, etc.]

  const normalizeHeadToHeadForBackend = (h2hMatches) => {
    if (!h2hMatches || h2hMatches.length === 0) return null;

    const homeWins = h2hMatches.filter(m => m.result === 'H').length;
    const awayWins = h2hMatches.filter(m => m.result === 'A').length;
    const draws = h2hMatches.filter(m => m.result === 'D').length;

    return {
      home_wins: homeWins,
      away_wins: awayWins,
      draws: draws,
      total_meetings: h2hMatches.length,
      last_meetings: h2hMatches.slice(0, 10).map(m => ({
        date: m.date,
        home_team: m.home_team,
        away_team: m.away_team,
        score: m.score,
        result: m.result,
      })),
    };
  };

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!validateForm()) return null;

      setSubmitting(true);
      setSuccess(false);

      try {
        const normalizedHomeForm = normalizeTeamFormForBackend(homeFormMatches);
        const normalizedAwayForm = normalizeTeamFormForBackend(awayFormMatches);
        const normalizedH2H = normalizeHeadToHeadForBackend(headToHeadMatches);

        const matchData = {
          ...formData,
          home_form: normalizedHomeForm,
          away_form: normalizedAwayForm,
          head_to_head_stats: normalizedH2H, // ← Sent to backend
          markets: marketHandler.prepareMarketsForBackend(markets),
        };

        let savedMatch;
        if (matchId) {
          savedMatch = await matchService.updateMatch(matchId, matchData);
        } else {
          savedMatch = await matchService.createMatch(matchData);
        }

        setSavedMatchId(savedMatch.id || savedMatch.data?.id);

        setSuccess(true);
        showSnackbar(matchId ? "Match updated successfully!" : "Match saved successfully!", "success");

        // Remove redirect — stay on page
        // if (onSuccess) setTimeout(() => onSuccess(), 1500);

        return savedMatch;
      } catch (error) {
        console.error("Error saving match:", error);
        showSnackbar("Failed to save match", "error");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [formData, markets, matchId, marketHandler, validateForm, homeFormMatches, awayFormMatches, headToHeadMatches]
  );

  // ... [handleSaveAndAddToBetslip unchanged]

  const handleGenerateSlips = async (matchId) => {
    setIsGenerating(true);
    try {
      const response = await api.post(`/matches/${matchId}/generate-predictions`);

      if (response.success) {
        showSnackbar("Analysis started! Check back soon for predictions and slips.", "success");
      }
    } catch (error) {
      showSnackbar(error.message || "Failed to start analysis", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        {/* ... [existing sections: Match Info, Team Forms, Markets] */}

        {/* NEW: Head-to-Head Section */}
        <HeadToHeadInput
          matches={headToHeadMatches}
          onChange={setHeadToHeadMatches}
          disabled={submitting}
        />

        {/* Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Button variant="outlined" onClick={() => window.history.back()} disabled={submitting}>
            Cancel
          </Button>

          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : matchId ? "Update Match" : "Save Match"}
            </Button>

            {!matchId && (
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

        {/* Generate Button — stays after save */}
        {savedMatchId && (
          <Box mt={4} textAlign="center">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => handleGenerateSlips(savedMatchId)}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
            >
              {isGenerating ? "Generating..." : "Generate Predictions & Slips"}
            </Button>
          </Box>
        )}

        {/* Optional status */}
        {savedMatchId && match?.analysis_status && (
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Status: 
              {match.analysis_status === 'completed' && '✅ Ready'}
              {match.analysis_status === 'processing' && '⏳ Processing...'}
              {match.analysis_status === 'failed' && '❌ Failed'}
              {(!match.analysis_status || match.analysis_status === 'pending') && '⚪ Not started'}
            </Typography>
          </Box>
        )}
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default memo(MatchEntryForm);