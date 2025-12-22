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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import slipApi from "../services/api/slipApi";
import SlipCard from "../components/slip/SlipCard";
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
    <Container maxWidth="xl" className="main-content">
      <Fade in={true} timeout={800}>
        <Box>
          <Box
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#1C1C1E",
                  letterSpacing: "-0.02em",
                }}
              >
                Betting Intelligence
              </Typography>
              <Typography variant="body1" sx={{ color: "#636366" }}>
                Manage your AI-analyzed slips and predictions
              </Typography>
            </Box>
            <Button
              variant="contained"
              className="purple-gradient"
              startIcon={<AddIcon />}
              onClick={() => navigate("/slips/new")}
              sx={{
                borderRadius: "14px",
                px: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              New Analysis
            </Button>
          </Box>

          <Box
            sx={{
              mb: 4,
              bgcolor: "rgba(0,0,0,0.04)",
              borderRadius: "16px",
              p: 0.5,
              display: "inline-flex",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                "& .MuiTabs-indicator": {
                  bgcolor: "white",
                  height: "100%",
                  borderRadius: "12px",
                  zIndex: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
                "& .MuiTab-root": {
                  zIndex: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 40,
                  borderRadius: "12px",
                  transition: "0.2s",
                },
              }}
            >
              <Tab label="All Slips" />
              <Tab label="High Confidence" />
              <Tab label="Recent" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
                    sx={{ borderRadius: "20px", bgcolor: "rgba(0,0,0,0.04)" }}
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
          sx={{ width: "100%", borderRadius: "12px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SlipsPage;
