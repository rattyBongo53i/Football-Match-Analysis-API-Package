import React, { useState, useCallback, useMemo, memo } from "react";
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
} from "@mui/material";
import { HelpOutline, Save } from "@mui/icons-material";
import OddsInputTable from "./OddsInputTable";
import Last10Form from "./Last10Form";

const initialMatchState = {
  home_team: "",
  away_team: "",
  league: "",
  head_to_head_summary: "",
  home_form: [],
  away_form: [],
  odds: {},
};

// Memoized TextField component to prevent unnecessary re-renders
const MemoizedTextField = memo(
  ({
    label,
    value,
    onChange,
    required = false,
    multiline = false,
    rows = 1,
    placeholder = "",
    ...props
  }) => (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      variant="outlined"
      color="primary"
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      {...props}
    />
  )
);

MemoizedTextField.displayName = "MemoizedTextField";

// Debounce utility for form updates
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const MatchForm = memo(({ onSubmit }) => {
  const [match, setMatch] = useState(initialMatchState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize form validation
  const isFormValid = useMemo(() => {
    const homeTeam = match.home_team?.trim() || "";
    const awayTeam = match.away_team?.trim() || "";
    const league = match.league?.trim() || "";

    return homeTeam && awayTeam && league;
  }, [match.home_team, match.away_team, match.league]);

  // Memoize the complete match data for submission
  const matchData = useMemo(
    () => ({
      home_team: match.home_team?.trim() || "",
      away_team: match.away_team?.trim() || "",
      league: match.league?.trim() || "",
      head_to_head_summary: match.head_to_head_summary || "",
      home_form: match.home_form || [],
      away_form: match.away_form || [],
      odds: match.odds || {},
    }),
    [match]
  );

  // Optimized field update with debouncing for text fields
  const updateField = useCallback((field, value) => {
    setMatch((prev) => {
      // Skip update if value hasn't changed
      if (prev[field] === value) return prev;

      return {
        ...prev,
        [field]: value,
      };
    });
  }, []);

  // Create stable event handlers for each field
  const createInputHandler = useCallback(
    (field) => {
      return (e) => updateField(field, e.target.value);
    },
    [updateField]
  );

  // Memoize input handlers to prevent recreation on every render
  const handleHomeTeamChange = useMemo(
    () => createInputHandler("home_team"),
    [createInputHandler]
  );

  const handleAwayTeamChange = useMemo(
    () => createInputHandler("away_team"),
    [createInputHandler]
  );

  const handleLeagueChange = useMemo(
    () => createInputHandler("league"),
    [createInputHandler]
  );

  const handleHeadToHeadChange = useMemo(
    () => createInputHandler("head_to_head_summary"),
    [createInputHandler]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onSubmit(matchData);
        setMatch(initialMatchState);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isFormValid, isSubmitting, matchData, onSubmit]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    setMatch(initialMatchState);
  }, []);

  // Memoize Last10Form handlers to prevent unnecessary re-renders
  const handleHomeFormChange = useCallback(
    (data) => {
      updateField("home_form", data);
    },
    [updateField]
  );

  const handleAwayFormChange = useCallback(
    (data) => {
      updateField("away_form", data);
    },
    [updateField]
  );

  // Memoize odds change handler
  const handleOddsChange = useCallback(
    (odds) => {
      updateField("odds", odds);
    },
    [updateField]
  );

  // Split the form into memoized sections to optimize rendering
  const BasicInfoSection = useMemo(
    () => (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          Basic Match Information
          <Tooltip title="Enter basic details about the match">
            <HelpOutline fontSize="small" color="action" />
          </Tooltip>
        </Typography>

        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <MemoizedTextField
              label="Home Team"
              value={match.home_team}
              onChange={handleHomeTeamChange}
              required
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <MemoizedTextField
              label="Away Team"
              value={match.away_team}
              onChange={handleAwayTeamChange}
              required
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 4 }}>
            <MemoizedTextField
              label="League"
              value={match.league}
              onChange={handleLeagueChange}
              required
            />
          </Grid>
        </Grid>
      </Paper>
    ),
    [
      match.home_team,
      match.away_team,
      match.league,
      handleHomeTeamChange,
      handleAwayTeamChange,
      handleLeagueChange,
    ]
  );

  const HeadToHeadSection = useMemo(
    () => (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "secondary.main" }}>
          Head-to-Head Summary
        </Typography>
        <MemoizedTextField
          label="Head-to-Head Analysis"
          value={match.head_to_head_summary}
          onChange={handleHeadToHeadChange}
          multiline
          rows={3}
          placeholder="Enter historical match analysis..."
        />
      </Paper>
    ),
    [match.head_to_head_summary, handleHeadToHeadChange]
  );

  const Last10MatchesSection = useMemo(
    () => (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Last10Form
              title="Home Team Last 10 Matches"
              onChange={handleHomeFormChange}
            />
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Last10Form
              title="Away Team Last 10 Matches"
              onChange={handleAwayFormChange}
            />
          </Paper>
        </Grid>
      </Grid>
    ),
    [handleHomeFormChange, handleAwayFormChange]
  );

  const OddsSection = useMemo(
    () => (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <OddsInputTable title="Market Odds" onChange={handleOddsChange} />
      </Paper>
    ),
    [handleOddsChange]
  );

  const ActionButtons = useMemo(
    () => (
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset Form
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isFormValid || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Save />
            )
          }
          sx={{
            bgcolor: "primary.main",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            minWidth: 120,
          }}
        >
          {isSubmitting ? "Adding..." : "Add Match"}
        </Button>
      </Box>
    ),
    [isFormValid, isSubmitting, handleReset]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {BasicInfoSection}
      {HeadToHeadSection}
      {Last10MatchesSection}
      {OddsSection}

      <Divider sx={{ my: 3 }} />
      {ActionButtons}
    </Box>
  );
});

MatchForm.displayName = "MatchForm";

export default MatchForm;