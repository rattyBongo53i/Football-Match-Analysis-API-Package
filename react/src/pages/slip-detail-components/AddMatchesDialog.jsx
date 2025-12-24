import React, { useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import SportsIcon from "@mui/icons-material/Sports";
import { MARKET_DISPLAY_NAMES } from "./marketUtils";

const AddMatchesDialog = ({
  open,
  onClose,
  availableMatches,
  selectedMatches,
  onMatchSelect,
  onMatchFieldChange,
  onAddMatches,
  addingMatches,
  formErrors,
  getMarketOptions,
  getSelectionOptions,
}) => {
  // Memoize expensive calculations
  const availableMatchesCount = useMemo(
    () => availableMatches.length,
    [availableMatches]
  );

  const selectedMatchesCount = useMemo(
    () => selectedMatches.length,
    [selectedMatches]
  );

  // Memoize stable handlers
  const handleClose = useCallback(() => {
    if (!addingMatches) {
      onClose();
    }
  }, [onClose, addingMatches]);

  const handleAddMatches = useCallback(() => {
    if (selectedMatchesCount > 0 && !addingMatches) {
      onAddMatches();
    }
  }, [selectedMatchesCount, addingMatches, onAddMatches]);

  // Memoize the button text to avoid string concatenation on every render
  const addButtonText = useMemo(() => {
    if (addingMatches) return "Adding...";
    if (selectedMatchesCount === 0) return "Add Matches";
    return `Add $${selectedMatchesCount} Match$${selectedMatchesCount !== 1 ? "es" : ""}`;
  }, [addingMatches, selectedMatchesCount]);

  // Memoize match selection check to avoid O(n^2) complexity
  const selectedMatchIds = useMemo(() => {
    const ids = new Set();
    selectedMatches.forEach((match) => ids.add(match.id));
    return ids;
  }, [selectedMatches]);

  // Memoize available matches list rendering
  const availableMatchesList = useMemo(() => {
    return availableMatches.map((match) => {
      const isSelected = selectedMatchIds.has(match.id);
      return (
        <AvailableMatchItem
          key={match.id}
          match={match}
          isSelected={isSelected}
          onMatchSelect={onMatchSelect}
        />
      );
    });
  }, [availableMatches, selectedMatchIds, onMatchSelect]);

  // Memoize selected matches form rendering
  const selectedMatchesForm = useMemo(() => {
    if (selectedMatchesCount === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text-secondary">
            Select matches from the left panel to add them to your slip
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
        <Stack spacing={3}>
          {selectedMatches.map((match, index) => (
            <SelectedMatchForm
              key={`$${match.id}_$${index}`}
              match={match}
              index={index}
              availableMatches={availableMatches}
              formErrors={formErrors}
              onMatchFieldChange={onMatchFieldChange}
              getMarketOptions={getMarketOptions}
              getSelectionOptions={getSelectionOptions}
            />
          ))}
        </Stack>
      </Box>
    );
  }, [
    selectedMatches,
    selectedMatchesCount,
    availableMatches,
    formErrors,
    onMatchFieldChange,
    getMarketOptions,
    getSelectionOptions,
  ]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Matches to Slip</Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={addingMatches}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ overflow: "hidden" }}>
        <Grid container spacing={3}>
          {/* Available Matches Column */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Available Matches ({availableMatchesCount})
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              {availableMatchesCount > 0 ? (
                <Stack spacing={1}>{availableMatchesList}</Stack>
              ) : (
                <EmptyMatchesState />
              )}
            </Box>
          </Grid>

          {/* Selected Matches Form Column */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Selected Matches ({selectedMatchesCount})
            </Typography>
            {selectedMatchesForm}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={handleClose} disabled={addingMatches}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAddMatches}
          disabled={selectedMatchesCount === 0 || addingMatches}
          startIcon={addingMatches ? null : <AddIcon />}
        >
          {addButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Extract AvailableMatchItem as separate component for better memoization
const AvailableMatchItem = React.memo(
  ({ match, isSelected, onMatchSelect }) => {
    const handleClick = useCallback(() => {
      onMatchSelect(match);
    }, [match, onMatchSelect]);

    const matchDate = useMemo(() => {
      return match.match_date
        ? new Date(match.match_date).toLocaleDateString()
        : "Date N/A";
    }, [match.match_date]);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          cursor: "pointer",
          bgcolor: isSelected ? "rgba(123, 31, 162, 0.08)" : "transparent",
          borderColor: isSelected ? "primary.main" : "divider",
          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
        }}
        onClick={handleClick}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {match.home_team} vs {match.away_team}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {match.league} • {matchDate}
        </Typography>

        {match.match_markets && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Available markets: {match.match_markets.length}
            </Typography>
          </Box>
        )}

        {isSelected && (
          <Chip label="Selected" size="small" color="primary" sx={{ mt: 1 }} />
        )}
      </Paper>
    );
  }
);

