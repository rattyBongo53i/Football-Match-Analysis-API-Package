import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  useTheme,
} from "@mui/material";
import {
  AddCircle,
  ContentCopy,
  Delete,
  Send,
  Refresh,
  SportsSoccer,
  TrendingUp,
  History,
  CloudUpload,
} from "@mui/icons-material";
import EnhancedMatchForm from "../components/match/EnhancedMatchForm";
import { matchAPI, checkHealth } from "../services/api";

export default function MatchEntry() {
  const [matches, setMatches] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [teamStats, setTeamStats] = useState({});
  
  const theme = useTheme();

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
    fetchTeamStats();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const health = await checkHealth();
      if (health) {
        setBackendConnected(true);
        showSnackbar("Backend connected successfully", "success");
      } else {
        setBackendConnected(false);
        showSnackbar("Backend health check failed", "warning");
      }
    } catch (error) {
      setBackendConnected(false);
      showSnackbar("Cannot connect to backend", "error");
    }
  };

  const fetchTeamStats = async () => {
    try {
      const response = await matchAPI.getTeamStats();
      setTeamStats(response.data || {});
    } catch (error) {
      console.error("Error fetching team stats:", error);
    }
  };

  const handleAddMatch = useCallback(
    async (match) => {
      // Generate unique ID for local tracking
      const matchWithId = {
        ...match,
        localId: Date.now(),
        created_at: new Date().toISOString(),
        for_ml_training: true,
      };

      setMatches((prev) => [...prev, matchWithId]);
      showSnackbar("Match added to local list!", "success");

      // Auto-save to backend if connected
      if (backendConnected) {
        try {
          setLoading(true);
          const response = await matchAPI.saveMatch(matchWithId);
          if (response.data) {
            const savedMatch = response.data;
            setMatches((prev) =>
              prev.map((m) =>
                m.localId === matchWithId.localId
                  ? { ...m, id: savedMatch.id, saved: true }
                  : m
              )
            );
            showSnackbar("Match saved to backend!", "success");
          }
        } catch (error) {
          console.error("Error saving to backend:", error);
          showSnackbar("Saved locally (backend save failed)", "warning");
        } finally {
          setLoading(false);
        }
      }
    },
    [backendConnected]
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDeleteMatch = useCallback(
    async (index) => {
      const matchToDelete = matches[index];
      const updatedMatches = matches.filter((_, i) => i !== index);
      setMatches(updatedMatches);
      showSnackbar("Match removed from local list", "info");

      if (backendConnected && matchToDelete && matchToDelete.id) {
        try {
          await matchAPI.deleteMatch(matchToDelete.id);
          showSnackbar("Match deleted from backend", "success");
        } catch (error) {
          console.error("Error deleting from backend:", error);
          showSnackbar("Deleted locally (backend delete failed)", "warning");
        }
      }
    },
    [matches, backendConnected]
  );

  const handleSendToBackend = async () => {
    if (matches.length === 0) {
      showSnackbar("No matches to send", "warning");
      return;
    }

    try {
      setLoading(true);
      showSnackbar("Sending matches to backend...", "info");

      const unsavedMatches = matches.filter((m) => !m.saved);
      let successCount = 0;

      for (const match of unsavedMatches) {
        try {
          const response = await matchAPI.saveMatch(match);
          if (response.data && response.data.id) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error saving match:`, error);
        }
      }

      // Refresh matches list
      const matchesData = await matchAPI.getMatches();
      if (Array.isArray(matchesData)) {
        setMatches(matchesData.map((m) => ({ ...m, saved: true })));
      }

      showSnackbar(
        `Successfully sent ${successCount} matches to backend`,
        "success"
      );
    } catch (error) {
      console.error("Error sending to backend:", error);
      showSnackbar("Failed to send matches to backend", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = useCallback(() => {
    const jsonData = matches.map(({ localId, saved, ...match }) => match);
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    showSnackbar("JSON copied to clipboard!", "success");
  }, [matches]);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Statistics
  const stats = useMemo(
    () => ({
      totalMatches: matches.length,
      savedMatches: matches.filter((m) => m.saved).length,
      unsavedMatches: matches.filter((m) => !m.saved).length,
      homeTeams: [...new Set(matches.map((m) => m.home_team))].length,
      awayTeams: [...new Set(matches.map((m) => m.away_team))].length,
      leagues: [...new Set(matches.map((m) => m.league))].length,
    }),
    [matches]
  );

  // Enhanced tab styles - ensure Tab labels/ icons are visible
  const tabStyles = {
    root: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
      // ensure tab labels are visible (explicit text color)
      "& .MuiTab-root": {
        color: theme.palette.text.primary,
        minHeight: 48,
        fontWeight: 600,
        textTransform: "none",
        fontSize: "0.9rem",
      },
      "& .MuiTabs-indicator": {
        backgroundColor: theme.palette.primary.main,
        height: 3,
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <SportsSoccer color="primary" sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Match Data Collector
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Collect comprehensive match data for ML predictions and betting
              analysis
            </Typography>
          </Box>
        </Box>

        {/* Stats Bar */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {stats.totalMatches}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Matches
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={stats.unsavedMatches > 0 ? "warning" : "success"}
                >
                  {stats.savedMatches}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Saved to Backend
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info">
                  {stats.homeTeams}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unique Home Teams
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="secondary">
                  {stats.leagues}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Different Leagues
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Connection Status */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3,
          backgroundColor: backendConnected 
            ? theme.palette.success.light + '20' 
            : theme.palette.error.light + '20',
          borderLeft: `4px solid ${backendConnected ? theme.palette.success.main : theme.palette.error.main}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              label={backendConnected ? "Backend Connected" : "Backend Offline"}
              color={backendConnected ? "success" : "error"}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {backendConnected
                ? "Ready for ML processing"
                : "Working in local mode"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              startIcon={<Refresh />}
              onClick={checkBackendConnection}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Check Connection
            </Button>

            {stats.unsavedMatches > 0 && backendConnected && (
              <Button
                startIcon={<CloudUpload />}
                onClick={handleSendToBackend}
                variant="contained"
                color="primary"
                size="small"
                disabled={loading}
              >
                Save {stats.unsavedMatches} to Backend
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          aria-label="Match entry tabs"
          sx={tabStyles.root}
          indicatorColor="primary"
          textColor="primary"
          TabIndicatorProps={{
            style: {
              backgroundColor: theme.palette.primary.main,
              height: 3,
            }
          }}
        >
          <Tab 
            icon={<AddCircle />} 
            iconPosition="start"
            label="Enter Match" 
            sx={{ 
              py: 1.5,
              color: theme.palette.text.primary,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light + '20',
              }
            }}
          />
          <Tab 
            icon={<History />} 
            iconPosition="start"
            label="Match List" 
            sx={{ 
              py: 1.5,
              color: theme.palette.text.primary,
              '&.Mui-selected': {
                backgroundColor: theme.palette.secondary.light + '20',
              }
            }}
          />
          <Tab 
            icon={<TrendingUp />} 
            iconPosition="start"
            label="Statistics" 
            sx={{ 
              py: 1.5,
              color: theme.palette.text.primary,
              '&.Mui-selected': {
                backgroundColor: theme.palette.info.light + '20',
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 2,
            border: `1px solid ${theme.palette.primary.light}30`,
            background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AddCircle color="primary" sx={{ mr: 2, fontSize: 32 }} />
            <Typography
              variant="h5"
              sx={{ 
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              Enter Comprehensive Match Data
            </Typography>
          </Box>
          <EnhancedMatchForm onSubmit={handleAddMatch} />
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.secondary.light}30`,
            background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            minHeight: 400,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <History color="secondary" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: "secondary.main", fontWeight: 600 }}>
              Matches Entered ({stats.totalMatches})
            </Typography>
          </Box>
          {/* ... rest unchanged ... */}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.info.light}30`,
            background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            minHeight: 400,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp color="info" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: "info.main", fontWeight: 600 }}>
              Data Statistics
            </Typography>
          </Box>
          {/* ... rest unchanged ... */}
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}