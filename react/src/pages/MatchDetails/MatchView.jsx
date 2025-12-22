import React, { useMemo, useState, useCallback } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
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
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
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
  Delete as DeleteIcon,
  Edit as EditIcon,
  AddShoppingCart as AddToBetslipIcon,
  BarChart as BarChartIcon,
  TrendingFlat as DrawIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

import TeamFormDisplay from "../../components/matches/TeamFormDisplay";
import MarketOddsDisplay from "../../components/matches/MarketOddsDisplay";
import MatchMetricsCard from "../../components/matches/MatchMetricsCard";
import LastMeetingsTable from "../../components/matches/LastMeetingsTable";
import "./MatchDetails.css";

// Memoize heavy components
const MemoizedTeamFormDisplay = React.memo(TeamFormDisplay);
const MemoizedMarketOddsDisplay = React.memo(MarketOddsDisplay);
const MemoizedMatchMetricsCard = React.memo(MatchMetricsCard);
const MemoizedLastMeetingsTable = React.memo(LastMeetingsTable);

const MatchView = ({
  match,
  onAddToBetslip,
  onDeleteMatch,
  onUpdateMatchStatus,
  onUpdateScores,
  isLoading = false,
}) => {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    analysis: true,
    performance: false,
    history: false,
    betting: true,
  });

  // Extract data from the nested API response structure
  const matchData = useMemo(() => match?.data || match || {}, [match]);
  const headToHead = useMemo(() => matchData?.head_to_head || {}, [matchData]);
  const teamForms = useMemo(() => matchData?.team_forms || [], [matchData]);
  const markets = useMemo(() => matchData?.markets || [], [matchData]);

  // Extract form data safely
  const homeForm = useMemo(
    () => teamForms?.find((f) => f.venue === "home") || {},
    [teamForms]
  );

  const awayForm = useMemo(
    () => teamForms?.find((f) => f.venue === "away") || {},
    [teamForms]
  );

  // Extract head-to-head stats
  const headToHeadStats = useMemo(() => headToHead?.stats || {}, [headToHead]);

  // Calculate win percentages
  const winPercentages = useMemo(() => {
    const total =
      headToHeadStats.total_meetings || headToHead.total_meetings || 0;
    const homeWins = headToHeadStats.home_wins || headToHead.home_wins || 0;
    const awayWins = headToHeadStats.away_wins || headToHead.away_wins || 0;
    const draws = headToHeadStats.draws || headToHead.draws || 0;

    if (total === 0) return { home: 0, draw: 0, away: 0 };

    return {
      home: Math.round((homeWins / total) * 100),
      draw: Math.round((draws / total) * 100),
      away: Math.round((awayWins / total) * 100),
    };
  }, [headToHead, headToHeadStats]);

  const formatScore = useMemo(() => {
    if (matchData.home_score !== null && matchData.away_score !== null) {
      return `${matchData.home_score} - ${matchData.away_score}`;
    }
    return "Not played yet";
  }, [matchData.home_score, matchData.away_score]);

  const getScoreColor = useMemo(() => {
    if (matchData.home_score === null || matchData.away_score === null)
      return "text.secondary";
    if (matchData.home_score > matchData.away_score) return "success.main";
    if (matchData.home_score < matchData.away_score) return "error.main";
    return "warning.main";
  }, [matchData.home_score, matchData.away_score]);

  const getMatchStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "ongoing":
      case "live":
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
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

  const handleAddToBetslip = useCallback(() => {
    if (!selectedMarket) {
      alert("Please select a market first");
      return;
    }

    if (onAddToBetslip) {
      onAddToBetslip({
        matchId: matchData.id,
        homeTeam: matchData.home_team,
        awayTeam: matchData.away_team,
        market: selectedMarket,
        odds: selectedMarket.pivot?.odds || selectedMarket.odds || "0.00",
      });
    }
  }, [selectedMarket, matchData, onAddToBetslip]);

  const handleMarketSelect = useCallback((market) => {
    setSelectedMarket(market);
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const renderActionButtons = () => (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mb: 2 }}>
      <ButtonGroup variant="outlined" size="small">
        <Button
          startIcon={<EditIcon />}
          onClick={() => onUpdateMatchStatus?.(matchData.id)}
          disabled={isLoading}
        >
          Update Status
        </Button>
        <Button
          startIcon={<EditIcon />}
          onClick={() => onUpdateScores?.(matchData.id)}
          disabled={isLoading || matchData.status === "completed"}
        >
          Update Scores
        </Button>
      </ButtonGroup>

      <Tooltip title="Delete Match">
        <IconButton
          color="error"
          onClick={() => onDeleteMatch?.(matchData.id)}
          disabled={isLoading}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderHeadToHeadSummary = () => (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              <TrophyIcon color="primary" sx={{ mr: 1 }} />
              Head-to-Head Overview
            </Typography>
            <IconButton
              size="small"
              onClick={() => toggleSection("history")}
              sx={{ ml: 1 }}
            >
              {expandedSections.history ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </IconButton>
          </Box>
        }
        subheader={`${headToHead.total_meetings || 0} total meetings`}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "success.light", mx: "auto", mb: 1 }}>
                <TrendingIcon />
              </Avatar>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                {headToHead.home_wins || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Home Wins ({winPercentages.home}%)
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "warning.light", mx: "auto", mb: 1 }}>
                <DrawIcon />
              </Avatar>
              <Typography variant="h4" color="warning.main" fontWeight={700}>
                {headToHead.draws || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Draws ({winPercentages.draw}%)
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "error.light", mx: "auto", mb: 1 }}>
                <TrendingIcon sx={{ transform: "rotate(180deg)" }} />
              </Avatar>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                {headToHead.away_wins || 5}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Away Wins ({winPercentages.away}%)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Win Distribution
          </Typography>
          <Box
            sx={{
              display: "flex",
              height: 20,
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${winPercentages.home}%`,
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                {winPercentages.home}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: `${winPercentages.draw}%`,
                bgcolor: "warning.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                {winPercentages.draw}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: `${winPercentages.away}%`,
                bgcolor: "error.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                {winPercentages.away}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Dominance and Momentum */}
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Momentum
            </Typography>
            <Chip
              label={headToHead.momentum || "neutral"}
              color={
                headToHead.momentum === "positive"
                  ? "success"
                  : headToHead.momentum === "negative"
                    ? "error"
                    : "default"
              }
              variant="outlined"
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Dominance
            </Typography>
            <Chip
              label={
                headToHead.dominance_score
                  ? `${headToHead.dominance_score}`
                  : "N/A"
              }
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        {expandedSections.history && headToHead.last_meetings?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent Meetings
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: "auto" }}>
              <Stack spacing={1}>
                {headToHead.last_meetings.slice(0, 5).map((meeting, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor:
                        meeting.result === "H"
                          ? alpha("#4caf50", 0.05)
                          : meeting.result === "A"
                            ? alpha("#f44336", 0.05)
                            : alpha("#ff9800", 0.05),
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(meeting.date)}
                      </Typography>
                      <Typography variant="body2">
                        {meeting.home_team} vs {meeting.away_team}
                      </Typography>
                    </Box>
                    <Chip
                      label={meeting.score}
                      color={
                        meeting.result === "H"
                          ? "success"
                          : meeting.result === "A"
                            ? "error"
                            : "warning"
                      }
                      size="small"
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderMatchDetails = () => (
    <Card variant="outlined">
      <CardHeader
        title={
          <Typography variant="h6">
            <SoccerIcon color="warning" sx={{ mr: 1 }} />
            Match Information
          </Typography>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon fontSize="small" />
                    Match Date & Time
                  </Box>
                </Typography>
                <Typography variant="body1">
                  {formatDate(matchData.match_date)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrophyIcon fontSize="small" />
                    League
                  </Box>
                </Typography>
                <Chip
                  label={matchData.league || "Not specified"}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StatsIcon fontSize="small" />{" "}
                    {/* Fixed: Changed Assessment to StatsIcon */}
                    Analysis Status
                  </Box>
                </Typography>
                <Chip
                  label={matchData.analysis_status || "pending"}
                  color={
                    matchData.analysis_status === "completed"
                      ? "success"
                      : matchData.analysis_status === "processing"
                        ? "warning"
                        : "default"
                  }
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingIcon fontSize="small" />
                    Prediction Ready
                  </Box>
                </Typography>
                <Chip
                  label={matchData.prediction_ready ? "Ready" : "Pending"}
                  color={matchData.prediction_ready ? "success" : "warning"}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon fontSize="small" />
                    Created
                  </Box>
                </Typography>
                <Typography variant="body2">
                  {formatDate(matchData.created_at)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <UpdateIcon fontSize="small" />
                    Last Updated
                  </Box>
                </Typography>
                <Typography variant="body2">
                  {formatDate(matchData.updated_at)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text-secondary"
                  gutterBottom
                >
                  Match ID
                </Typography>
                <Chip
                  label={matchData.id}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: "monospace" }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text-secondary"
                  gutterBottom
                >
                  Markets Available
                </Typography>
                <Chip
                  label={`${matchData.markets_count || markets.length} markets`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTeamPerformanceSummary = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {matchData.home_team} Recent Form
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6" color="primary.main">
              {homeForm.form_rating?.toFixed(1) || "N/A"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rating
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`${homeForm.wins || 0}W`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${homeForm.draws || 0}D`}
              size="small"
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`${homeForm.losses || 0}L`}
              size="small"
              color="error"
              variant="outlined"
            />
            <Chip
              label={`${homeForm.matches_played || 0} Played`}
              size="small"
              variant="outlined"
            />
          </Box>
          {homeForm.form_string && (
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
              Form: {homeForm.form_string}
            </Typography>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {matchData.away_team} Recent Form
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6" color="error.main">
              {awayForm.form_rating?.toFixed(1) || "N/A"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rating
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`${awayForm.wins || 0}W`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${awayForm.draws || 0}D`}
              size="small"
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`${awayForm.losses || 0}L`}
              size="small"
              color="error"
              variant="outlined"
            />
            <Chip
              label={`${awayForm.matches_played || 0} Played`}
              size="small"
              variant="outlined"
            />
          </Box>
          {awayForm.form_string && (
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
              Form: {awayForm.form_string}
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!matchData.id) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        No match data available
      </Alert>
    );
  }

  return (
    <Fade in timeout={500}>
      <Box>
        {/* Match Header with Actions */}
        <Card sx={{ mb: 3, position: "relative" }}>
          <CardContent>
            {renderActionButtons()}

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2}>
                <AvatarGroup max={2} sx={{ justifyContent: "center" }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {getTeamInitials(matchData.home_team)}
                  </Avatar>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "error.main",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {getTeamInitials(matchData.away_team)}
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
                      {matchData.home_team}
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
                      {matchData.away_team}
                    </Box>
                  </Typography>

                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: "divider",
                      my: 2,
                      minWidth: "300px",
                    }}
                  >
                    {matchData.home_score !== null &&
                    matchData.away_score !== null ? (
                      <>
                        <Typography
                          variant="h1"
                          fontWeight={900}
                          color={getScoreColor}
                          sx={{ minWidth: "80px" }}
                        >
                          {matchData.home_score}
                        </Typography>
                        <Typography variant="h2" color="text.secondary">
                          :
                        </Typography>
                        <Typography
                          variant="h1"
                          fontWeight={900}
                          color={getScoreColor}
                          sx={{ minWidth: "80px" }}
                        >
                          {matchData.away_score}
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
                      label={matchData.league || "Unknown League"}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<SoccerIcon />}
                      label={matchData.status || "Scheduled"}
                      color={getMatchStatusColor(matchData.status)}
                    />
                    <Chip
                      icon={<CalendarIcon />}
                      label={formatDate(matchData.match_date)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha("#1976d2", 0.05),
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {selectedMarket && (
                    <Alert
                      severity="info"
                      sx={{ mb: 2 }}
                      icon={<AddToBetslipIcon />}
                    >
                      <Typography variant="body2">
                        Selected: {selectedMarket.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Odds:{" "}
                        {selectedMarket.pivot?.odds ||
                          selectedMarket.odds ||
                          "0.00"}
                      </Typography>
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddToBetslipIcon />}
                    onClick={handleAddToBetslip}
                    fullWidth
                    disabled={!selectedMarket}
                  >
                    Add to Betslip
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Team Performance Summary */}
        {renderTeamPerformanceSummary()}

        {/* Tabs for different sections */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<StatsIcon />} label="Team Analysis" />
            <Tab icon={<TrendingIcon />} label="Performance Metrics" />
            <Tab icon={<BarChartIcon />} label="Historical Data" />
            <Tab icon={<TrophyIcon />} label="Betting Markets" />
            <Tab icon={<StatsIcon />} label="Match Details" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <MemoizedTeamFormDisplay
                homeForm={homeForm}
                awayForm={awayForm}
                homeTeam={matchData.home_team}
                awayTeam={matchData.away_team}
              />
            </Grid>

            <Grid item xs={12} lg={6}>
              {renderHeadToHeadSummary()}
            </Grid>

            <Grid item xs={12}>
              <MemoizedLastMeetingsTable
                meetings={headToHead.last_meetings || []}
                homeTeam={matchData.home_team}
                awayTeam={matchData.away_team}
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <MemoizedMatchMetricsCard
                title={`${matchData.home_team} Performance`}
                metrics={homeForm}
                teamColor="primary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MemoizedMatchMetricsCard
                title={`${matchData.away_team} Performance`}
                metrics={awayForm}
                teamColor="error"
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderHeadToHeadSummary()}
            </Grid>
            <Grid item xs={12}>
              <MemoizedLastMeetingsTable
                meetings={headToHead.last_meetings || []}
                homeTeam={matchData.home_team}
                awayTeam={matchData.away_team}
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MemoizedMarketOddsDisplay
                markets={markets}
                onMarketSelect={handleMarketSelect}
                selectedMarketId={selectedMarket?.id}
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderMatchDetails()}
            </Grid>
          </Grid>
        )}
      </Box>
    </Fade>
  );
};

export default React.memo(MatchView);
