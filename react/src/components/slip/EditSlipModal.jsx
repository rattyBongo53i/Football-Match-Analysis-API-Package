import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (slip) {
      setEditedSlip(slip);
      setMatches(slip.matches || []);
    }
  }, [slip]);

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
    if (selectedMatch) {
      if (!matches.some((match) => match.id === selectedMatch.id)) {
        setMatches((prev) => [
          ...prev,
          { ...selectedMatch, outcome: "1X2: Home", odds: 1.85 },
        ]);
        setSelectedMatch(null);
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

  const marketTypes = [
    "1X2",
    "Asian Handicap",
    "Over/Under",
    "Both Teams to Score",
    "Double Chance",
    "Correct Score",
    "Half Time/Full Time",
  ];

  const outcomesByMarket = {
    "1X2": ["Home", "Draw", "Away"],
    "Asian Handicap": ["Home -0.5", "Away +0.5", "Home -1.0", "Away +1.0"],
    "Over/Under": ["Over 2.5", "Under 2.5", "Over 3.5", "Under 3.5"],
    "Both Teams to Score": ["Yes", "No"],
    "Double Chance": ["Home/Draw", "Home/Away", "Draw/Away"],
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
        {/* Basic Information */}
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
                      sx={{ py: 1.5 }} // Increases vertical spacing for better touch/click targets
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

        {/* Matches Management */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="600">
            Matches ({matches.length})
          </Typography>

          {/* Add Match Section */}
          <Box
            sx={{ mb: 3, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Add New Match
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Autocomplete
                  sx={{ width: 300 }}
                  options={availableMatches}
                  getOptionLabel={(option) =>
                    `${option.home_team} vs ${option.away_team} (${option.league})`
                  }
                  value={selectedMatch}
                  onChange={(_, newValue) => setSelectedMatch(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Match" size="small" />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddMatch}
                  fullWidth
                  disabled={!selectedMatch}
                >
                  Add Match
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Current Matches List */}
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
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Market</InputLabel>
                        <Select
                          value={match.market_name || "1X2"}
                          onChange={(e) =>
                            handleMatchChange(
                              match.id,
                              "market_name",
                              e.target.value
                            )
                          }
                          label="Market"
                        >
                          {marketTypes.map((market) => (
                            <MenuItem key={market} value={market}>
                              {market}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Outcome</InputLabel>
                        <Select
                          value={match.outcome || "Home"}
                          onChange={(e) =>
                            handleMatchChange(
                              match.id,
                              "outcome",
                              e.target.value
                            )
                          }
                          label="Outcome"
                        >
                          {(
                            outcomesByMarket[match.market_name] ||
                            outcomesByMarket["1X2"]
                          ).map((outcome) => (
                            <MenuItem key={outcome} value={outcome}>
                              {outcome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={1}>
                      <TextField
                        size="small"
                        label="Odds"
                        type="number"
                        value={match.odds || 1.85}
                        onChange={(e) =>
                          handleMatchChange(
                            match.id,
                            "odds",
                            parseFloat(e.target.value)
                          )
                        }
                        inputProps={{ step: 0.05, min: 1.0 }}
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
              No matches added. Use the form above to add matches to this slip.
            </Alert>
          )}
        </Paper>

        {/* Summary */}
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
