import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  LinearProgress,
  alpha,
} from "@mui/material";
import {
  Equalizer as MetricsIcon,
  EmojiEvents as TrophyIcon,
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendIcon,
} from "@mui/icons-material";

const MatchMetricsCard = ({ title, metrics, teamColor = "primary" }) => {
  const {
    form_rating = 0,
    form_momentum = 0,
    matches_played = 0,
    wins = 0,
    draws = 0,
    losses = 0,
    avg_goals_scored = 0,
    avg_goals_conceded = 0,
  } = metrics;

  const winRate = matches_played > 0 ? (wins / matches_played) * 100 : 0;
  const drawRate = matches_played > 0 ? (draws / matches_played) * 100 : 0;
  const lossRate = matches_played > 0 ? (losses / matches_played) * 100 : 0;
  const goalDifference = avg_goals_scored - avg_goals_conceded;

  const metricsList = [
    {
      label: "Win Rate",
      value: winRate,
      color: "success",
      icon: <TrophyIcon />,
      suffix: "%",
    },
    {
      label: "Draw Rate",
      value: drawRate,
      color: "warning",
      icon: <TrendIcon />,
      suffix: "%",
    },
    {
      label: "Loss Rate",
      value: lossRate,
      color: "error",
      icon: <TrendIcon sx={{ transform: "rotate(180deg)" }} />,
      suffix: "%",
    },
    {
      label: "Goal Difference",
      value: goalDifference,
      color: goalDifference >= 0 ? "success" : "error",
      icon: <SoccerIcon />,
      suffix: "",
    },
    {
      label: "Avg Goals Scored",
      value: avg_goals_scored,
      color: "info",
      icon: <SoccerIcon />,
      suffix: "",
    },
    {
      label: "Avg Goals Conceded",
      value: avg_goals_conceded,
      color: "secondary",
      icon: <SoccerIcon />,
      suffix: "",
    },
  ];

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Typography variant="h6">
            <MetricsIcon sx={{ mr: 1, color: `${teamColor}.main` }} />
            {title}
          </Typography>
        }
        subheader={`${matches_played} matches played`}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Overall Form Rating
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: "100%" }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(form_rating * 20, 100)}
                    color={
                      form_rating > 3.5
                        ? "success"
                        : form_rating > 2.5
                          ? "warning"
                          : "error"
                    }
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {form_rating.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {metricsList.map((metric, index) => (
            <Grid item xs={6} sm={4} key={index}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: alpha(`${metric.color}.main`, 0.05),
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ color: `${metric.color}.main`, mr: 1 }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {metric.label}
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  color={`${metric.color}.main`}
                  fontWeight={700}
                >
                  {metric.value.toFixed(1)}
                  {metric.suffix}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MatchMetricsCard;
