// src/pages/MasterSlipAnalysis/components/MatchCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  CardActionArea,
  Fade,
} from "@mui/material";
import {
  SportsSoccer,
  Score,
  TrendingUp,
  Event,
  OpenInNew,
  CalendarToday,
  ChevronRight,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import DARK_THEME from "./ThemeProvider";

const MatchCard = ({ match, index }) => {
  const navigate = useNavigate();

  const handleMatchClick = () => {
    navigate(`/matches/${match.match_id}`);
  };

  const getMarketIcon = (market) => {
    switch (market) {
      case "1X2":
        return <Score sx={{ fontSize: 16 }} />;
      case "Over/Under 2.5":
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case "BTTS":
        return <SportsSoccer sx={{ fontSize: 16 }} />;
      default:
        return <Event sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Fade in={true} timeout={300 + index * 100}>
      <Card
        sx={{
          borderRadius: DARK_THEME.shape.borderRadius.lg,
          backgroundColor: DARK_THEME.palette.background.surface2,
          border: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.5)}`,
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: alpha(DARK_THEME.palette.accents.primary, 0.3),
            boxShadow: DARK_THEME.shadows.surface2,
            transform: "translateY(-1px)",
          },
        }}
      >
        <CardActionArea onClick={handleMatchClick}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {/* Match Header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(DARK_THEME.palette.accents.primary, 0.1),
                      color: DARK_THEME.palette.accents.primary,
                    }}
                  >
                    <SportsSoccer sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      color: DARK_THEME.palette.text.tertiary,
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  >
                    {match.league}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={match.market} arrow>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        borderRadius: DARK_THEME.shape.borderRadius.sm,
                        bgcolor: alpha(DARK_THEME.palette.accents.primary, 0.1),
                      }}
                    >
                      {getMarketIcon(match.market)}
                      <Typography
                        variant="caption"
                        sx={{
                          color: DARK_THEME.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      >
                        {match.market === "Over/Under 2.5"
                          ? "O/U"
                          : match.market}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <IconButton
                    size="small"
                    sx={{
                      color: DARK_THEME.palette.text.tertiary,
                      "&:hover": { color: DARK_THEME.palette.text.accent },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMatchClick();
                    }}
                  >
                    <OpenInNew sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Teams & Odds */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Stack alignItems="center" sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: DARK_THEME.palette.text.primary,
                      fontWeight: 600,
                      textAlign: "center",
                      mb: 0.5,
                    }}
                  >
                    {match.home_team}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DARK_THEME.palette.text.tertiary }}
                  >
                    Home
                  </Typography>
                </Stack>

                <Stack alignItems="center" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: DARK_THEME.palette.text.tertiary,
                      fontWeight: 600,
                    }}
                  >
                    VS
                  </Typography>
                  <Chip
                    label={match.odds.toFixed(2)}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(DARK_THEME.palette.status.draft, 0.1),
                      color: DARK_THEME.palette.status.draft,
                      border: `1px solid ${alpha(DARK_THEME.palette.status.draft, 0.3)}`,
                      fontSize: "0.8rem",
                      height: 24,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: DARK_THEME.palette.text.tertiary,
                      fontSize: "0.65rem",
                    }}
                  >
                    {match.selection}
                  </Typography>
                </Stack>

                <Stack alignItems="center" sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: DARK_THEME.palette.text.primary,
                      fontWeight: 600,
                      textAlign: "center",
                      mb: 0.5,
                    }}
                  >
                    {match.away_team}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DARK_THEME.palette.text.tertiary }}
                  >
                    Away
                  </Typography>
                </Stack>
              </Stack>

              {/* Match Footer */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pt: 1,
                  borderTop: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.3)}`,
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarToday
                    sx={{
                      fontSize: 14,
                      color: DARK_THEME.palette.text.tertiary,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: DARK_THEME.palette.text.secondary }}
                  >
                    {new Date(match.match_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Stack>
                <ChevronRight
                  sx={{ fontSize: 16, color: DARK_THEME.palette.text.tertiary }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </Fade>
  );
};

export default MatchCard;
