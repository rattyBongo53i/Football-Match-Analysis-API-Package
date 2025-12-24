import React from "react";
import {
  Paper,
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Card,
  LinearProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";

const SlipInfoCard = ({ slip, onViewDetails, getRiskColor, onAddMatches }) => (
  <Paper
    sx={{
      p: 4,
      mb: 4,
      borderRadius: 3,
      background:
        "linear-gradient(135deg, rgba(123, 31, 162, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
      border: "1px solid rgba(156, 39, 176, 0.1)",
    }}
  >
    <Grid container spacing={3} alignItems="center">
      <Grid item xs={12} md={8}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1C1C1E" }}>
            {slip.name || "Unnamed Slip"}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {slip.status && (
              <Chip
                label={slip.status}
                sx={{
                  bgcolor:
                    slip.status === "Won"
                      ? "success.main"
                      : slip.status === "Lost"
                        ? "error.main"
                        : slip.status === "Pending"
                          ? "warning.main"
                          : "primary.main",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}
            {slip.risk_level && (
              <Chip
                label={slip.risk_level}
                color={getRiskColor(slip.risk_level)}
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        <Typography variant="body1" sx={{ color: "#636366", mb: 2 }}>
          Created on{" "}
          {slip.created_at
            ? new Date(slip.created_at).toLocaleDateString()
            : "N/A"}
          {slip.matches_count && ` • ${slip.matches_count} matches`}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onViewDetails}
            sx={{ textTransform: "none" }}
          >
            View Detailed Analysis
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddMatches}
            sx={{ textTransform: "none" }}
          >
            Add Matches
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            COMBINED ODDS
          </Typography>
          <Typography
            variant="h2"
            sx={{ color: "primary.main", fontWeight: 900, mb: 1 }}
          >
            {slip.total_odds ? slip.total_odds.toFixed(2) : "N/A"}
          </Typography>

          <Typography variant="caption" color="text.secondary" display="block">
            Stake: {slip.currency || "USD"} {slip.stake?.toFixed(2) || "0.00"}
          </Typography>

          {slip.estimated_payout && (
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
              Est. Payout: {slip.currency || "USD"}{" "}
              {slip.estimated_payout.toFixed(2)}
            </Typography>
          )}

          {slip.confidence_score && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
              >
                Confidence: {slip.confidence_score}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={slip.confidence_score}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      slip.confidence_score > 75
                        ? "success.main"
                        : slip.confidence_score > 50
                          ? "warning.main"
                          : "error.main",
                  },
                }}
              />
            </Box>
          )}
        </Card>
      </Grid>
    </Grid>
  </Paper>
);

export default SlipInfoCard;
