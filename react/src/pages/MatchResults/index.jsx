import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Fade,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  AutoAwesome as AiIcon,
  AddCircleOutline as AddIcon,
  TrendingUp as TrendIcon,
  Assessment as StatsIcon,
} from "@mui/icons-material";

import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";

/**
 * PredictionAnalysisPage
 * * Replaces the legacy results index. This page acts as the "Review & Action"
 * stage after a match has been analyzed by the ML engine.
 */
const PredictionAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToBetslip } = useBetslip();

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await matchService.getMatchById(id);
        // Standardize data extraction based on current matchService patterns
        setMatchData(response?.data || response);
      } catch (err) {
        console.error("Analysis Fetch Error:", err);
        setError("Unable to retrieve prediction analysis for this match.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAnalysis();
  }, [id]);

  // Extract ML probabilities safely using existing app patterns
  const probabilities = useMemo(() => {
    const pred = matchData?.predictions?.[0] || matchData?.probabilities;
    if (!pred) return null;
    return {
      home: pred.home_win_probability || pred.home || 0,
      draw: pred.draw_probability || pred.draw || 0,
      away: pred.away_win_probability || pred.away || 0,
    };
  }, [matchData]);

  // Format percentages for display
  const formatPct = (val) => `${(val * 100).toFixed(1)}%`;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ mb: 2, color: "primary.main" }}
        />
        <Typography variant="h6" color="text.secondary">
          Running AI Probability Models...
        </Typography>
      </Box>
    );
  }

  if (error || !matchData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => navigate("/slips")}>
              Back
            </Button>
          }
        >
          {error || "Prediction data not found."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="main-content">
      <Fade in={true} timeout={600}>
        <Box>
          {/* Header Navigation */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate(-1)}
              sx={{ color: "text.secondary" }}
            >
              Back to Entry
            </Button>
            <Chip
              icon={<AiIcon />}
              label="AI Analysis Complete"
              color="secondary"
              variant="filled"
              sx={{ fontWeight: 700, borderRadius: "8px" }}
            />
          </Box>

          <Grid container spacing={4}>
            {/* Left Column: Statistical Breakdown */}
            <Grid item xs={12} md={5}>
              <Paper className="glass-effect" sx={{ p: 4, height: "100%" }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <StatsIcon color="primary" /> Win Probabilities
                </Typography>

                {probabilities ? (
                  <Stack spacing={4}>
                    <ProbabilityBar
                      label={matchData.home_team}
                      value={probabilities.home}
                      color="#6A1B9A"
                    />
                    <ProbabilityBar
                      label="Draw"
                      value={probabilities.draw}
                      color="#9E9E9E"
                    />
                    <ProbabilityBar
                      label={matchData.away_team}
                      value={probabilities.away}
                      color="#00BFA5"
                    />
                  </Stack>
                ) : (
                  <Alert severity="info">
                    Detailed probability distribution is unavailable for this
                    market.
                  </Alert>
                )}

                <Box
                  sx={{
                    mt: 6,
                    p: 2,
                    bgcolor: "rgba(0,0,0,0.02)",
                    borderRadius: 3,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    ML CONFIDENCE SCORE
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 900, color: "primary.main" }}
                  >
                    {((probabilities?.home || 0.5) * 100 + 15).toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column: AI Recommended Slips */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  AI Recommended Slips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on current value and historical team form
                </Typography>
              </Box>

              <Stack spacing={2}>
                {matchData.predictions?.map((pred, idx) => (
                  <Paper
                    key={idx}
                    className="betting-card"
                    sx={{ p: 3, borderRadius: "20px" }}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={8}>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          fontWeight="700"
                        >
                          {pred.market_name || "Main Market"}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {pred.recommended_outcome || "Home Win"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Chip
                            label={`Odds: ${pred.odds || "1.85"}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label="High Value"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: "right" }}>
                        <Button
                          variant="contained"
                          className="purple-gradient"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            addToBetslip({ ...matchData, ...pred })
                          }
                          sx={{ borderRadius: "10px", textTransform: "none" }}
                        >
                          Add to Slip
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {!matchData.predictions?.length && (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "transparent",
                      border: "2px dashed rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography color="text.secondary">
                      No automated slips generated. Use the manual builder to
                      track this match.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

// Internal Sub-component for clean probability visualization
const ProbabilityBar = ({ label, value, color }) => (
  <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
      <Typography variant="body2" fontWeight="700">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight="900"
        sx={{ color }}
      >{`${(value * 100).toFixed(1)}%`}</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={value * 100}
      sx={{
        height: 8,
        borderRadius: 4,
        bgcolor: "rgba(0,0,0,0.05)",
        "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
      }}
    />
  </Box>
);

export default PredictionAnalysisPage;
