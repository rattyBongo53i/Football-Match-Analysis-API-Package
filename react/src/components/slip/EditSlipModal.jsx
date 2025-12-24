import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Stack,
  Alert,
} from "@mui/material";
import {
  Close,
  Add,
  Delete,
  Sports,
  AttachMoney,
  CurrencyExchange,
} from "@mui/icons-material";

// Market type constants mapping to backend codes
const MARKET_TYPES = {
  MATCH_RESULT: "MATCH_RESULT",
  CORRECT_SCORE: "CORRECT_SCORE",
  ASIAN_HANDICAP: "ASIAN_HANDICAP",
  OVER_UNDER: "OVER_UNDER",
  BOTH_TEAMS_TO_SCORE: "BOTH_TEAMS_TO_SCORE",
  DOUBLE_CHANCE: "DOUBLE_CHANCE",
  HALF_TIME_FULL_TIME: "HALF_TIME_FULL_TIME",
  HALF_TIME: "HALF_TIME",
};

// Human-readable market names
const MARKET_DISPLAY_NAMES = {
  [MARKET_TYPES.MATCH_RESULT]: "Match Result (1X2)",
  [MARKET_TYPES.CORRECT_SCORE]: "Correct Score",
  [MARKET_TYPES.ASIAN_HANDICAP]: "Asian Handicap",
  [MARKET_TYPES.OVER_UNDER]: "Over/Under",
  [MARKET_TYPES.BOTH_TEAMS_TO_SCORE]: "Both Teams to Score",
  [MARKET_TYPES.DOUBLE_CHANCE]: "Double Chance",
  [MARKET_TYPES.HALF_TIME_FULL_TIME]: "Half Time/Full Time",
  [MARKET_TYPES.HALF_TIME]: "Half Time Result",
};

