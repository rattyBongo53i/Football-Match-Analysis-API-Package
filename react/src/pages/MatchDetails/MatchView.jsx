import React from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
} from "@mui/material";
import {
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Assessment as StatsIcon,
  Schedule as TimeIcon,
  LocationOn as VenueIcon,
} from "@mui/icons-material";
import TeamFormDisplay from "../../components/matches/TeamFormDisplay";
import MarketOddsDisplay from "../../components/matches/MarketOddsDisplay";
import "./MatchDetails.css";

const MatchView = ({ match }) => {
  const formatScore = () => {
    if (match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    }
    return "Not played";
  };

  const renderHeadToHead = () => {
    if (!match.head_to_head || Object.keys(match.head_to_head).length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          py={2}
        >
          No head-to-head data available
        </Typography>
      );
    }

    const h2h = match.head_to_head;
    return (
      <TableContainer>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>Home Wins</strong>
              </TableCell>
              <TableCell align="right">{h2h.home_wins || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Away Wins</strong>
              </TableCell>
              <TableCell align="right">{h2h.away_wins || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Draws</strong>
              </TableCell>
              <TableCell align="right">{h2h.draws || 0}</TableCell>
            </TableRow>
            {h2h.last_5_meetings && (
              <TableRow>
                <TableCell colSpan={2}>
                  <strong>Last 5 Meetings:</strong>
                  <Box sx={{ mt: 1 }}>
                    {h2h.last_5_meetings.map((meeting, index) => (
                      <Chip
                        key={index}
                        label={meeting}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderAdditionalInfo = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <VenueIcon fontSize="small" /> Venue
        </Typography>
        <Typography variant="body1">
          {match.venue || "Not specified"}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <TimeIcon fontSize="small" /> Referee
        </Typography>
        <Typography variant="body1">
          {match.referee || "Not specified"}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Weather
        </Typography>
        <Chip label={match.weather || "Clear"} size="small" sx={{ mt: 0.5 }} />
      </Box>

      {match.notes && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Notes
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              p: 1,
              bgcolor: "background.default",
              borderRadius: 1,
            }}
          >
            {match.notes}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Grid container spacing={3}>
      {/* Score Section */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={4}
          >
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {match.home_team}
              </Typography>
              {match.home_score !== null && (
                <Typography variant="h2" fontWeight="bold" mt={2}>
                  {match.home_score}
                </Typography>
              )}
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" color="text.secondary">
                VS
              </Typography>
              <Typography variant="h6" color="text.secondary" mt={1}>
                {formatScore()}
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="h4" color="error" fontWeight="bold">
                {match.away_team}
              </Typography>
              {match.away_score !== null && (
                <Typography variant="h2" fontWeight="bold" mt={2}>
                  {match.away_score}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Team Forms */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title={
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TrendingIcon /> Team Forms
              </Typography>
            }
          />
          <Divider />
          <CardContent>
            <TeamFormDisplay
              homeForm={match.home_form}
              awayForm={match.away_form}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Head to Head */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title={
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TrophyIcon /> Head to Head
              </Typography>
            }
          />
          <Divider />
          <CardContent>{renderHeadToHead()}</CardContent>
        </Card>
      </Grid>

      {/* Market Odds */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <StatsIcon /> Market Odds
              </Typography>
            }
          />
          <Divider />
          <CardContent>
            <MarketOddsDisplay markets={match.markets || []} />
          </CardContent>
        </Card>
      </Grid>

      {/* Additional Information */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SoccerIcon /> Match Information
              </Typography>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderAdditionalInfo()}
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(match.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(match.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MatchView;
