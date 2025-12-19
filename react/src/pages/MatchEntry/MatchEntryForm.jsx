import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
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
  Fade,
  Zoom,
  Container,
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
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Casino as CasinoIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import Last10Form from "../../components/matches/TeamForm/Last10Form";
import { normalizeTeamFormForBackend } from "../../hooks/useTeamFormCalculator";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import { createMarketFormHandler } from "../../utils/marketFormHandler";

// -------------------- STYLED COMPONENTS --------------------
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(156, 39, 176, 0); }
  100% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0); }
`;

const glow = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

// Main Container with Gradient
const GradientContainer = styled(Container)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.background.paper} 0%, 
    #f3e5f5 30%, 
    #f1f8e9 70%, 
    ${theme.palette.background.paper} 100%)`,
  minHeight: "100vh",
  padding: theme.spacing(3),
  animation: `${glow} 15s ease infinite`,
  backgroundSize: "400% 400%",
}));

// Styled Paper with Purple Border
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: "24px",
  border: `2px solid ${theme.palette.primary.light}`,
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  boxShadow: `0 20px 60px rgba(156, 39, 176, 0.15),
              0 5px 15px rgba(156, 39, 176, 0.05)`,
  animation: `${fadeIn} 0.8s ease-out`,
  "&:hover": {
    boxShadow: `0 25px 70px rgba(156, 39, 176, 0.25),
                0 8px 20px rgba(156, 39, 176, 0.1)`,
    transform: "translateY(-2px)",
    transition: "all 0.3s ease",
  },
}));

// Gradient Button
const GradientButton = styled(Button)(({ theme, variant }) => ({
  background: variant === 'contained' 
    ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `2px solid ${theme.palette.primary.main}`
    : 'none',
  color: variant === 'outlined' 
    ? theme.palette.primary.main 
    : 'white',
  borderRadius: '50px',
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: variant === 'contained'
      ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`
      : 'rgba(156, 39, 176, 0.08)',
    transform: 'translateY(-2px)',
    boxShadow: `0 10px 30px rgba(156, 39, 176, 0.3)`,
  },
  '&.Mui-disabled': {
    background: variant === 'contained' ? '#e0e0e0' : 'transparent',
    color: '#9e9e9e',
  },
}));

// Styled Card for Market Items
const MarketCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: `1px solid ${theme.palette.divider}`,
  background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 12px 40px rgba(156, 39, 176, 0.15)`,
  },
}));

// Styled TextField
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover': {
      '& fieldset': {
        borderColor: theme.palette.primary.light,
      },
    },
    '&.Mui-focused': {
      '& fieldset': {
        borderWidth: '2px',
        borderColor: theme.palette.primary.main,
      },
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

// Stepper Styling
const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-completed': {
    color: theme.palette.primary.main,
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: theme.palette.secondary.main,
    fontWeight: 600,
  },
  '& .MuiStepLabel-label': {
    fontWeight: 500,
    color: theme.palette.text.secondary,
    '&.Mui-active': {
      color: theme.palette.secondary.main,
      fontWeight: 600,
    },
    '&.Mui-completed': {
      color: theme.palette.primary.main,
    },
  },
}));

// Step Icon Container
const StepIconContainer = styled('div')(({ theme, active, completed }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: completed 
    ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
    : active
    ? `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`
    : theme.palette.grey[300],
  color: completed || active ? 'white' : theme.palette.grey[500],
  fontWeight: 'bold',
  boxShadow: active ? `0 0 0 8px rgba(255, 235, 59, 0.2)` : 'none',
  animation: active ? `${pulse} 2s infinite` : 'none',
}));

// VS Badge Component
const VsBadge = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.2rem',
  boxShadow: `0 4px 20px rgba(156, 39, 176, 0.3)`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '50%',
    zIndex: -1,
    filter: 'blur(10px)',
    opacity: 0.5,
  },
}));

// Header Component
const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  borderRadius: '20px',
  background: `linear-gradient(90deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%239C27B0" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")`',
    opacity: 0.1,
  },
}));

// Custom Step Icon
const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;
  
  const icons = {
    1: '⚽',
    2: '📊',
    3: '🔄',
    4: '💰',
    5: '👁️',
  };
  
  return (
    <StepIconContainer active={active} completed={completed}>
      {icons[icon] || icon}
    </StepIconContainer>
  );
};


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
        sx={{
          cursor: "pointer",
          p: 2,
          borderRadius: "12px",
          background:
            "linear-gradient(90deg, rgba(156, 39, 176, 0.05), rgba(255, 235, 59, 0.05))",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(156, 39, 176, 0.1), rgba(255, 235, 59, 0.1))",
          },
        }}
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
       <MarketCard variant="outlined">
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
      </MarketCard>
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
  const navigate = useNavigate();

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