// Helper to get outcomes for each market type
const getMarketOutcomes = (marketType, match, selectedMarketData) => {
  if (!marketType || !match) return [];

  const defaultOdds = selectedMarketData?.odds || "0.000";
  const odds = parseFloat(defaultOdds) || 1.85;

  switch (marketType) {
    case MARKET_TYPES.MATCH_RESULT:
      return [
        {
          value: "home",
          label: `Home - ${match.home_team}`,
          odds: odds * 0.95,
        },
        { value: "draw", label: "Draw", odds: odds * 1.1 },
        {
          value: "away",
          label: `Away - ${match.away_team}`,
          odds: odds * 1.05,
        },
      ];

    case MARKET_TYPES.ASIAN_HANDICAP:
      return [
        {
          value: "home_-0.5",
          label: "Home -0.5",
          odds: odds * 0.92,
          handicap: "-0.5",
        },
        {
          value: "away_+0.5",
          label: "Away +0.5",
          odds: odds * 0.93,
          handicap: "+0.5",
        },
        {
          value: "home_-1.0",
          label: "Home -1.0",
          odds: odds * 1.25,
          handicap: "-1.0",
        },
        {
          value: "away_+1.0",
          label: "Away +1.0",
          odds: odds * 1.15,
          handicap: "+1.0",
        },
      ];

    case MARKET_TYPES.OVER_UNDER:
      return [
        {
          value: "over_2.5",
          label: "Over 2.5 Goals",
          odds: odds * 0.89,
          line: "2.5",
        },
        {
          value: "under_2.5",
          label: "Under 2.5 Goals",
          odds: odds * 0.92,
          line: "2.5",
        },
        {
          value: "over_3.5",
          label: "Over 3.5 Goals",
          odds: odds * 1.35,
          line: "3.5",
        },
        {
          value: "under_3.5",
          label: "Under 3.5 Goals",
          odds: odds * 1.15,
          line: "3.5",
        },
      ];

    case MARKET_TYPES.BOTH_TEAMS_TO_SCORE:
      return [
        { value: "yes", label: "Yes", odds: odds * 0.85 },
        { value: "no", label: "No", odds: odds * 1.2 },
      ];

    case MARKET_TYPES.HALF_TIME:
      return [
        { value: "home", label: "Home", odds: odds * 1.5 },
        { value: "draw", label: "Draw", odds: odds * 2.0 },
        { value: "away", label: "Away", odds: odds * 1.8 },
      ];

    case MARKET_TYPES.DOUBLE_CHANCE:
      return [
        { value: "home_draw", label: "Home/Draw", odds: odds * 0.75 },
        { value: "home_away", label: "Home/Away", odds: odds * 0.65 },
        { value: "draw_away", label: "Draw/Away", odds: odds * 0.8 },
      ];

    case MARKET_TYPES.CORRECT_SCORE:
      return [
        { value: "1-0", label: "1-0", odds: odds * 7.5, score: "1-0" },
        { value: "2-0", label: "2-0", odds: odds * 9.0, score: "2-0" },
        { value: "2-1", label: "2-1", odds: odds * 8.5, score: "2-1" },
        { value: "0-0", label: "0-0", odds: odds * 10.0, score: "0-0" },
        { value: "1-1", label: "1-1", odds: odds * 6.5, score: "1-1" },
        { value: "2-2", label: "2-2", odds: odds * 12.0, score: "2-2" },
        { value: "0-1", label: "0-1", odds: odds * 8.0, score: "0-1" },
        { value: "0-2", label: "0-2", odds: odds * 11.0, score: "0-2" },
        { value: "1-2", label: "1-2", odds: odds * 9.5, score: "1-2" },
      ];

    case MARKET_TYPES.HALF_TIME_FULL_TIME:
      return [
        { value: "home_home", label: "Home/Home", odds: odds * 4.5 },
        { value: "home_draw", label: "Home/Draw", odds: odds * 15.0 },
        { value: "home_away", label: "Home/Away", odds: odds * 34.0 },
        { value: "draw_home", label: "Draw/Home", odds: odds * 5.5 },
        { value: "draw_draw", label: "Draw/Draw", odds: odds * 6.5 },
        { value: "draw_away", label: "Draw/Away", odds: odds * 7.5 },
        { value: "away_home", label: "Away/Home", odds: odds * 40.0 },
        { value: "away_draw", label: "Away/Draw", odds: odds * 18.0 },
        { value: "away_away", label: "Away/Away", odds: odds * 5.0 },
      ];

    default:
      return [
        { value: "home", label: "Home", odds: 1.85 },
        { value: "draw", label: "Draw", odds: 3.5 },
        { value: "away", label: "Away", odds: 4.0 },
      ];
  }
};