// Extract SelectedMatchForm as separate component for better memoization
const SelectedMatchForm = React.memo(
  ({
    match,
    index,
    availableMatches,
    formErrors,
    onMatchFieldChange,
    getMarketOptions,
    getSelectionOptions,
  }) => {
    // Memoize handlers to prevent recreation on every render
    const handleMarketChange = useCallback(
      (e) => {
        onMatchFieldChange(index, "market", e.target.value);
      },
      [index, onMatchFieldChange]
    );

    const handleSelectionChange = useCallback(
      (e) => {
        onMatchFieldChange(index, "selection", e.target.value);
      },
      [index, onMatchFieldChange]
    );

    const handleOddsChange = useCallback(
      (e) => {
        onMatchFieldChange(index, "odds", e.target.value);
      },
      [index, onMatchFieldChange]
    );

    // Memoize market options
    const marketOptions = useMemo(() => {
      return getMarketOptions(match.id, availableMatches);
    }, [match.id, availableMatches, getMarketOptions]);

    // Memoize selection options
    const selectionOptions = useMemo(() => {
      return match.market ? getSelectionOptions(match.id, match.market) : [];
    }, [match.id, match.market, getSelectionOptions]);

    // Memoize market display name
    const marketDisplayName = useMemo(() => {
      return MARKET_DISPLAY_NAMES[match.market] || match.market;
    }, [match.market]);

    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {match.home_team} vs {match.away_team}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl
              fullWidth
              size="small"
              error={!!formErrors[`market_${index}`]}
            >
              <InputLabel>Market</InputLabel>
              <Select
                value={match.market}
                label="Market"
                onChange={handleMarketChange}
              >
                {marketOptions.map((marketCode) => {
                  const marketName =
                    MARKET_DISPLAY_NAMES[marketCode] || marketCode;
                  return (
                    <MenuItem key={marketCode} value={marketCode}>
                      {marketName}
                    </MenuItem>
                  );
                })}
              </Select>
              {formErrors[`market_${index}`] && (
                <FormHelperText>{formErrors[`market_${index}`]}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {match.market && (
            <Grid item xs={12}>
              <FormControl
                fullWidth
                size="small"
                error={!!formErrors[`selection_${index}`]}
              >
                <InputLabel>Selection</InputLabel>
                <Select
                  value={match.selection}
                  label="Selection"
                  onChange={handleSelectionChange}
                >
                  {selectionOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors[`selection_${index}`] && (
                  <FormHelperText>
                    {formErrors[`selection_${index}`]}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Odds"
              type="number"
              value={match.odds}
              onChange={handleOddsChange}
              error={!!formErrors[`odds_${index}`]}
              helperText={formErrors[`odds_${index}`]}
              InputProps={{
                inputProps: {
                  min: 1.01,
                  step: 0.01,
                  style: {
                    fontWeight: match.odds ? 600 : "normal",
                    color: match.odds ? "primary.main" : "inherit",
                  },
                },
              }}
            />
          </Grid>

          {match.market && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Market: {marketDisplayName}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  }
);

// Extract EmptyMatchesState as separate component
const EmptyMatchesState = React.memo(() => (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <SportsIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.3 }} />
    <Typography color="text.secondary">No matches available</Typography>
  </Box>
));

export default React.memo(AddMatchesDialog);
