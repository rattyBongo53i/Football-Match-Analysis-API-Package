import React from "react";
import {
  Grid,
  Typography,
  Box,
  Paper,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendIcon,
  EmojiEvents as TrophyIcon,
  SportsScore as ScoreIcon,
  ShowChart as ChartIcon,
} from "@mui/icons-material";
import "./TeamFormDisplay.css";

const TeamFormDisplay = ({
  homeForm,
  awayForm,
  homeTeam = "Home Team",
  awayTeam = "Away Team",
}) => {
  const defaultForm = {
    last_5: ["", "", "", "", ""],
    position: "",
    points: "",
    goals_for: "",
    goals_against: "",
    form_strength: "average",
  };

  const home = homeForm || defaultForm;
  const away = awayForm || defaultForm;

  const getResultColor = (result) => {
    switch (result?.toUpperCase()) {
      case "W":
        return "#4caf50";
      case "D":
        return "#ff9800";
      case "L":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getFormStrengthColor = (strength) => {
    switch (strength) {
      case "excellent":
        return "#4caf50";
      case "good":
        return "#8bc34a";
      case "average":
        return "#ff9800";
      case "poor":
        return "#f44336";
      case "very_poor":
        return "#d32f2f";
      default:
        return "#9e9e9e";
    }
  };

  const calculateFormPoints = (last5) => {
    if (!Array.isArray(last5)) return 0;
    return last5.reduce((points, result) => {
      switch (result?.toUpperCase()) {
        case "W":
          return points + 3;
        case "D":
          return points + 1;
        default:
          return points;
      }
    }, 0);
  };

  const renderLast5 = (last5, teamName) => {
    if (!Array.isArray(last5) || last5.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No form data available
        </Typography>
      );
    }

    return (
      <Box display="flex" gap={1} alignItems="center">
        {last5.map((result, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: getResultColor(result),
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {result || "-"}
          </Paper>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {calculateFormPoints(last5)} pts
        </Typography>
      </Box>
    );
  };

  const renderStatsTable = (form, teamName, color) => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              League Position
            </TableCell>
            <TableCell align="right">
              {form.position ? `#${form.position}` : "N/A"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              Points
            </TableCell>
            <TableCell align="right">{form.points || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              Goals For
            </TableCell>
            <TableCell align="right">{form.goals_for || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              Goals Against
            </TableCell>
            <TableCell align="right">{form.goals_against || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              Goal Difference
            </TableCell>
            <TableCell align="right">
              {form.goals_for && form.goals_against
                ? parseInt(form.goals_for) - parseInt(form.goals_against)
                : "N/A"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderFormStrength = (strength) => {
    const strengthValue = strength || "average";
    const color = getFormStrengthColor(strengthValue);

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Box flex={1}>
          <LinearProgress
            variant="determinate"
            value={
              strengthValue === "excellent"
                ? 100
                : strengthValue === "good"
                  ? 80
                  : strengthValue === "average"
                    ? 60
                    : strengthValue === "poor"
                      ? 40
                      : 20
            }
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                backgroundColor: color,
                borderRadius: 4,
              },
            }}
          />
        </Box>
        <Chip
          label={strengthValue.replace("_", " ").toUpperCase()}
          size="small"
          sx={{
            backgroundColor: color,
            color: "white",
            fontWeight: "bold",
          }}
        />
      </Box>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Home Team */}
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography
            variant="h6"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <TrendIcon /> {homeTeam}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box mb={3}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ChartIcon fontSize="small" /> Last 5 Matches
            </Typography>
            {renderLast5(home.last_5, homeTeam)}
          </Box>

          <Box mb={3}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TrophyIcon fontSize="small" /> League Statistics
            </Typography>
            {renderStatsTable(home, homeTeam, "primary")}
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Form Strength
            </Typography>
            {renderFormStrength(home.form_strength)}
          </Box>
        </Paper>
      </Grid>

      {/* Away Team */}
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography
            variant="h6"
            color="error"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <TrendIcon /> {awayTeam}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box mb={3}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ChartIcon fontSize="small" /> Last 5 Matches
            </Typography>
            {renderLast5(away.last_5, awayTeam)}
          </Box>

          <Box mb={3}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TrophyIcon fontSize="small" /> League Statistics
            </Typography>
            {renderStatsTable(away, awayTeam, "error")}
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Form Strength
            </Typography>
            {renderFormStrength(away.form_strength)}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TeamFormDisplay;