const EditSlipModal = ({
  open,
  onClose,
  slip,
  onSave,
  availableMatches = [],
}) => {
  const [editedSlip, setEditedSlip] = useState(slip || {});
  const [errors, setErrors] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedOdds, setSelectedOdds] = useState(1.85);

  useEffect(() => {
    if (slip) {
      setEditedSlip(slip);
      setMatches(slip.matches || []);
    }
  }, [slip]);

  // Reset market/selection when match changes
  useEffect(() => {
    if (selectedMatch) {
      setSelectedMarket("");
      setSelectedOutcome("");
      setSelectedOdds(1.85);
    }
  }, [selectedMatch]);

  // Reset selection when market changes
  useEffect(() => {
    setSelectedOutcome("");
    setSelectedOdds(1.85);
  }, [selectedMarket]);

  // Update odds when outcome changes
  useEffect(() => {
    if (selectedMarket && selectedMatch && selectedOutcome) {
      const outcomes = getMarketOutcomes(
        selectedMarket,
        selectedMatch,
        selectedMatch.match_markets?.find(
          (m) => m.market?.code === selectedMarket
        )
      );
      const selectedOutcomeData = outcomes.find(
        (o) => o.value === selectedOutcome
      );
      if (selectedOutcomeData) {
        setSelectedOdds(selectedOutcomeData.odds);
      }
    }
  }, [selectedMarket, selectedMatch, selectedOutcome]);

  const validate = () => {
    const newErrors = {};

    if (!editedSlip.name?.trim()) {
      newErrors.name = "Slip name is required";
    }

    if (!editedSlip.stake || editedSlip.stake <= 0) {
      newErrors.stake = "Valid stake amount is required";
    }

    if (!editedSlip.currency) {
      newErrors.currency = "Currency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setEditedSlip((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddMatch = () => {
    if (selectedMatch && selectedMarket && selectedOutcome) {
      if (!matches.some((match) => match.id === selectedMatch.id)) {
        // Get the selected outcome data for additional metadata
        const outcomes = getMarketOutcomes(
          selectedMarket,
          selectedMatch,
          selectedMatch.match_markets?.find(
            (m) => m.market?.code === selectedMarket
          )
        );
        const selectedOutcomeData = outcomes.find(
          (o) => o.value === selectedOutcome
        );

        // Prepare the match object with all required fields
        const matchToAdd = {
          id: selectedMatch.id,
          home_team: selectedMatch.home_team,
          away_team: selectedMatch.away_team,
          league: selectedMatch.league,
          market: selectedMarket,
          market_name: MARKET_DISPLAY_NAMES[selectedMarket] || selectedMarket,
          outcome: selectedOutcomeData?.label || selectedOutcome,
          odds: selectedOdds,
          // Add metadata for different market types
          ...(selectedOutcomeData?.handicap && {
            handicap: selectedOutcomeData.handicap,
          }),
          ...(selectedOutcomeData?.line && { line: selectedOutcomeData.line }),
          ...(selectedOutcomeData?.score && {
            score: selectedOutcomeData.score,
          }),
        };

        setMatches((prev) => [...prev, matchToAdd]);

        // Reset form
        setSelectedMatch(null);
        setSelectedMarket("");
        setSelectedOutcome("");
        setSelectedOdds(1.85);
      }
    }
  };

  const handleRemoveMatch = (matchId) => {
    setMatches((prev) => prev.filter((match) => match.id !== matchId));
  };

  const handleMatchChange = (matchId, field, value) => {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId ? { ...match, [field]: value } : match
      )
    );
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...editedSlip,
        matches: matches,
      });
      onClose();
    }
  };

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  ];

  // Get available markets from selected match
  const availableMarkets = useMemo(() => {
    if (!selectedMatch?.match_markets) return [];

    return selectedMatch.match_markets
      .filter((market) => market.is_active && market.market?.code)
      .map((market) => ({
        code: market.market.code,
        name: MARKET_DISPLAY_NAMES[market.market.code] || market.market.name,
        odds: market.odds,
        marketData: market.market_data,
      }));
  }, [selectedMatch]);

  // Get outcomes for selected market
  const availableOutcomes = useMemo(() => {
    if (!selectedMarket || !selectedMatch) return [];

    return getMarketOutcomes(
      selectedMarket,
      selectedMatch,
      selectedMatch.match_markets?.find(
        (m) => m.market?.code === selectedMarket
      )
    );
  }, [selectedMarket, selectedMatch]);

  // Filter out matches that are already added to prevent duplicates
  const filteredAvailableMatches = useMemo(() => {
    return availableMatches.filter(
      (match) => !matches.some((m) => m.id === match.id)
    );
  }, [availableMatches, matches]);

  // Create unique option label that includes date or ID to ensure uniqueness
  const getOptionLabel = (option) => {
    if (!option) return "";

    const matchDate = option.match_date
      ? new Date(option.match_date).toLocaleDateString()
      : "";

    const baseLabel = `${option.home_team} vs ${option.away_team} (${option.league})`;

    // If we have a date, include it to make it unique
    if (matchDate) {
      return `${baseLabel} - ${matchDate}`;
    }

    // If no date, include the ID as a last resort
    return `${baseLabel} - ID: ${option.id}`;
  };

  // Get a unique option key
  const getOptionKey = (option) => {
    return `${option.id}-${option.match_date || "no-date"}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Edit Slip</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Basic Information (remains the same) */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600">
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slip Name"
                value={editedSlip.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stake Amount"
                type="number"
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, opacity: 0.5 }} />,
                }}
                value={editedSlip.stake || ""}
                onChange={(e) =>
                  handleFieldChange("stake", parseFloat(e.target.value))
                }
                error={!!errors.stake}
                helperText={errors.stake}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.currency}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={editedSlip.currency || ""}
                  onChange={(e) =>
                    handleFieldChange("currency", e.target.value)
                  }
                  label="Currency"
                  startAdornment={
                    <CurrencyExchange sx={{ mr: 1, opacity: 0.5 }} />
                  }
                >
                  {currencies.map((currency) => (
                    <MenuItem
                      key={currency.code}
                      value={currency.code}
                      sx={{ py: 1.5 }}
                    >
                      {currency.symbol} {currency.name} ({currency.code})
                    </MenuItem>
                  ))}
                </Select>
                {errors.currency && (
                  <Typography variant="caption" color="error">
                    {errors.currency}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Matches Management - UPDATED SECTION */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600">
            Matches ({matches.length})
          </Typography>

          {/* Add Match Section - UPDATED */}
          <Box
            sx={{ mb: 3, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Add New Match
            </Typography>
            <Grid container spacing={2} alignItems="center">
              {/* Match Selection */}
              <Grid item xs={12}>
                <Autocomplete
                  options={filteredAvailableMatches}
                  getOptionLabel={getOptionLabel}
                  value={selectedMatch}
                  onChange={(_, newValue) => setSelectedMatch(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Match" fullWidth />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option?.id === value?.id
                  }
                  // Add a custom render option to ensure unique keys
                  renderOption={(props, option) => (
                    <li {...props} key={getOptionKey(option)}>
                      {getOptionLabel(option)}
                    </li>
                  )}
                />
              </Grid>

              {/* Market Selection */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Market</InputLabel>
                  <Select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    label="Market"
                    disabled={!selectedMatch}
                  >
                    {availableMarkets.map((market) => (
                      <MenuItem key={market.code} value={market.code}>
                        {market.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Outcome Selection */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Selection</InputLabel>
                  <Select
                    value={selectedOutcome}
                    onChange={(e) => setSelectedOutcome(e.target.value)}
                    label="Selection"
                    disabled={!selectedMarket}
                  >
                    {availableOutcomes.map((outcome) => (
                      <MenuItem key={outcome.value} value={outcome.value}>
                        {outcome.label} @ {outcome.odds.toFixed(2)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Odds Display */}
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Odds"
                  type="number"
                  value={selectedOdds.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled={!selectedOutcome}
                />
              </Grid>

              {/* Add Button */}
              <Grid item xs={12} sm={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddMatch}
                  fullWidth
                  disabled={
                    !selectedMatch || !selectedMarket || !selectedOutcome
                  }
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Current Matches List - UPDATED */}
          {matches.length > 0 ? (
            <Stack spacing={2}>
              {matches.map((match) => (
                <Paper key={match.id} variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {match.league}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="primary"
                      >
                        {match.market_name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="body2">
                        <strong>Selection:</strong> {match.outcome}
                      </Typography>
                      {match.handicap && (
                        <Typography variant="caption" color="text.secondary">
                          Handicap: {match.handicap}
                        </Typography>
                      )}
                      {match.line && (
                        <Typography variant="caption" color="text.secondary">
                          Line: {match.line}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="primary"
                      >
                        Odds: {match.odds.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Chip
                        label={match.market}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} md={1}>
                      <IconButton
                        onClick={() => handleRemoveMatch(match.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Alert severity="info" icon={<Sports />}>
              No matches added. Select a match, choose a market and selection
              above.
            </Alert>
          )}
        </Paper>

        {/* Summary (remains the same) */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600">
            Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Matches:
              </Typography>
              <Typography variant="h6">{matches.length}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Combined Odds:
              </Typography>
              <Typography variant="h6" color="primary">
                {matches
                  .reduce((total, match) => total * (match.odds || 1), 1)
                  .toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={matches.length === 0}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSlipModal;
