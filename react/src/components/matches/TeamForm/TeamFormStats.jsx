import React, { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  SportsScore as ScoreIcon,
  TrendingUp as TrendIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
  Insights as InsightsIcon,
} from "@mui/icons-material";

const TeamFormStats = ({
  stats,
  teamName,
  color = "primary",
  onStatsOverride = null,
}) => {
  const [manualOverride, setManualOverride] = useState(false);

  const handleManualOverrideToggle = (event) => {
    const newValue = event.target.checked;
    setManualOverride(newValue);
    if (onStatsOverride) {
      onStatsOverride(newValue);
    }
  };

  const getFormRatingColor = (rating) => {
    if (rating >= 8) return "#4caf50";
    if (rating >= 6) return "#8bc34a";
    if (rating >= 4) return "#ff9800";
    return "#f44336";
  };

  const getMomentumColor = (momentum) => {
    if (momentum > 2) return "#4caf50";
    if (momentum > 0) return "#8bc34a";
    if (momentum === 0) return "#ff9800";
    return "#f44336";
  };

  const renderFormStringChips = (formString) => {
    if (!formString) return null;

    return (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {formString.split("").map((char, index) => {
          let chipColor = "default";
          let chipLabel = char;

          switch (char) {
            case "W":
              chipColor = "success";
              chipLabel = "W";
              break;
            case "D":
              chipColor = "warning";
              chipLabel = "D";
              break;
            case "L":
              chipColor = "error";
              chipLabel = "L";
              break;
            default:
              chipColor = "default";
          }

          return (
            <Chip
              key={index}
              label={chipLabel}
              color={chipColor}
              size="small"
              sx={{ minWidth: 30, fontWeight: "bold" }}
            />
          );
        })}
      </Box>
    );
  };

  const statsToDisplay = stats || {
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_scored: 0,
    goals_conceded: 0,
    avg_goals_scored: 0,
    avg_goals_conceded: 0,
    clean_sheets: 0,
    failed_to_score: 0,
    form_string: "",
    form_rating: 0,
    form_momentum: 0,
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1, color }}
        >
          <InsightsIcon /> {teamName} Form Statistics
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={manualOverride}
              onChange={handleManualOverrideToggle}
              size="small"
              color="primary"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Manual Override
            </Typography>
          }
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Form Rating Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <TrendIcon fontSize="small" /> Form Rating
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={statsToDisplay.form_rating * 10} // Convert 0-10 to 0-100
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: getFormRatingColor(
                    statsToDisplay.form_rating
                  ),
                  borderRadius: 5,
                },
              }}
            />
          </Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            color={getFormRatingColor(statsToDisplay.form_rating)}
          >
            {statsToDisplay.form_rating.toFixed(1)}/10
          </Typography>
        </Box>
      </Box>

      {/* Form String Display */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Recent Form
        </Typography>
        {renderFormStringChips(statsToDisplay.form_string)}
      </Box>

      {/* Statistics Grid */}
      <Grid container spacing={3}>
        {/* Results */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TrophyIcon fontSize="small" /> Results
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Played
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.matches_played}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Wins
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {statsToDisplay.wins}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Draws
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {statsToDisplay.draws}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Losses
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {statsToDisplay.losses}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Win %
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.matches_played > 0
                      ? (
                          (statsToDisplay.wins /
                            statsToDisplay.matches_played) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    <Tooltip title="Points from last available matches">
                      <span>Points</span>
                    </Tooltip>
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.wins * 3 + statsToDisplay.draws}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Goals */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ScoreIcon fontSize="small" /> Goals
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Scored
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.goals_scored}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Conceded
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.goals_conceded}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    GD
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={
                      statsToDisplay.goals_scored -
                        statsToDisplay.goals_conceded >=
                      0
                        ? "success.main"
                        : "error.main"
                    }
                  >
                    {statsToDisplay.goals_scored -
                      statsToDisplay.goals_conceded}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Avg Scored
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.avg_goals_scored.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Avg Conceded
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.avg_goals_conceded.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Defense & Attack Stats */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ShieldIcon fontSize="small" /> Defense
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    <Tooltip title="Matches without conceding">
                      <span>Clean Sheets</span>
                    </Tooltip>
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {statsToDisplay.clean_sheets}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    CS %
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.matches_played > 0
                      ? (
                          (statsToDisplay.clean_sheets /
                            statsToDisplay.matches_played) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <BlockIcon fontSize="small" /> Attack
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    <Tooltip title="Matches without scoring">
                      <span>Failed to Score</span>
                    </Tooltip>
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {statsToDisplay.failed_to_score}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    FTS %
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statsToDisplay.matches_played > 0
                      ? (
                          (statsToDisplay.failed_to_score /
                            statsToDisplay.matches_played) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Momentum */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TrendIcon fontSize="small" /> Momentum
            </Typography>
            <Box textAlign="center">
              <Typography
                variant="h4"
                fontWeight="bold"
                color={getMomentumColor(statsToDisplay.form_momentum)}
              >
                {statsToDisplay.form_momentum > 0 ? "+" : ""}
                {statsToDisplay.form_momentum}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Points difference (last 3 matches vs previous 3 matches)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {manualOverride && (
        <Paper
          variant="outlined"
          sx={{ p: 2, mt: 3, bgcolor: "warning.light" }}
        >
          <Typography variant="body2" color="warning.dark" align="center">
            ⚠️ Manual override enabled. Statistics can now be edited directly.
          </Typography>
        </Paper>
      )}
    </Paper>
  );
};

export default TeamFormStats;
