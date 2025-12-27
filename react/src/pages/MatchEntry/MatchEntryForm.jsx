import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
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
  Paper,
  Stepper,
  IconButton,
  Select,
  MenuItem,
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
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  CurrencyExchange as CurrencyIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { TextField as MuiTextField } from "@mui/material";

// Import theme utilities
// import { theme } from "../../theme";
import { theme } from "../../theme";
// import { theme } from "../../designTokens";
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
import HeadToHeadInput from "./HeadToHeadInput";
import MarketItem from "./MarketItem";
import {
  getMarketType,
  normalizeHeadToHead,
  prepareMarketsForBackend,
} from "./matchEntryUtils";

// Memoized constants to prevent recreation
const INITIAL_MARKETS = [
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
];

// Memoized components for better performance
const MemoizedTextField = memo(({ children, ...props }) => (
  <TextField {...props}>{children}</TextField>
));

const MemoizedSelect = memo(({ children, ...props }) => (
  <Select {...props}>{children}</Select>
));

const MemoizedMenuItem = memo(({ children, ...props }) => (
  <MenuItem {...props}>{children}</MenuItem>
));
 console.log(theme);


// Update the TextField component to use theme
const TextField = ({ InputProps, sx = {}, ...props }) => {
  const defaultInputProps = useMemo(
    () => ({
      sx: {
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.tertiary,
        borderColor: theme.colors.border.light,
        borderRadius: theme.borderRadius.md,
        "&:focus": {
          borderColor: theme.colors.accent.primary,
          boxShadow: theme.shadows.focus,
        },
        "&:hover": {
          borderColor: theme.colors.border.strong,
        },
        ...InputProps?.sx,
      },
    }),
    [InputProps?.sx]
  );

  return (
    <MuiTextField
      InputProps={{
        ...defaultInputProps,
        ...InputProps,
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: theme.colors.border.light,
          },
          "&:hover fieldset": {
            borderColor: theme.colors.border.strong,
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.colors.accent.primary,
            boxShadow: theme.shadows.focus,
          },
        },
        "& .MuiInputLabel-root": {
          color: theme.colors.text.secondary,
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: theme.colors.accent.primary,
        },
        ...sx,
      }}
      {...props}
    />
  );
};

