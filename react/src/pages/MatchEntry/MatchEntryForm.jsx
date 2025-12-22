import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Step,
  StepLabel,
  Fade,
  Zoom,
  Chip,
  InputAdornment,
  Tooltip,
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
  EventNote as EventNoteIcon,
  Public as LeagueIcon,
  MonitorWeight as WeightIcon,
} from "@mui/icons-material";

// Components & Logic (Business logic preserved)
import Last10Form from "../../components/matches/TeamForm/Last10Form";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import { createMarketFormHandler } from "../../utils/marketFormHandler";
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
import MarketItem from "./MarketItem";
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

const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();
  const navigate = useNavigate();

  // State (Identical to original)
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [markets, setMarkets] = useState([
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

  // Handlers (Business logic preserved)
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
      )
        errors.home_odds = "Invalid";
      if (
        !oneXTwoMarket.draw_odds ||
        parseFloat(oneXTwoMarket.draw_odds) < 1.01
      )
        errors.draw_odds = "Invalid";
      if (
        !oneXTwoMarket.away_odds ||
        parseFloat(oneXTwoMarket.away_odds) < 1.01
      )
        errors.away_odds = "Invalid";
    }
    setMarketErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateMarkets()) {
      showSnackbar("Please fix market errors", "error");
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
      return saved;
    } catch (err) {
      showSnackbar("Failed to save match", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSlips = async (mId) => {
    setIsGenerating(true);
    try {
      const response = await matchService.generatePredictions(mId);
      if (response.success) {
        showSnackbar("Neural engine engaged! Analyzing match...", "success");
        navigate(`/matches/${mId}/results`);
      } else {
        throw new Error(response.message || "Analysis failed");
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Match Details - Redesigned for visual clarity
        return (
          <Fade in timeout={500}>
            <Grid container spacing={4}>
              {/* Matchup Banner */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: "rgba(156, 39, 176, 0.05)",
                    border: "1px solid rgba(156, 39, 176, 0.1)",
                    textAlign: "center",
                  }}
                >
                  <Grid
                    container
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                  >
                    <Grid item xs={5}>
                      <MemoizedTextField
                        fullWidth
                        variant="standard"
                        placeholder="Home Team Name"
                        value={formData.home_team}
                        onChange={(e) =>
                          handleInputChange("home_team", e.target.value)
                        }
                        inputProps={{
                          style: {
                            textAlign: "center",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography
                        variant="h4"
                        color="primary.main"
                        fontWeight="900"
                      >
                        VS
                      </Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <MemoizedTextField
                        fullWidth
                        variant="standard"
                        placeholder="Away Team Name"
                        value={formData.away_team}
                        onChange={(e) =>
                          handleInputChange("away_team", e.target.value)
                        }
                        inputProps={{
                          style: {
                            textAlign: "center",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Detail Fields */}
              <Grid item xs={12} md={6}>
                <MemoizedTextField
                  select
                  label="League"
                  value={formData.league}
                  onChange={(e) => handleInputChange("league", e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LeagueIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  SelectProps={{ native: true }}
                >
                  <option value=""></option>
                  {leagueOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </MemoizedTextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <MemoizedTextField
                  fullWidth
                  label="Match Date"
                  type="date"
                  value={formData.match_date}
                  onChange={(e) =>
                    handleInputChange("match_date", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventNoteIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
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

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Weather Condition</InputLabel>
                  <MemoizedSelect
                    value={formData.weather}
                    onChange={(e) =>
                      handleInputChange("weather", e.target.value)
                    }
                    label="Weather Condition"
                  >
                    {WEATHER_OPTIONS.map((opt) => (
                      <MemoizedMenuItem key={opt} value={opt}>
                        {opt}
                      </MemoizedMenuItem>
                    ))}
                  </MemoizedSelect>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <MemoizedTextField
                  fullWidth
                  label="Referee"
                  value={formData.referee}
                  onChange={(e) => handleInputChange("referee", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <MemoizedTextField
                  select
                  label="Venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value=""></option>
                  {venueOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </MemoizedTextField>
              </Grid>
            </Grid>
          </Fade>
        );

      case 1: // Team Forms - Improved spacing
        return (
          <Fade in timeout={500}>
            <Box>
              <Box
                sx={{
                  mb: 4,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              >
                <Last10Form
                  teamName={formData.home_team || "Home Team"}
                  value={homeFormMatches}
                  onChange={setHomeFormMatches}
                />
              </Box>
              <Box
                sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}
              >
                <Last10Form
                  teamName={formData.away_team || "Away Team"}
                  value={awayFormMatches}
                  onChange={setAwayFormMatches}
                />
              </Box>
            </Box>
          </Fade>
        );

      case 2: // Head-to-Head - Business logic preserved
        return (
          <Fade in timeout={500}>
            <HeadToHeadInput
              matches={headToHeadMatches}
              onChange={setHeadToHeadMatches}
              disabled={submitting}
            />
          </Fade>
        );

      case 3: // Markets - Enhanced list style
        return (
          <Fade in timeout={500}>
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
              >
                <Typography variant="h5" fontWeight="bold">
                  Market Selection
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addMarket}
                  sx={{ borderRadius: 8 }}
                >
                  Custom Market
                </Button>
              </Box>
              <Grid container spacing={2}>
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
          </Fade>
        );

      case 4: // Review - Modern summary view
        return (
          <Fade in timeout={500}>
            <Box>
              <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                <Chip
                  label={formData.league}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${formData.match_date} @ ${formData.match_time}`}
                  icon={<EventNoteIcon />}
                />
                <Chip label={formData.weather} variant="secondary" />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <StyledPaper
                    sx={{ p: 3, border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Typography variant="overline" color="primary">
                      Data Density
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body1">
                        Home Form: <b>{homeFormMatches.length} matches</b>
                      </Typography>
                      <Typography variant="body1">
                        Away Form: <b>{awayFormMatches.length} matches</b>
                      </Typography>
                      <Typography variant="body1">
                        H2H History: <b>{headToHeadMatches.length} records</b>
                      </Typography>
                    </Box>
                  </StyledPaper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledPaper
                    sx={{ p: 3, border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Typography variant="overline" color="primary">
                      Active Markets
                    </Typography>
                    <Box
                      sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {markets.map((m) => (
                        <Chip
                          key={m.id}
                          label={m.name}
                          size="small"
                          color="success"
                          variant="soft"
                        />
                      ))}
                    </Box>
                  </StyledPaper>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );
      default:
        return null;
    }
  };

  return (
    <GradientContainer maxWidth="xl">
      <Zoom in timeout={600}>
        <StyledPaper
          elevation={24}
          sx={{ position: "relative", overflow: "hidden" }}
        >
          {/* Subtle Background Decoration */}
          <Box
            sx={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background:
                "radial-gradient(circle, rgba(156, 39, 176, 0.1) 0%, transparent 70%)",
              zIndex: 0,
            }}
          />

          <Header>
            <Box display="flex" alignItems="center" sx={{ zIndex: 1 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  mr: 3,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <SoccerIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight="900"
                  sx={{ letterSpacing: -1, color: "white" }}
                >
                  Analysis Studio
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ opacity: 0.8, color: "white" }}
                >
                  Feed the Python Engine with high-fidelity match data
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} sx={{ zIndex: 1 }}>
              <Tooltip title="Data completeness for AI analysis">
                <Chip
                  icon={<WeightIcon sx={{ color: "white !important" }} />}
                  label="Neural Ready"
                  sx={{
                    bgcolor: "rgba(76, 175, 80, 0.3)",
                    color: "white",
                    px: 1,
                  }}
                />
              </Tooltip>
            </Box>
          </Header>

          <Box sx={{ mt: 4, position: "relative", zIndex: 1 }}>
            <form onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 8,
                  pt: 4,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <Button
                  variant="text"
                  disabled={activeStep === 0 || submitting}
                  onClick={() => setActiveStep((s) => s - 1)}
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: "text.secondary", px: 4 }}
                >
                  Back
                </Button>

                <Box sx={{ display: "flex", gap: 2 }}>
                  {activeStep === steps.length - 1 ? (
                    <>
                      <GradientButton
                        variant="contained"
                        type="submit"
                        disabled={submitting}
                        startIcon={
                          submitting ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                      >
                        {submitting ? "Processing..." : "Commit Data"}
                      </GradientButton>
                      {savedMatchId && (
                        <GradientButton
                          variant="contained"
                          sx={{
                            background:
                              "linear-gradient(45deg, #00c853 0%, #64ffda 100%)",
                            color: "#003300",
                          }}
                          onClick={() => handleGenerateSlips(savedMatchId)}
                          startIcon={
                            isGenerating ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <AutoAwesomeIcon />
                            )
                          }
                          disabled={isGenerating}
                        >
                          {isGenerating ? "Analyzing..." : "Execute AI Brain"}
                        </GradientButton>
                      )}
                    </>
                  ) : (
                    <GradientButton
                      variant="contained"
                      onClick={() => setActiveStep((s) => s + 1)}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ px: 6 }}
                    >
                      Next Step
                    </GradientButton>
                  )}
                </Box>
              </Box>
            </form>
          </Box>
        </StyledPaper>
      </Zoom>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 4, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </GradientContainer>
  );
};

export default memo(MatchEntryForm);
