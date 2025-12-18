import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
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
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

import Last10Form from "../../components/matches/TeamForm/Last10Form";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import { createMarketFormHandler } from "../../utils/marketFormHandler";
import "./MatchEntryForm.css";

// Memoized MUI wrappers
const MemoizedTextField = memo(TextField);
const MemoizedSelect = memo(({ children, ...props }) => (
  <Select {...props}>{children}</Select>
));
const MemoizedMenuItem = memo(MenuItem);
const MemoizedCard = memo(Card);
const MemoizedIconButton = memo(IconButton);

// -------------------- CONSTANTS --------------------
const INITIAL_FORM_DATA = {
  home_team: "",
  away_team: "",
  league: "",
  match_date: new Date().toISOString().split("T")[0],
  match_time: "15:00",
  venue: "",
  referee: "",
  weather: "Clear",
  status: "scheduled",
  home_score: null,
  away_score: null,
  notes: "",
};

const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rainy", "Snow", "Windy"];

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

const venueOptions = ["Home", "Away", "Neutral"];

// -------------------- HEAD TO HEAD --------------------
const EMPTY_H2H_MATCH = {
  date: "",
  home_team: "",
  away_team: "",
  score: "",
  result: "",
};

const HeadToHeadInput = memo(({ matches = [], onChange, disabled }) => {
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => onChange([...matches, { ...EMPTY_H2H_MATCH }]);
  const handleRemove = (i) => onChange(matches.filter((_, idx) => idx !== i));

  const handleChange = (i, field, value) => {
    const updated = [...matches];
    updated[i] = { ...updated[i], [field]: value };

    if (field === "score" && value.includes("-")) {
      const [h, a] = value.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(h) && !isNaN(a)) {
        updated[i].result = h > a ? "H" : h < a ? "A" : "D";
      }
    }

    onChange(updated);
  };

  return (
    <Box mb={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" sx={{ display: "flex", gap: 1 }}>
          <HistoryIcon /> Head-to-Head ({matches.length})
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Collapse in={expanded}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Optional historical meetings (most recent first)
        </Alert>

        {matches.map((m, i) => (
          <Card key={i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    type="date"
                    fullWidth
                    label="Date"
                    value={m.date}
                    onChange={(e) => handleChange(i, "date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Home"
                    value={m.home_team}
                    onChange={(e) =>
                      handleChange(i, "home_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Away"
                    value={m.away_team}
                    onChange={(e) =>
                      handleChange(i, "away_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <MemoizedTextField
                    fullWidth
                    label="Score"
                    value={m.score}
                    onChange={(e) => handleChange(i, "score", e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Chip label={m.result || "?"} size="small" />
                </Grid>
              </Grid>
              <IconButton onClick={() => handleRemove(i)} disabled={disabled}>
                <DeleteIcon />
              </IconButton>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={disabled || matches.length >= 10}
        >
          Add H2H Match
        </Button>
      </Collapse>
    </Box>
  );
});

HeadToHeadInput.displayName = "HeadToHeadInput";

// -------------------- MARKET ITEM COMPONENT --------------------
const MarketItem = memo(({
  market,
  index,
  marketErrors,
  submitting,
  onRemoveMarket,
  onMarketChange
}) => {
  const is1X2Market = market.name === "1X2";
  const isCorrectScore = market.name === "Correct Score";
  const isAsianHandicap = market.name === "Asian Handicap";
  const isBothTeamsScore = market.name === "Both Teams to Score";
  const isOverUnder = market.name === "Over/Under";
  const isHalftime = market.name === "Halftime";
  const isCorners = market.name === "Corners";
  const isPlayers = market.name === "Player Markets";

  const handleOddsChange = useCallback((field, value, outcomeIndex = null) => {
    const updated = { ...market };

    if (outcomeIndex !== null && market.outcomes && market.outcomes[outcomeIndex]) {
      // Update specific outcome odds
      const updatedOutcomes = [...market.outcomes];
      updatedOutcomes[outcomeIndex] = {
        ...updatedOutcomes[outcomeIndex],
        odds: parseFloat(value) || 0
      };
      updated.outcomes = updatedOutcomes;
    } else if (field === "odds") {
      updated.odds = parseFloat(value) || 0;
    } else if (field.startsWith("outcome_")) {
      // Handle outcomes for markets like Both Teams to Score
      const outcomeField = field.replace("outcome_", "");
      if (!updated.outcomes) updated.outcomes = [];
      const existingIndex = updated.outcomes.findIndex(o => o.outcome === outcomeField);
      if (existingIndex >= 0) {
        updated.outcomes[existingIndex] = {
          ...updated.outcomes[existingIndex],
          odds: parseFloat(value) || 0
        };
      } else {
        updated.outcomes.push({
          outcome: outcomeField,
          odds: parseFloat(value) || 0
        });
      }
    } else {
      updated[field] = parseFloat(value) || 0;
    }

    onMarketChange(index, updated);
  }, [market, index, onMarketChange]);

  // Get default outcomes based on market type
  const getDefaultOutcomes = () => {
    switch(market.name) {
      case "Correct Score":
        return [
          { score: "1-0", odds: "" },
          { score: "0-1", odds: "" },
          { score: "1-1", odds: "" },
          { score: "2-1", odds: "" },
          { score: "1-2", odds: "" },
          { score: "0-0", odds: "" },
          { score: "2-2", odds: "" },
          { score: "2-3", odds: "" },
          { score: "3-2", odds: "" },
          { score: "3-1", odds: "" },
          { score: "1-3", odds: "" },
          { score: "Any Other", odds: "" }
        ];
      case "Asian Handicap":
        return [
          { handicap: "Home +1", odds: "" },
          { handicap: "Home -1", odds: "" },
          { handicap: "Away +1", odds: "" },
          { handicap: "Away -1", odds: "" },
          { handicap: "Home +2", odds: "" },
          { handicap: "Home -2", odds: "" },
          { handicap: "Away +2", odds: "" },
          { handicap: "Away -2", odds: "" }
        ];
      case "Both Teams to Score":
        return [
          { outcome: "Yes", odds: "" },
          { outcome: "No", odds: "" }
        ];
      case "Over/Under":
        return [
          { line: "Over 2.5", odds: "" },
          { line: "Under 2.5", odds: "" },
          { line: "Over 3.5", odds: "" },
          { line: "Under 3.5", odds: "" }
        ];
      case "Halftime":
        return [
          { outcome: "Home", odds: "" },
          { outcome: "Draw", odds: "" },
          { outcome: "Away", odds: "" }
        ];
      case "Corners":
        return [
          { type: "Home Over 7.5", odds: "" },
          { type: "Home Under 7.5", odds: "" },
          { type: "Away Over 7.5", odds: "" },
          { type: "Away Under 7.5", odds: "" },
          { type: "Total Over 10.5", odds: "" },
          { type: "Total Under 10.5", odds: "" }
        ];
      case "Player Markets":
        return [
          { type: "Anytime Goalscorer", player: "", odds: "" },
          { type: "First Goalscorer", player: "", odds: "" },
          { type: "Assists Over 0.5", player: "", odds: "" },
          { type: "Cards Over 1.5", player: "", odds: "" }
        ];
      default:
        return [];
    }
  };

  // Initialize outcomes if not present
  useEffect(() => {
    if ((isCorrectScore || isAsianHandicap || isBothTeamsScore || isOverUnder || isHalftime || isCorners || isPlayers) &&
        (!market.outcomes || market.outcomes.length === 0)) {
      const defaultOutcomes = getDefaultOutcomes();
      onMarketChange(index, { ...market, outcomes: defaultOutcomes });
    }
  }, [market.name, index, onMarketChange]);

  // Render correct score inputs
  const renderCorrectScore = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={4} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.score}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ""}
            onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render asian handicap inputs
  const renderAsianHandicap = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={3} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.handicap}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ""}
            onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render both teams to score inputs
  const renderBothTeamsScore = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <MemoizedTextField
          fullWidth
          label="Yes"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === "Yes")?.odds || ""}
          onChange={(e) => handleOddsChange("outcome_Yes", e.target.value)}
          disabled={submitting}
        />
      </Grid>
      <Grid item xs={6}>
        <MemoizedTextField
          fullWidth
          label="No"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === "No")?.odds || ""}
          onChange={(e) => handleOddsChange("outcome_No", e.target.value)}
          disabled={submitting}
        />
      </Grid>
    </Grid>
  );

  // Render over/under inputs
  const renderOverUnder = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={3} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.line}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ""}
            onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render halftime inputs
  const renderHalftime = () => (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <MemoizedTextField
          fullWidth
          label="Home"
          type="number"
          step="0.01"
          min="1.01"
          value={market.outcomes?.find(o => o.outcome === "Home")?.odds || ""}
          onChange={(e) => handleOddsChange("outcome_Home", e.target.value)}
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
          value={market.outcomes?.find(o => o.outcome === "Draw")?.odds || ""}
          onChange={(e) => handleOddsChange("outcome_Draw", e.target.value)}
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
          value={market.outcomes?.find(o => o.outcome === "Away")?.odds || ""}
          onChange={(e) => handleOddsChange("outcome_Away", e.target.value)}
          disabled={submitting}
        />
      </Grid>
    </Grid>
  );

  // Render corners inputs
  const renderCorners = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={6} sm={4} key={idx}>
          <MemoizedTextField
            fullWidth
            label={`${outcome.type}`}
            type="number"
            step="0.01"
            min="1.01"
            value={outcome.odds || ""}
            onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
            disabled={submitting}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Render player markets inputs
  const renderPlayerMarkets = () => (
    <Grid container spacing={2}>
      {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
        <Grid item xs={12} key={idx}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={5}>
              <MemoizedTextField
                fullWidth
                label="Type"
                value={outcome.type}
                disabled
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <MemoizedTextField
                fullWidth
                label="Player"
                value={outcome.player || ""}
                onChange={(e) => {
                  const updated = { ...market };
                  if (!updated.outcomes) updated.outcomes = [];
                  const updatedOutcomes = [...updated.outcomes];
                  updatedOutcomes[idx] = {
                    ...updatedOutcomes[idx],
                    player: e.target.value
                  };
                  updated.outcomes = updatedOutcomes;
                  onMarketChange(index, updated);
                }}
                disabled={submitting}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={3}>
              <MemoizedTextField
                fullWidth
                label="Odds"
                type="number"
                step="0.01"
                min="1.01"
                value={outcome.odds || ""}
                onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
                disabled={submitting}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Grid item xs={12}>
      <MemoizedCard variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {market.name} {market.required && "*"}
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

          {/* Render appropriate market type */}
          {is1X2Market ? (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <MemoizedTextField
                  fullWidth
                  label="Home"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={market.home_odds || ""}
                  onChange={(e) => handleOddsChange("home_odds", e.target.value)}
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
                  value={market.draw_odds || ""}
                  onChange={(e) => handleOddsChange("draw_odds", e.target.value)}
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
                  value={market.away_odds || ""}
                  onChange={(e) => handleOddsChange("away_odds", e.target.value)}
                  error={!!marketErrors.away_odds}
                  helperText={marketErrors.away_odds}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          ) : isCorrectScore ? renderCorrectScore() :
            isAsianHandicap ? renderAsianHandicap() :
            isBothTeamsScore ? renderBothTeamsScore() :
            isOverUnder ? renderOverUnder() :
            isHalftime ? renderHalftime() :
            isCorners ? renderCorners() :
            isPlayers ? renderPlayerMarkets() : (
            <MemoizedTextField
              fullWidth
              label="Odds"
              type="number"
              step="0.01"
              min="1.01"
              value={market.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value)}
              disabled={submitting}
            />
          )}
        </CardContent>
      </MemoizedCard>
    </Grid>
  );
});

MarketItem.displayName = "MarketItem";

// Helper function to get market type (for backward compatibility)
const getMarketType = (marketName) => {
  const typeMap = {
    "1X2": "match_result",
    "Correct Score": "correct_score",
    "Asian Handicap": "asian_handicap",
    "Both Teams to Score": "both_teams_score",
    "Over/Under": "over_under",
    "Halftime": "halftime",
    "Corners": "corners",
    "Player Markets": "player_markets",
    "Double Chance": "double_chance",
    "Draw No Bet": "draw_no_bet",
    "Half Time/Full Time": "ht_ft",
    "Total Goals": "total_goals"
  };
  return typeMap[marketName] || "general";
};

// -------------------- MAIN FORM COMPONENT --------------------
const MatchEntryForm = ({ matchId, initialData, onSuccess }) => {
  const marketHandler = useMemo(() => createMarketFormHandler(), []);
  const { addMatchToBetslip } = useBetslip();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Match Details", "Team Forms", "Head-to-Head", "Markets", "Review"];

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [markets, setMarkets] = useState(() => [
    { id: 1, name: "1X2", required: true, home_odds: "", draw_odds: "", away_odds: "" },
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
    { id: 12, name: "Total Goals", required: false, odds: "" }
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
        market_type: "custom"
      }
    ]);
  }, []);

  const validateMarkets = () => {
    const errors = {};
    const oneXTwoMarket = markets.find((m) => m.name === "1X2");
    
    if (oneXTwoMarket) {
      if (!oneXTwoMarket.home_odds || parseFloat(oneXTwoMarket.home_odds) < 1.01) {
        errors.home_odds = "Home odds must be at least 1.01";
      }
      if (!oneXTwoMarket.draw_odds || parseFloat(oneXTwoMarket.draw_odds) < 1.01) {
        errors.draw_odds = "Draw odds must be at least 1.01";
      }
      if (!oneXTwoMarket.away_odds || parseFloat(oneXTwoMarket.away_odds) < 1.01) {
        errors.away_odds = "Away odds must be at least 1.01";
      }
    }
    
    setMarketErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Normalize head-to-head data
  const normalizeHeadToHead = () => {
    if (!headToHeadMatches.length) return null;
    return {
      home_wins: headToHeadMatches.filter((m) => m.result === "H").length,
      away_wins: headToHeadMatches.filter((m) => m.result === "A").length,
      draws: headToHeadMatches.filter((m) => m.result === "D").length,
      total_meetings: headToHeadMatches.length,
      last_meetings: headToHeadMatches,
    };
  };

  // Prepare markets for backend (using both handler and custom logic)
  const prepareMarketsForBackend = (uiMarkets) => {
    // First try using the market handler
    const handlerMarkets = marketHandler.prepareMarketsForBackend(uiMarkets);
    
    // If handler doesn't handle all markets, fall back to custom logic
    const marketsData = uiMarkets.map((market) => {
      const marketData = {
        name: market.name,
        market_type: getMarketType(market.name),
        odds: market.odds || 0,
      };

      // Add outcomes based on market type
      if (market.name === "1X2") {
        marketData.outcomes = [
          { outcome: "home", odds: market.home_odds || 0 },
          { outcome: "draw", odds: market.draw_odds || 0 },
          { outcome: "away", odds: market.away_odds || 0 },
        ];
      } else if (market.outcomes && market.outcomes.length > 0) {
        marketData.outcomes = market.outcomes.map((outcome) => {
          if (market.name === "Correct Score") {
            return { outcome: `score_${outcome.score}`, odds: outcome.odds || 0 };
          } else if (market.name === "Asian Handicap") {
            return { outcome: `handicap_${outcome.handicap.replace(/\s+/g, "_")}`, odds: outcome.odds || 0 };
          } else if (market.name === "Both Teams to Score") {
            return { outcome: outcome.outcome.toLowerCase(), odds: outcome.odds || 0 };
          } else if (market.name === "Over/Under") {
            return { outcome: outcome.line.replace(/\s+/g, "_").toLowerCase(), odds: outcome.odds || 0 };
          } else if (market.name === "Halftime") {
            return { outcome: outcome.outcome.toLowerCase(), odds: outcome.odds || 0 };
          } else if (market.name === "Corners") {
            return { outcome: outcome.type.replace(/\s+/g, "_").toLowerCase(), odds: outcome.odds || 0 };
          } else if (market.name === "Player Markets") {
            return {
              outcome: `${outcome.type.replace(/\s+/g, "_").toLowerCase()}_${outcome.player || "player"}`,
              odds: outcome.odds || 0,
              player: outcome.player || "",
            };
          }
          return { outcome: "default", odds: outcome.odds || 0 };
        });
      }

      return marketData;
    });

    // Filter out empty markets
    const filteredMarkets = marketsData.filter((market) => {
      if (market.name === "1X2") {
        return market.outcomes.some((o) => o.odds > 0);
      } else if (market.outcomes) {
        return market.outcomes.some((o) => o.odds > 0);
      }
      return market.odds > 0;
    });

    return filteredMarkets.length > 0 ? filteredMarkets : handlerMarkets;
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
        head_to_head_stats: normalizeHeadToHead(),
        markets: prepareMarketsForBackend(markets),
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
                onChange={(e) => handleInputChange("match_date", e.target.value)}
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
                onChange={(e) => handleInputChange("match_time", e.target.value)}
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
            <Grid item xs={12} md={2} align="center" sx={{ display: "flex", alignItems: "center" }}>
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
            <Typography variant="h6" gutterBottom>Review Match Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Home Team: {formData.home_team}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Away Team: {formData.away_team}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">League: {formData.league}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date: {formData.match_date} at {formData.match_time}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Team Forms:</Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • Home Team: {homeFormMatches.length} matches
                </Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • Away Team: {awayFormMatches.length} matches
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Head-to-Head:</Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  • {headToHeadMatches.length} historical meetings
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Markets:</Typography>
                {markets.filter(m => {
                  if (m.name === "1X2") return m.home_odds || m.draw_odds || m.away_odds;
                  if (m.outcomes) return m.outcomes.some(o => o.odds);
                  return m.odds;
                }).map((market, idx) => (
                  <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                    • {market.name}: {market.name === "1X2" ?
                      `H: ${market.home_odds || "-"} | D: ${market.draw_odds || "-"} | A: ${market.away_odds || "-"}` :
                      market.odds || "Multiple outcomes"}
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
    <Box sx={{ maxWidth: 1200, margin: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SoccerIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4">Match Entry Form</Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              disabled={activeStep === 0 || submitting}
              onClick={handleBack}
            >
              Back
            </Button>

            <Box sx={{ display: "flex", gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={submitting}
                    startIcon={<SaveIcon />}
                  >
                    {submitting ? "Saving..." : "Save Match"}
                  </Button>
                  {savedMatchId && (
                    <Button
                      variant="contained"
                      color="secondary"
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
                      {isGenerating ? "Generating..." : "Generate Predictions"}
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default memo(MatchEntryForm);