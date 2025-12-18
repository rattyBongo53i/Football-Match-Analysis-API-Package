import React, { useMemo, useCallback } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  AvatarGroup,
  alpha,
  Stack,
  Fade,
  LinearProgress,
} from "@mui/material";
import {
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Assessment as StatsIcon,
  Schedule as TimeIcon,
  LocationOn as VenueIcon,
  Person as RefereeIcon,
  WbSunny as WeatherIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Stadium as StadiumIcon,
} from "@mui/icons-material";

import TeamFormDisplay from "../../components/matches/TeamFormDisplay";
import MarketOddsDisplay from "../../components/matches/MarketOddsDisplay";
import "./MatchDetails.css";

// Memoize heavy components
const MemoizedTeamFormDisplay = React.memo(TeamFormDisplay);
const MemoizedMarketOddsDisplay = React.memo(MarketOddsDisplay);

const MatchView = ({ match }) => {
  // Extract form data safely
  const homeForm = useMemo(
    () => match.teamForms?.find((f) => f.venue === "home") || {},
    [match.teamForms]
  );

  const awayForm = useMemo(
    () => match.teamForms?.find((f) => f.venue === "away") || {},
    [match.teamForms]
  );

  const formatScore = useMemo(() => {
    if (match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    }
    return "Not played yet";
  }, [match.home_score, match.away_score]);

  const getScoreColor = useMemo(() => {
    if (match.home_score === null || match.away_score === null)
      return "text.secondary";
    if (match.home_score > match.away_score) return "success.main";
    if (match.home_score < match.away_score) return "error.main";
    return "warning.main";
  }, [match.home_score, match.away_score]);

  const getMatchStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "ongoing":
        return "warning";
      case "scheduled":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatTime = useCallback((timeString) => {
    return timeString || "";
  }, []);

  const getTeamInitials = useCallback((teamName) => {
    if (!teamName) return "??";
    return teamName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const renderHeadToHead = useMemo(() => {
    const h2h = match.headToHead;

    if (!h2h || Object.keys(h2h).length === 0) {
      return (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: "text.secondary",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
          }}
        >
          <TrophyIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1">
            No head-to-head data available
          </Typography>
        </Box>
      );
    }

    const totalMatches =
      (h2h.home_wins || 0) + (h2h.away_wins || 0) + (h2h.draws || 0);

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            mb: 3,
            p: 2,
            bgcolor: "background.default",
            borderRadius: 2,
          }}
        >
          <Box textAlign="center">
            <Typography variant="h4" color="primary" fontWeight={700}>
              {h2h.home_wins || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Home Wins
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="warning.main" fontWeight={700}>
              {h2h.draws || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Draws
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="error" fontWeight={700}>
              {h2h.away_wins || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Away Wins
            </Typography>
          </Box>
        </Box>

        {totalMatches > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Win Distribution
            </Typography>
            <Box
              sx={{
                display: "flex",
                height: 8,
                borderRadius: 4,
                overflow: "hidden",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: `${((h2h.home_wins || 0) / totalMatches) * 100}%`,
                  bgcolor: "primary.main",
                }}
              />
              <Box
                sx={{
                  width: `${((h2h.draws || 0) / totalMatches) * 100}%`,
                  bgcolor: "warning.main",
                }}
              />
              <Box
                sx={{
                  width: `${((h2h.away_wins || 0) / totalMatches) * 100}%`,
                  bgcolor: "error.main",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              <span>
                {Math.round(((h2h.home_wins || 0) / totalMatches) * 100)}% Home
              </span>
              <span>
                {Math.round(((h2h.draws || 0) / totalMatches) * 100)}% Draw
              </span>
              <span>
                {Math.round(((h2h.away_wins || 0) / totalMatches) * 100)}% Away
              </span>
            </Box>
          </Box>
        )}

        {h2h.last_meetings?.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Last {h2h.last_meetings.length} Meetings
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {h2h.last_meetings.map((meeting, i) => (
                <Chip
                  key={i}
                  label={
                    meeting.score
                      ? `${meeting.date}: ${meeting.score}`
                      : meeting.date
                  }
                  size="small"
                  sx={{
                    mb: 1,
                    bgcolor: (theme) => {
                      if (meeting.result === "home")
                        return alpha(theme.palette.success.main, 0.1);
                      if (meeting.result === "away")
                        return alpha(theme.palette.error.main, 0.1);
                      return alpha(theme.palette.warning.main, 0.1);
                    },
                    border: "1px solid",
                    borderColor: "divider",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }, [match.headToHead]);

  const renderTeamMomentum = useCallback(
    (form, teamName) => (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {teamName} Momentum
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((form.form_momentum || 0 + 1) / 2) * 100}
          color={form.form_momentum > 0 ? "success" : "error"}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" textAlign="center" mt={1}>
          {form.form_momentum > 0
            ? "Positive"
            : form.form_momentum < 0
              ? "Negative"
              : "Neutral"}
          ({form.form_momentum || 0})
        </Typography>
      </Box>
    ),
    []
  );

  const renderAdditionalInfo = () => (
    <Stack spacing={3}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <StadiumIcon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="subtitle2" color="text.secondary">
            Venue
          </Typography>
        </Box>
        <Chip label={match.venue || "Not specified"} size="small" />
      </Box>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <RefereeIcon fontSize="small" sx={{ color: "secondary.main" }} />
          <Typography variant="subtitle2" color="text.secondary">
            Referee
          </Typography>
        </Box>
        <Typography variant="body1">
          {match.referee || "Not assigned"}
        </Typography>
      </Box>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <WeatherIcon fontSize="small" sx={{ color: "info.main" }} />
          <Typography variant="subtitle2" color="text.secondary">
            Weather
          </Typography>
        </Box>
        <Chip
          label={match.weather_conditions || "Clear"}
          size="small"
          icon={<WeatherIcon />}
        />
      </Box>

      {renderTeamMomentum(homeForm, match.home_team)}
      {renderTeamMomentum(awayForm, match.away_team)}

      {match.notes && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Notes
          </Typography>
          <Paper
            elevation={0}
            sx={{ p: 2, bgcolor: alpha("#fff8e1", 0.3), borderRadius: 1.5 }}
          >
            <Typography variant="body2">{match.notes}</Typography>
          </Paper>
        </Box>
      )}
    </Stack>
  );

  return (
    <Fade in timeout={500}>
      <Box>
        {/* Match Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid
                item
                xs={12}
                md={2}
                sx={{ display: { xs: "none", md: "block" } }}
              >
                <AvatarGroup max={2} sx={{ justifyContent: "center" }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      fontSize: "1.5rem",
                    }}
                  >
                    {getTeamInitials(match.home_team)}
                  </Avatar>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "error.main",
                      fontSize: "1.5rem",
                    }}
                  >
                    {getTeamInitials(match.away_team)}
                  </Avatar>
                </AvatarGroup>
              </Grid>

              <Grid item xs={12} md={8}>
                <Box textAlign="center">
                  <Typography variant="h4" gutterBottom>
                    <Box
                      component="span"
                      sx={{ color: "primary.main", fontWeight: 700 }}
                    >
                      {match.home_team}
                    </Box>
                    <Box
                      component="span"
                      sx={{ mx: 2, color: "text.secondary" }}
                    >
                      vs
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: "error.main", fontWeight: 700 }}
                    >
                      {match.away_team}
                    </Box>
                  </Typography>

                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "1px solid divider",
                      my: 2,
                    }}
                  >
                    {match.home_score !== null && match.away_score !== null ? (
                      <>
                        <Typography
                          variant="h1"
                          fontWeight={900}
                          color={getScoreColor}
                        >
                          {match.home_score}
                        </Typography>
                        <Typography variant="h4" color="text.secondary">
                          :
                        </Typography>
                        <Typography
                          variant="h1"
                          fontWeight={900}
                          color={getScoreColor}
                        >
                          {match.away_score}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h5" color="text.secondary">
                        {formatScore}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      icon={<TrophyIcon />}
                      label={match.league || "Unknown League"}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<SoccerIcon />}
                      label={match.status || "Scheduled"}
                      color={getMatchStatusColor(match.status)}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha("#1976d2", 0.03),
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(match.match_date)}
                  </Typography>

                  {match.match_time && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 2,
                        }}
                      >
                        <TimeIcon color="secondary" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Time
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {formatTime(match.match_time)}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title={
                  <Typography variant="h6">
                    <TrendingIcon color="primary" sx={{ mr: 1 }} /> Team Form
                    Analysis
                  </Typography>
                }
              />
              <CardContent>
                <MemoizedTeamFormDisplay
                  homeForm={homeForm}
                  awayForm={awayForm}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title={
                  <Typography variant="h6">
                    <TrophyIcon color="secondary" sx={{ mr: 1 }} /> Head-to-Head
                    History
                  </Typography>
                }
              />
              <CardContent>{renderHeadToHead}</CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <Typography variant="h6">
                    <StatsIcon color="info" sx={{ mr: 1 }} /> Betting Markets &
                    Odds
                  </Typography>
                }
              />
              <CardContent>
                <MemoizedMarketOddsDisplay markets={match.markets || []} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <Typography variant="h6">
                    <SoccerIcon color="warning" sx={{ mr: 1 }} /> Match Details
                  </Typography>
                }
              />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    {renderAdditionalInfo()}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <CalendarIcon
                            fontSize="small"
                            sx={{ color: "success.main" }}
                          />
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Created
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {formatDate(match.created_at)}
                        </Typography>
                      </Box>
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <UpdateIcon
                            fontSize="small"
                            sx={{ color: "info.main" }}
                          />
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Updated
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {formatDate(match.updated_at)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Match ID
                        </Typography>
                        <Chip label={match.id} size="small" />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default React.memo(MatchView);
