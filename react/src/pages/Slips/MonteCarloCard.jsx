import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
  LinearProgress,
  Divider,
  alpha,
} from "@mui/material";
import DARK_THEME from "./ThemeProvider";

const MonteCarloCard = ({ data }) => {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: DARK_THEME.shape.borderRadius.lg,
        backgroundColor: DARK_THEME.palette.background.surface1,
        border: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.5)}`,
      }}
    >
      <Stack spacing={2}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: DARK_THEME.palette.text.primary }}
        >
          Monte Carlo Simulation
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: DARK_THEME.palette.text.tertiary }}
        >
          Based on {data.iterations} iterations
        </Typography>

        <Stack spacing={1.5}>
          {/* Win Probability */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: DARK_THEME.palette.text.secondary }}
            >
              Win Probability
            </Typography>
            <Box sx={{ width: "60%" }}>
              <LinearProgress
                variant="determinate"
                value={data.win_probability * 100}
                sx={{
                  height: 8,
                  borderRadius: DARK_THEME.shape.borderRadius.pill,
                  bgcolor: DARK_THEME.palette.background.surface3,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: DARK_THEME.palette.status.won,
                    borderRadius: DARK_THEME.shape.borderRadius.pill,
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: DARK_THEME.palette.text.primary,
                minWidth: 40,
              }}
            >
              {(data.win_probability * 100).toFixed(1)}%
            </Typography>
          </Stack>

          {/* Risk of Ruin */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: DARK_THEME.palette.text.secondary }}
            >
              Risk of Ruin
            </Typography>
            <Box sx={{ width: "60%" }}>
              <LinearProgress
                variant="determinate"
                value={data.risk_of_ruin * 100}
                sx={{
                  height: 8,
                  borderRadius: DARK_THEME.shape.borderRadius.pill,
                  bgcolor: DARK_THEME.palette.background.surface3,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: DARK_THEME.palette.status.lost,
                    borderRadius: DARK_THEME.shape.borderRadius.pill,
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: DARK_THEME.palette.text.primary,
                minWidth: 40,
              }}
            >
              {(data.risk_of_ruin * 100).toFixed(1)}%
            </Typography>
          </Stack>

          <Divider />

          {/* Returns Distribution */}
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.tertiary }}
              >
                Average Return
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.primary, fontWeight: 600 }}
              >
                {data.average_return.toFixed(2)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.tertiary }}
              >
                Median Return
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.status.lost, fontWeight: 600 }}
              >
                {data.median_return.toFixed(2)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.tertiary }}
              >
                Sharpe Ratio
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    data.sharpe_ratio > 1
                      ? DARK_THEME.palette.status.won
                      : DARK_THEME.palette.text.primary,
                  fontWeight: 600,
                }}
              >
                {data.sharpe_ratio.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default MonteCarloCard;
