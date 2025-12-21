import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  ReceiptLong as SlipIcon,
  ListAlt as ListIcon,
  TrendingUp as TrendIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import slipApi from "../services/api/slipApi";
import AddToBetslipButton from "../components/betslip/AddToBetslipButton";
import SlipCard from "../components/slip/SlipCard";
import EmptyState from "../components/slip/EmptyStage";
import "./SlipsPage.css";

const SlipsPage = () => {
  const [slips, setSlips] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch user's slips
  const fetchSlips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await slipApi.getMasterSlips();
      if (response.success) {
        setSlips(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch slips:", err);
      setError("Failed to load your slips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available matches for adding to new slips
  const fetchMatches = async () => {
    setMatchesLoading(true);
    try {
      const response = await slipApi.getAllMatches({
        limit: 20,
        status: "upcoming",
      });
      if (response.success) {
        setMatches(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setMatchesLoading(false);
    }
  };

  // Create a new slip
  const handleCreateSlip = async () => {
    try {
      const response = await slipApi.createSlip({
        name: `Slip ${new Date().toLocaleDateString()}`,
        stake: 100,
        currency: "USD",
      });

      if (response.success) {
        navigate(`/slip/${response.data.slip_id}`);
      }
    } catch (err) {
      console.error("Failed to create slip:", err);
      setError("Failed to create new slip. Please try again.");
    }
  };

  // Delete a slip
  const handleDeleteSlip = async (slipId, slipName) => {
    if (!window.confirm(`Are you sure you want to delete "${slipName}"?`))
      return;

    try {
      const response = await slipApi.deleteSlip(slipId);
      if (response.success) {
        setSlips(slips.filter((slip) => slip.id !== slipId));
      }
    } catch (err) {
      console.error("Failed to delete slip:", err);
      setError("Failed to delete slip. Please try again.");
    }
  };

  useEffect(() => {
    fetchSlips();
    if (activeTab === 1) {
      fetchMatches();
    }
  }, [activeTab]);

  // Calculate statistics
  const stats = {
    totalSlips: slips.length,
    activeSlips: slips.filter((s) => s.status === "active").length,
    completedSlips: slips.filter((s) => s.status === "completed").length,
    totalMatches: slips.reduce(
      (sum, slip) => sum + (slip.matches_count || 0),
      0
    ),
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <SlipIcon fontSize="large" color="primary" />
            My Slips
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSlip}
            sx={{ borderRadius: 2 }}
          >
            Create New Slip
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your betting slips, create new accumulators, and track your
          predictions.
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" color="primary.main">
                {stats.totalSlips}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Slips
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" color="success.main">
                {stats.activeSlips}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" color="info.main">
                {stats.completedSlips}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" color="warning.main">
                {stats.totalMatches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<ListIcon />}
            label={`My Slips (${slips.length})`}
            iconPosition="start"
          />
          <Tab icon={<SoccerIcon />} label="Add Matches" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 ? (
          // Slips List Tab
          <Box>
            {loading ? (
              // Loading skeletons
              <Grid container spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={12} md={6} lg={4} key={i}>
                    <Skeleton
                      variant="rectangular"
                      height={200}
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : slips.length === 0 ? (
              // Empty state
              <EmptyState onCreateSlip={handleCreateSlip} />
            ) : (
              // Slips grid
              <Grid container spacing={3}>
                {slips.map((slip) => (
                  <Grid item xs={12} md={6} lg={4} key={slip.id}>
                    <SlipCard
                      slip={slip}
                      onView={() => navigate(`/slip/${slip.id}`)}
                      onDelete={() => handleDeleteSlip(slip.id, slip.name)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          // Add Matches Tab
          <Box>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SoccerIcon /> Available Matches
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select matches to add to a new or existing slip. Click "Add to
                Slip" to begin.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchMatches}
                disabled={matchesLoading}
                sx={{ mb: 2 }}
              >
                Refresh Matches
              </Button>
            </Paper>

            {matchesLoading ? (
              // Matches loading
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} key={i}>
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : matches.length === 0 ? (
              <Alert severity="info">
                No matches available. Please try refreshing or check back later.
              </Alert>
            ) : (
              // Matches list
              <Grid container spacing={2}>
                {matches.map((match) => (
                  <Grid item xs={12} key={match.id}>
                    <MatchCard match={match} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

// Match Card Component (for Add Matches tab)
const MatchCard = ({ match }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 2, "&:hover": { boxShadow: 6 } }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SoccerIcon color="action" />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {match.home_team} vs {match.away_team}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {match.league} • {formatDate(match.match_date)}
              </Typography>
              {match.status && (
                <Chip
                  label={match.status}
                  size="small"
                  color={
                    match.status === "completed"
                      ? "success"
                      : match.status === "live"
                        ? "error"
                        : "default"
                  }
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Hide Details" : "Show Details"}
            </Button>
            <AddToBetslipButton
              match={match}
              size="small"
              variant="contained"
            />
          </Box>
        </Grid>
      </Grid>

      {expanded && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available Markets:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {match.markets?.slice(0, 5).map((market, idx) => (
              <Chip
                key={idx}
                label={`${market.name}: ${market.home_odds?.toFixed(2)}/${market.draw_odds?.toFixed(2)}/${market.away_odds?.toFixed(2)}`}
                size="small"
                variant="outlined"
              />
            ))}
            {match.markets?.length > 5 && (
              <Chip label={`+${match.markets.length - 5} more`} size="small" />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SlipsPage;