// Updated container and paper components
const Container = ({ children, sx = {}, ...props }) => (
  <Box
    sx={{
      backgroundColor: theme.colors.background.primary,
      minHeight: "100vh",
      padding: theme.spacing[4],
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

const StyledPaper = ({ children, sx = {}, ...props }) => (
  <Paper
    sx={{
      backgroundColor: theme.colors.surface.card,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border.light}`,
      boxShadow: theme.shadows.lg,
      padding: theme.spacing[5],
      transition: theme.transitions.normal,
      "&:hover": {
        boxShadow: theme.shadows.xl,
        borderColor: theme.colors.border.strong,
        transform: "translateY(-2px)",
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

const GradientButton = ({ children, sx = {}, ...props }) => (
  <Button
    sx={{
      background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.primaryHover})`,
      color: "white",
      borderRadius: theme.borderRadius.md,
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      fontWeight: theme.typography.fontWeight.medium,
      transition: theme.transitions.fast,
      "&:hover": {
        background: `linear-gradient(135deg, ${theme.colors.accent.primaryHover}, ${theme.colors.accent.primary})`,
        boxShadow: theme.shadows.lg,
        transform: "translateY(-1px)",
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Button>
);

const StyledStepper = ({ children, sx = {}, ...props }) => (
  <Stepper
    sx={{
      "& .MuiStepLabel-root .MuiStepLabel-label": {
        color: theme.colors.text.secondary,
        "&.Mui-active": {
          color: theme.colors.text.primary,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        "&.Mui-completed": {
          color: theme.colors.accent.primary,
        },
      },
      "& .MuiStepIcon-root": {
        color: theme.colors.border.light,
        "&.Mui-active": {
          color: theme.colors.accent.primary,
        },
        "&.Mui-completed": {
          color: theme.colors.accent.primary,
        },
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Stepper>
);

const Header = ({ children, sx = {}, ...props }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[3],
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();
  const navigate = useNavigate();

  // State (Identical to original but with initial optimizations)
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
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

  // Use refs for values that don't need re-renders
  const savedMatchIdRef = useRef(savedMatchId);
  const matchIdRef = useRef(matchId);

  // Update refs when values change
  useEffect(() => {
    savedMatchIdRef.current = savedMatchId;
  }, [savedMatchId]);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  const showSnackbar = useCallback(
    (message, severity = "success") =>
      setSnackbar({ open: true, message, severity }),
    []
  );

  const closeSnackbar = useCallback(
    () => setSnackbar((s) => ({ ...s, open: false })),
    []
  );

  // Memoize the initial data effect
  useEffect(() => {
    if (!initialData) return;

    setFormData(initialData);

    if (initialData.markets) {
      setMarkets(initialData.markets);
    }

    if (initialData.home_form?.raw_form) {
      setHomeFormMatches(initialData.home_form.raw_form);
    }

    if (initialData.away_form?.raw_form) {
      setAwayFormMatches(initialData.away_form.raw_form);
    }

    if (initialData.head_to_head_stats?.last_meetings) {
      setHeadToHeadMatches(initialData.head_to_head_stats.last_meetings);
    }
  }, [initialData]);

  // Optimize input change handler
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Optimize market change handlers
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

  // Memoize validation function
  const validateMarkets = useCallback(() => {
    const errors = {};
    const oneXTwoMarket = markets.find((m) => m.name === "1X2");

    if (oneXTwoMarket) {
      const homeOdds = parseFloat(oneXTwoMarket.home_odds);
      const drawOdds = parseFloat(oneXTwoMarket.draw_odds);
      const awayOdds = parseFloat(oneXTwoMarket.away_odds);

      if (!oneXTwoMarket.home_odds || homeOdds < 1.01)
        errors.home_odds = "Invalid";
      if (!oneXTwoMarket.draw_odds || drawOdds < 1.01)
        errors.draw_odds = "Invalid";
      if (!oneXTwoMarket.away_odds || awayOdds < 1.01)
        errors.away_odds = "Invalid";
    }

    setMarketErrors(errors);
    return Object.keys(errors).length === 0;
  }, [markets]);

  // Memoize form submission handler
  const handleSubmit = useCallback(
    async (e) => {
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

        const saved = matchIdRef.current
          ? await matchService.updateMatch(matchIdRef.current, matchData)
          : await matchService.createMatch(matchData);

        const newSavedMatchId = saved.id || saved.data?.id;
        setSavedMatchId(newSavedMatchId);
        showSnackbar(matchIdRef.current ? "Match updated" : "Match saved");

        if (onSuccess) {
          onSuccess(saved);
        }

        return saved;
      } catch (err) {
        console.error("Submission error:", err);
        showSnackbar("Failed to save match", "error");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      homeFormMatches,
      awayFormMatches,
      headToHeadMatches,
      markets,
      marketHandler,
      validateMarkets,
      showSnackbar,
      onSuccess,
    ]
  );

  // Memoize generate slips handler
  const handleGenerateSlips = useCallback(
    async (mId) => {
      setIsGenerating(true);
      try {
        const response = await matchService.generatePredictions(
          mId || savedMatchIdRef.current
        );
        if (response.success) {
          showSnackbar("Neural engine engaged! Analyzing match...", "success");
          navigate(`/matches/${mId || savedMatchIdRef.current}/results`);
        } else {
          throw new Error(response.message || "Analysis failed");
        }
      } catch (error) {
        console.error("Generate slips error:", error);
        showSnackbar(error.message, "error");
      } finally {
        setIsGenerating(false);
      }
    },
    [navigate, showSnackbar]
  );

  // Memoize step content rendering
  const renderStepContent = useCallback(
    (step) => {
      switch (step) {
        case 0: // Match Details
          return (
            <Fade in timeout={300} mountOnEnter unmountOnExit>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: theme.spacing[4],
                      borderRadius: theme.borderRadius.lg,
                      backgroundColor: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={5}>
                        <MemoizedTextField
                          fullWidth
                          variant="outlined"
                          placeholder="Home Team Name"
                          value={formData.home_team}
                          onChange={(e) =>
                            handleInputChange("home_team", e.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-input": {
                              textAlign: "center",
                              fontSize: theme.typography.fontSize.xl,
                              fontWeight: theme.typography.fontWeight.bold,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={2} sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h5"
                          color={theme.colors.accent.primary}
                          fontWeight={theme.typography.fontWeight.bold}
                        >
                          VS
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <MemoizedTextField
                          fullWidth
                          variant="outlined"
                          placeholder="Away Team Name"
                          value={formData.away_team}
                          onChange={(e) =>
                            handleInputChange("away_team", e.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-input": {
                              textAlign: "center",
                              fontSize: theme.typography.fontSize.xl,
                              fontWeight: theme.typography.fontWeight.bold,
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MemoizedTextField
                    select
                    label="League"
                    value={formData.league}
                    onChange={(e) =>
                      handleInputChange("league", e.target.value)
                    }
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LeagueIcon
                            fontSize="small"
                            sx={{ color: theme.colors.accent.primary }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            backgroundColor: theme.colors.surface.card,
                            border: `1px solid ${theme.colors.border.light}`,
                            color: theme.colors.text.primary,
                            "& .MuiMenuItem-root": {
                              color: theme.colors.text.primary,
                              "&:hover": {
                                backgroundColor: theme.colors.state.hover,
                              },
                              "&.Mui-selected": {
                                backgroundColor: theme.colors.state.selected,
                              },
                            },
                          },
                        },
                      },
                    }}
                    sx={{
                      "& .MuiSelect-select": {
                        color: theme.colors.text.primary,
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.colors.text.secondary,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.colors.border.light,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.colors.border.strong,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.colors.accent.primary,
                      },
                    }}
                  >
                    {leagueOptions.map((opt) => (
                      <MenuItem
                        key={opt}
                        value={opt}
                        sx={{
                          color: theme.colors.text.primary,
                          "&:hover": {
                            backgroundColor: theme.colors.state.hover,
                          },
                          "&.Mui-selected": {
                            backgroundColor: theme.colors.state.selected,
                          },
                        }}
                      >
                        {opt}
                      </MenuItem>
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
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventNoteIcon
                            fontSize="small"
                            sx={{ color: theme.colors.accent.primary }}
                          />
                        </InputAdornment>
                      ),
                    }}
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
                    <InputLabel
                      sx={{
                        color: theme.colors.text.secondary,
                        "&.Mui-focused": {
                          color: theme.colors.accent.primary,
                        },
                      }}
                    >
                      Weather Condition
                    </InputLabel>
                    <MemoizedSelect
                      value={formData.weather}
                      onChange={(e) =>
                        handleInputChange("weather", e.target.value)
                      }
                      label="Weather Condition"
                      sx={{
                        color: theme.colors.text.primary,
                        backgroundColor: theme.colors.background.tertiary,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.colors.border.light,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.colors.border.strong,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.colors.accent.primary,
                        },
                      }}
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
                    onChange={(e) =>
                      handleInputChange("referee", e.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <MemoizedTextField
                    select
                    label="Venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    fullWidth
                  >
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

        case 1: // Team Forms
          return (
            <Fade in timeout={300} mountOnEnter unmountOnExit>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Last10Form
                    teamName={formData.home_team || "Home Team"}
                    value={homeFormMatches}
                    onChange={setHomeFormMatches}
                  />
                </Box>
                <Box>
                  <Last10Form
                    teamName={formData.away_team || "Away Team"}
                    value={awayFormMatches}
                    onChange={setAwayFormMatches}
                  />
                </Box>
              </Box>
            </Fade>
          );

        case 2: // Head-to-Head
          return (
            <Fade in timeout={300} mountOnEnter unmountOnExit>
              <HeadToHeadInput
                matches={headToHeadMatches}
                onChange={setHeadToHeadMatches}
                disabled={submitting}
              />
            </Fade>
          );

        case 3: // Markets
          return (
            <Fade in timeout={300} mountOnEnter unmountOnExit>
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Typography
                    variant="h6"
                    fontWeight={theme.typography.fontWeight.semibold}
                    color={theme.colors.text.primary}
                  >
                    Market Selection
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addMarket}
                    sx={{
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: theme.colors.accent.primary,
                      "&:hover": {
                        backgroundColor: theme.colors.accent.primaryHover,
                      },
                    }}
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

        case 4: // Review
          return (
            <Fade in timeout={300} mountOnEnter unmountOnExit>
              <Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                  {formData.league && (
                    <Chip
                      label={formData.league}
                      size="small"
                      sx={{
                        color: theme.colors.accent.primary,
                        borderColor: theme.colors.accent.primary,
                        backgroundColor: `rgba(${parseInt(theme.colors.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.colors.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.colors.accent.primary.slice(5, 7), 16)}, 0.1)`,
                      }}
                    />
                  )}
                  {formData.match_date && (
                    <Chip
                      label={`${formData.match_date} ${formData.match_time ? `@ ${formData.match_time}` : ""}`}
                      icon={<EventNoteIcon />}
                      size="small"
                      sx={{
                        color: theme.colors.text.secondary,
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    />
                  )}
                  {formData.weather && (
                    <Chip
                      label={formData.weather}
                      size="small"
                      sx={{
                        color: theme.colors.text.secondary,
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>

                    <Box
                      sx={{
                        p: theme.spacing[3],
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.border.light}`,
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={theme.typography.fontWeight.semibold}
                        gutterBottom
                        color={theme.colors.text.primary}
                      >
                        Data Density
                      </Typography>
                      <Typography variant="body2" color={theme.colors.text.secondary}>
                        Home Form: <b>{homeFormMatches.length} matches</b>
                      </Typography>
                      <Typography variant="body2" color={theme.colors.text.secondary}>
                        Away Form: <b>{awayFormMatches.length} matches</b>
                      </Typography>
                      <Typography variant="body2" color={theme.colors.text.secondary}>
                        H2H History: <b>{headToHeadMatches.length} records</b>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        p: theme.spacing[3],
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.border.light}`,
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={theme.typography.fontWeight.semibold}
                        gutterBottom
                        color={theme.colors.text.primary}
                      >
                        Active Markets
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {markets
                          .filter(
                            (m) =>
                              m.required || m.outcomes?.length > 0 || m.odds
                          )
                          .map((m) => (
                            <Chip
                              key={m.id}
                              label={m.name}
                              size="small"
                              sx={{
                                color: theme.colors.accent.success,
                                borderColor: theme.colors.accent.success,
                                backgroundColor: `rgba(${parseInt(theme.colors.accent.success.slice(1, 3), 16)}, ${parseInt(theme.colors.accent.success.slice(3, 5), 16)}, ${parseInt(theme.colors.accent.success.slice(5, 7), 16)}, 0.1)`,
                              }}
                            />
                          ))}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          );
        default:
          return null;
      }
    },
    [
      formData,
      homeFormMatches,
      awayFormMatches,
      headToHeadMatches,
      markets,
      submitting,
      handleInputChange,
      addMarket,
      removeMarket,
      handleMarketChange,
      marketErrors,
    ]
  );

  // Memoize navigation handlers
  const handleNext = useCallback(() => {
    setActiveStep((s) => s + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((s) => s - 1);
  }, []);

  return (
    <Container maxWidth="xl">
      <StyledPaper elevation={8}>
        <Header>
          <Box display="flex" alignItems="center">
            <Box sx={{ mr: 2 }}>
              <SoccerIcon
                sx={{
                  fontSize: 32,
                  color: theme.colors.accent.primary,
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={theme.typography.fontWeight.bold}
                color={theme.colors.text.primary}
              >
                Analysis Studio
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.text.secondary}
              >
                Feed the engine with match data
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<WeightIcon fontSize="small" />}
            label="Neural Ready"
            size="small"
            sx={{
              backgroundColor: `rgba(${parseInt(theme.colors.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.colors.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.colors.accent.primary.slice(5, 7), 16)}, 0.15)`,
              color: theme.colors.accent.primary,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          />
        </Header>

        <Box sx={{ mt: theme.spacing[4] }}>
          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: theme.spacing[6],
                pt: theme.spacing[4],
                borderTop: `1px solid ${theme.colors.border.medium}`,
              }}
            >
              <Button
                variant="outlined"
                disabled={activeStep === 0 || submitting}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderColor: theme.colors.border.light,
                  color: theme.colors.text.secondary,
                  "&:hover": {
                    borderColor: theme.colors.border.strong,
                    backgroundColor: theme.colors.state.hover,
                  },
                }}
              >
                Back
              </Button>

              <Box sx={{ display: "flex", gap: 1 }}>
                {activeStep === steps.length - 1 ? (
                  <>
                    <GradientButton
                      variant="contained"
                      type="submit"
                      disabled={submitting}
                      startIcon={
                        submitting ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                    >
                      {submitting ? "Saving..." : "Save Match"}
                    </GradientButton>
                    {savedMatchId && (
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: theme.colors.accent.success,
                          color: "white",
                          borderRadius: theme.borderRadius.md,
                          "&:hover": {
                            backgroundColor: theme.colors.accent.success,
                            opacity: 0.9,
                          },
                          "&:disabled": {
                            opacity: 0.5,
                          },
                        }}
                        onClick={() => handleGenerateSlips()}
                        startIcon={
                          isGenerating ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <AutoAwesomeIcon />
                          )
                        }
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Analyzing..." : "Run AI Analysis"}
                      </Button>
                    )}
                  </>
                ) : (
                  <GradientButton
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Next
                  </GradientButton>
                )}
              </Box>
            </Box>
          </form>
        </Box>
      </StyledPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: theme.borderRadius.md,
            backgroundColor:
              snackbar.severity === "error"
                ? theme.colors.accent.error
                : snackbar.severity === "warning"
                ? theme.colors.accent.warning
                : theme.colors.accent.primary,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Use React.memo with custom comparison
export default memo(MatchEntryForm, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.matchId === nextProps.matchId &&
    prevProps.initialData === nextProps.initialData &&
    prevProps.onSuccess === nextProps.onSuccess
  );
});