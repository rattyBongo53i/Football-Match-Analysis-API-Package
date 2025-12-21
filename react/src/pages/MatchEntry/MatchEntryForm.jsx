import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Collapse,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Zoom,
  Container,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Casino as CasinoIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import Last10Form from "../../components/matches/TeamForm/Last10Form";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import { createMarketFormHandler } from "../../utils/marketFormHandler";

// Import extracted components and utilities
import {
  INITIAL_FORM_DATA,
  WEATHER_OPTIONS,
  leagueOptions,
  venueOptions,
  steps,
} from "./constants";
import {
  GradientContainer,
  StyledPaper,
  GradientButton,
  StyledStepper,
  Header,
} from "./styledComponents";
import HeadToHeadInput from "./HeadToHeadInput";
import  MarketItem  from "./MarketItem";
import CustomStepIcon from "./CustomStepIcon";
import {
  MemoizedTextField,
  MemoizedSelect,
  MemoizedMenuItem,
} from "./MemoizedComponents";
import {
  getMarketType,
  normalizeHeadToHead,
  prepareMarketsForBackend,
} from "./matchEntryUtils";

// -------------------- MAIN FORM COMPONENT --------------------
const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();
  const navigate = useNavigate();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [markets, setMarkets] = useState(() => [
    {
      id: 1,
      name: "1X2",
      required: true,
      home_odds: "",
      draw_odds: "",
      away_odds: "",
    },
    { id: 2, name: "Correct Score", required: false, outcomes: [] },
    { id: 3, name: "Asian Handicap", required: false, outcomes: [] },
    { id: 4, name: "Both Teams to Score", required: false, outcomes: [] },
    { id: 5, name: "Over/Under", required: false, outcomes: [] },
    { id: 6, name: "Halftime", required: false, outcomes: [] },
    { id: 7, name: "Corners", required: false, outcomes: [] },
    { id: 8, name: "Player Markets", required: false, outcomes: [] },
    { id: 9, name: "Double Chance", required: false, odds: "" },
    { id: 10, name: "Draw No Bet", required: false, odds: "" },
    { id: 11, name: "Half Time/Full Time", required: false, odds: "" },
    { id: 12, name: "Total Goals", required: false, odds: "" },
  ]);

  const [marketErrors, setMarketErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [homeFormMatches, setHomeFormMatches] = useState([]);
  const [awayFormMatches, setAwayFormMatches] = useState([]);
  const [headToHeadMatches, setHeadToHeadMatches] = useState([]);
  const [savedMatchId, setSavedMatchId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Initialize from initialData
  useEffect(() => {
    if (!initialData) return;
    setFormData(initialData);
    if (initialData.markets) setMarkets(initialData.markets);
    if (initialData.home_form?.raw_form)
      setHomeFormMatches(initialData.home_form.raw_form);
    if (initialData.away_form?.raw_form)
      setAwayFormMatches(initialData.away_form.raw_form);
    if (initialData.head_to_head_stats?.last_meetings)
      setHeadToHeadMatches(initialData.head_to_head_stats.last_meetings);
  }, [initialData]);

  // Handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  }, []);

  const handleMarketChange = useCallback((index, updatedMarket) => {
    setMarkets((prev) => {
      const updated = [...prev];
      updated[index] = updatedMarket;
      return updated;
    });
  }, []);

  const removeMarket = useCallback((index) => {
    setMarkets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addMarket = useCallback(() => {
    setMarkets((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "Custom Market",
        required: false,
        odds: "",
        market_type: "custom",
      },
    ]);
  }, []);

  const validateMarkets = () => {
    const errors = {};
    const oneXTwoMarket = markets.find((m) => m.name === "1X2");

    if (oneXTwoMarket) {
      if (
        !oneXTwoMarket.home_odds ||
        parseFloat(oneXTwoMarket.home_odds) < 1.01
      ) {
        errors.home_odds = "Home odds must be at least 1.01";
      }
      if (
        !oneXTwoMarket.draw_odds ||
        parseFloat(oneXTwoMarket.draw_odds) < 1.01
      ) {
        errors.draw_odds = "Draw odds must be at least 1.01";
      }
      if (
        !oneXTwoMarket.away_odds ||
        parseFloat(oneXTwoMarket.away_odds) < 1.01
      ) {
        errors.away_odds = "Away odds must be at least 1.01";
      }
    }

    setMarketErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateMarkets()) {
      showSnackbar("Please fix market errors before submitting", "error");
      return;
    }

    setSubmitting(true);
    try {
      const matchData = {
        ...formData,
        home_form: normalizeTeamFormForBackend(homeFormMatches),
        away_form: normalizeTeamFormForBackend(awayFormMatches),
        head_to_head_stats: normalizeHeadToHead(headToHeadMatches),
        markets: prepareMarketsForBackend(
          markets,
          marketHandler,
          getMarketType
        ),
      };

      const saved = matchId
        ? await matchService.updateMatch(matchId, matchData)
        : await matchService.createMatch(matchData);

      setSavedMatchId(saved.id || saved.data?.id);
      showSnackbar(matchId ? "Match updated" : "Match saved");

      // if (onSuccess) onSuccess(saved);

      return saved;
    } catch (err) {
      console.error("Submission error:", err);
      showSnackbar("Failed to save match", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSlips = async (matchId) => {
    setIsGenerating(true);
    try {
      const response = await matchService.generatePredictions(matchId);

      if (response.success) {
        showSnackbar(
          "Analysis started! Check back in a few seconds for predictions and betting slips.",
          "success"
        );
        // Navigate to results page so the user can see status + results as they arrive
        navigate(`/matches/${matchId}/results`);
      } else {
        throw new Error(response.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to generate predictions:", error);
      showSnackbar(error.message || "Failed to start analysis", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Match Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <MemoizedTextField
                select
                label="League *"
                value={formData.league}
                onChange={(e) => handleInputChange("league", e.target.value)}
                required
                fullWidth
                SelectProps={{ native: true }}
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
                onChange={(e) =>
                  handleInputChange("match_date", e.target.value)
                }
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <MemoizedTextField
                fullWidth
                label="Match Time"
                type="time"
                value={formData.match_time}
                onChange={(e) =>
                  handleInputChange("match_time", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <MemoizedTextField
                select
                label="Venue"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value=""></option>
                {venueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </MemoizedTextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <MemoizedTextField
                fullWidth
                label="Home Team *"
                value={formData.home_team}
                onChange={(e) => handleInputChange("home_team", e.target.value)}
                required
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={2}
              align="center"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Typography>VS</Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <MemoizedTextField
                fullWidth
                label="Away Team *"
                value={formData.away_team}
                onChange={(e) => handleInputChange("away_team", e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <MemoizedTextField
                fullWidth
                label="Referee"
                value={formData.referee}
                onChange={(e) => handleInputChange("referee", e.target.value)}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Weather</InputLabel>
                <MemoizedSelect
                  value={formData.weather}
                  onChange={(e) => handleInputChange("weather", e.target.value)}
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
        );

      case 1: // Team Forms
        return (
          <>
            <Last10Form
              teamName="Home Team"
              value={homeFormMatches}
              onChange={setHomeFormMatches}
            />
            <Divider sx={{ my: 3 }} />
            <Last10Form
              teamName="Away Team"
              value={awayFormMatches}
              onChange={setAwayFormMatches}
            />
          </>
        );

      case 2: // Head-to-Head
        return (
          <HeadToHeadInput
            matches={headToHeadMatches}
            onChange={setHeadToHeadMatches}
            disabled={submitting}
          />
        );

      case 3: // Markets
        return (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
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

            {Object.keys(marketErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Please fix market errors before submitting
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

      case 4: // Review
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Match Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  Home Team: {formData.home_team}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  Away Team: {formData.away_team}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  League: {formData.league}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  Date: {formData.match_date} at {formData.match_time}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Team Forms:
                </Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • Home Team: {homeFormMatches.length} matches
                </Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • Away Team: {awayFormMatches.length} matches
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Head-to-Head:
                </Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • {headToHeadMatches.length} historical meetings
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Markets:
                </Typography>
                {markets
                  .filter((m) => {
                    if (m.name === "1X2")
                      return m.home_odds || m.draw_odds || m.away_odds;
                    if (m.outcomes) return m.outcomes.some((o) => o.odds);
                    return m.odds;
                  })
                  .map((market, idx) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                      • {market.name}:{" "}
                      {market.name === "1X2"
                        ? `H: ${market.home_odds || "-"} | D: ${market.draw_odds || "-"} | A: ${market.away_odds || "-"}`
                        : market.odds || "Multiple outcomes"}
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
    <GradientContainer maxWidth="xl">
      <Zoom in={true} timeout={800}>
        <StyledPaper elevation={0}>
          <Header>
            <Box display="flex" alignItems="center">
              <SoccerIcon
                sx={{
                  mr: 2,
                  fontSize: 40,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
              <Box>
                <Typography
                  variant="h3"
                  fontWeight="800"
                  sx={{
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    color: "white",
                  }}
                >
                  Match Entry Form
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ opacity: 0.9, color: "white" }}
                >
                  Create professional football match data with advanced
                  analytics
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                icon={<TimelineIcon />}
                label="Analytics Ready"
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<CasinoIcon />}
                label="AI Powered"
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Header>

          <StyledStepper
            activeStep={activeStep}
            sx={{ mb: 6, mt: 4 }}
            alternativeLabel
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel StepIconComponent={CustomStepIcon}>
                  <Typography variant="body1" fontWeight="500">
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </StyledStepper>

          <Fade in={true} timeout={1000}>
            <Box sx={{ mt: 4 }}>
              <form onSubmit={handleSubmit}>
                {renderStepContent(activeStep)}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 6,
                    pt: 3,
                    borderTop: "1px solid rgba(156, 39, 176, 0.1)",
                  }}
                >
                  <GradientButton
                    variant="outlined"
                    disabled={activeStep === 0 || submitting}
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                  >
                    Previous
                  </GradientButton>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    {activeStep === steps.length - 1 ? (
                      <>
                        <GradientButton
                          variant="contained"
                          type="submit"
                          disabled={submitting}
                          startIcon={
                            submitting ? (
                              <CircularProgress size={20} />
                            ) : (
                              <SaveIcon />
                            )
                          }
                        >
                          {submitting ? "Saving..." : "Save Match"}
                        </GradientButton>
                        {savedMatchId && (
                          <GradientButton
                            variant="contained"
                            sx={{
                              background:
                                "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #f57c00 30%, #ffa726 90%)",
                              },
                            }}
                            onClick={() => handleGenerateSlips(savedMatchId)}
                            startIcon={
                              isGenerating ? (
                                <CircularProgress size={20} />
                              ) : (
                                <AutoAwesomeIcon />
                              )
                            }
                            disabled={isGenerating}
                          >
                            {isGenerating
                              ? "Generating..."
                              : "Generate AI Predictions"}
                          </GradientButton>
                        )}
                      </>
                    ) : (
                      <GradientButton
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Continue
                      </GradientButton>
                    )}
                  </Box>
                </Box>
              </form>
            </Box>
          </Fade>
        </StyledPaper>
      </Zoom>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          }}
        >
          <Typography fontWeight="600">{snackbar.message}</Typography>
        </Alert>
      </Snackbar>
    </GradientContainer>
  );
};

export default memo(MatchEntryForm);
