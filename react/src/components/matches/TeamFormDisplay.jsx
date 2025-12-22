import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  alpha,
} from "@mui/material";
import {
  TrendingUp as TrendingIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from "@mui/icons-material";

const TeamFormDisplay = ({ homeForm, awayForm, homeTeam, awayTeam }) => {
  const renderFormRating = (rating, teamName) => {
    const normalizedRating = Math.min(Math.max((rating || 0) * 20, 0), 100);
    let color = "error";
    if (normalizedRating >= 70) color = "success";
    else if (normalizedRating >= 40) color = "warning";

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {teamName} Form Rating
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={normalizedRating}
              color={color}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {rating?.toFixed(1) || "N/A"}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderMomentum = (momentum, teamName) => {
    const momentumValue = momentum || 0;
    const normalizedValue = ((momentumValue + 1) / 2) * 100;

    let color = "error";
    let icon = <TrendingDownIcon />;
    let label = "Negative";

    if (momentumValue > 0.3) {
      color = "success";
      icon = <TrendingIcon />;
      label = "Positive";
    } else if (momentumValue > -0.3) {
      color = "warning";
      icon = <TrendingFlatIcon />;
      label = "Neutral";
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {teamName} Momentum
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ color, display: "flex", alignItems: "center" }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={normalizedValue}
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2">
            {label} ({momentumValue.toFixed(2)})
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderRecentForm = (rawForm, teamName) => {
    if (!rawForm || !Array.isArray(rawForm)) {
      return (
        <Box sx={{ textAlign: "center", py: 2, color: "text.secondary" }}>
          No recent form data available
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {teamName} Recent Matches
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {rawForm.slice(0, 5).map((match, index) => (
            <Chip
              key={index}
              label={`${match.opponent?.substring(0, 3)} ${match.outcome}`}
              size="small"
              sx={{
                bgcolor: (theme) => {
                  switch (match.result?.toLowerCase()) {
                    case "win":
                      return alpha(theme.palette.success.main, 0.1);
                    case "loss":
                      return alpha(theme.palette.error.main, 0.1);
                    default:
                      return alpha(theme.palette.warning.main, 0.1);
                  }
                },
                border: "1px solid",
                borderColor: "divider",
                fontWeight: 500,
              }}
            />
          ))}
        </Stack>
      </Box>
    );
  };

  const renderPerformanceMetrics = (metrics, teamName) => {
    const {
      matches_played = 0,
      wins = 0,
      draws = 0,
      losses = 0,
      avg_goals_scored = 0,
      avg_goals_conceded = 0,
    } = metrics;

    const winRate = matches_played > 0 ? (wins / matches_played) * 100 : 0;
    const goalDifference = avg_goals_scored - avg_goals_conceded;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {teamName} Season Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {wins}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Wins
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                {draws}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Draws
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">
                {losses}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Losses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography
                variant="h6"
                color={goalDifference >= 0 ? "success.main" : "error.main"}
              >
                {avg_goals_scored?.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Goals Scored
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h6" color="text.primary">
                {avg_goals_conceded?.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Goals Conceded
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Typography variant="h6">
            <TrendingIcon color="primary" sx={{ mr: 1 }} />
            Team Form Analysis
          </Typography>
        }
        subheader="Recent performance and momentum"
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                borderRight: { md: "1px solid" },
                borderColor: { md: "divider" },
                pr: { md: 3 },
              }}
            >
              {renderFormRating(homeForm.form_rating, homeTeam)}
              {renderMomentum(homeForm.form_momentum, homeTeam)}
              {renderRecentForm(homeForm.raw_form, homeTeam)}
              {renderPerformanceMetrics(homeForm, homeTeam)}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ pl: { md: 3 } }}>
              {renderFormRating(awayForm.form_rating, awayTeam)}
              {renderMomentum(awayForm.form_momentum, awayTeam)}
              {renderRecentForm(awayForm.raw_form, awayTeam)}
              {renderPerformanceMetrics(awayForm, awayTeam)}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TeamFormDisplay;
