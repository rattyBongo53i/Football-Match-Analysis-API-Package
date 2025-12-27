import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
  alpha,
} from "@mui/material";
import { SportsSoccer, TrendingUp, Insights, Score } from "@mui/icons-material";
import DARK_THEME from "./ThemeProvider";

const MatchInsightsCard = ({ match, insight, index }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return DARK_THEME.palette.status.won;
    if (confidence >= 40) return DARK_THEME.palette.status.pending;
    return DARK_THEME.palette.status.lost;
  };

  return (
    <Card
      sx={{
        borderRadius: DARK_THEME.shape.borderRadius.lg,
        backgroundColor: DARK_THEME.palette.background.surface2,
        border: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.5)}`,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Match Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SportsSoccer
                sx={{ fontSize: 20, color: DARK_THEME.palette.text.primary }}
              />
              <Typography
                variant="subtitle2"
                sx={{ color: DARK_THEME.palette.text.primary }}
              >
                {match.home_team} vs {match.away_team}
              </Typography>
            </Stack>
            {insight && (
              <Chip
                label={`${insight.confidence}% Confidence`}
                size="small"
                sx={{
                  bgcolor: alpha(getConfidenceColor(insight.confidence), 0.1),
                  color: getConfidenceColor(insight.confidence),
                  border: `1px solid ${alpha(getConfidenceColor(insight.confidence), 0.3)}`,
                }}
              />
            )}
          </Stack>

          {/* Odds and Selection */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.tertiary }}
              >
                Selection
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: DARK_THEME.palette.text.primary }}
              >
                {match.selection}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: DARK_THEME.palette.text.tertiary }}
              >
                Odds
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: DARK_THEME.palette.text.primary,
                  fontWeight: 600,
                }}
              >
                {match.odds.toFixed(2)}
              </Typography>
            </Box>
          </Stack>

          {/* AI Insights */}
          {insight && (
            <>
              <Divider />
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Insights
                    sx={{
                      fontSize: 16,
                      color: DARK_THEME.palette.accents.primary,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ color: DARK_THEME.palette.text.primary }}
                  >
                    AI Predictions
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: DARK_THEME.palette.text.tertiary }}
                    >
                      Predicted Outcome
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: DARK_THEME.palette.text.primary }}
                    >
                      {insight.predicted_outcome}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: DARK_THEME.palette.text.tertiary }}
                    >
                      Predicted Score
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: DARK_THEME.palette.text.primary }}
                    >
                      {insight.predicted_score}
                    </Typography>
                  </Box>
                </Stack>

                {/* Expected Goals */}
                {insight.expected_goals && (
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: DARK_THEME.palette.text.tertiary }}
                      >
                        xG Home
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: DARK_THEME.palette.text.primary }}
                      >
                        {insight.expected_goals.home.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: DARK_THEME.palette.text.tertiary }}
                      >
                        xG Away
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: DARK_THEME.palette.text.primary }}
                      >
                        {insight.expected_goals.away.toFixed(1)}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {/* Key Factors */}
                {insight.key_factors && insight.key_factors.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: DARK_THEME.palette.text.tertiary }}
                    >
                      Key Factors
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {insight.key_factors.slice(0, 2).map((factor, idx) => (
                        <Tooltip key={idx} title={factor.description} arrow>
                          <Chip
                            label={factor.factor}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MatchInsightsCard;
