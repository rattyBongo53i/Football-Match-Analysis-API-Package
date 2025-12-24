import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Skeleton,
  Tabs,
  Tab,
  Fade,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import slipApi from "../services/api/slipApi";
import SlipCard from "../components/slip/SlipCard";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/slip/EmptyStage";

const SlipsPage = () => {
  const navigate = useNavigate();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const data = await slipApi.getMasterSlips();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setSlips(data);
      } else if (data && typeof data === "object") {
        const possibleArray = data.slips || data.data || [];
        setSlips(Array.isArray(possibleArray) ? possibleArray : []);
      }
    } catch (err) {
      setError("Failed to load slips. Please try again later.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handler passed to SlipCard
  const handleViewSlip = (id) => {
    navigate(`/slips/${id}`);
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const filteredSlips = slips.filter((slip) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return (slip.confidence_score || 0) > 75;
    return true;
  });

  const sortedSlips = [...filteredSlips].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* AppBar for header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h5" fontWeight="bold">
            My Betting Slips
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton onClick={fetchSlips} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/slips/new")}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              New Slip
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Fade in={true} timeout={800}>
          <Box>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                mb: 3,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 1,
                "& .MuiTabs-indicator": { height: 4 },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  py: 2,
                },
              }}
            >
              <Tab label="All Slips" />
              <Tab label="High Confidence" />
              <Tab label="Recent" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <Grid item xs={12} md={6} lg={4} key={i}>
                    <Skeleton
                      variant="rectangular"
                      height={220}
                      sx={{ borderRadius: 2, bgcolor: "grey.100" }}
                    />
                  </Grid>
                ))
              ) : sortedSlips.length > 0 ? (
                sortedSlips.map((slip) => (
                  <Grid item xs={12} md={6} lg={4} key={slip.id}>
                    <SlipCard
                      slip={slip}
                      onView={() => handleViewSlip(slip.id)}
                    />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <EmptyState onCreateSlip={() => navigate("/slips/new")} />
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity="success"
            sx={{ width: "100%", borderRadius: 2, boxShadow: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default SlipsPage;
