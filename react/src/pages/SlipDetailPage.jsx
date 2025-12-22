import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Fade,
  Skeleton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Stack,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp,
  AttachMoney,
  Warning,
  Sports,
  Info,
} from "@mui/icons-material";
import slipApi from "../services/api/slipApi";
import SlipDetailModal from "../components/matches/SlipDetailModal";
import EditSlipModal from "../components/slip/EditSlipModal";

const SlipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [availableMatches, setAvailableMatches] = useState([]);

  useEffect(() => {
    fetchSlipDetails();
    fetchAvailableMatches();
  }, [id]);

  const fetchSlipDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await slipApi.getMasterSlip(id);

      if (data && typeof data === "object") {
        const slipData = data.data || data.slip || data;

        if (slipData.matches && !Array.isArray(slipData.matches)) {
          slipData.matches = [];
        }

        setSlip(slipData);
      } else {
        setSlip(null);
        setError("Invalid slip data format received");
      }
    } catch (err) {
      console.error("Error fetching slip details:", err);
      setError("Failed to load slip details. Please try again.");
      showSnackbar("Failed to load slip details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMatches = async () => {
    try {
      const data = await slipApi.getAvailableMatches();
      setAvailableMatches(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
    }
  };

  const handleSaveSlip = async (updatedSlip) => {
    try {
      await slipApi.updateSlip(id, updatedSlip);
      setSlip(updatedSlip);
      showSnackbar("Slip updated successfully", "success");
    } catch (err) {
      console.error("Error updating slip:", err);
      showSnackbar("Failed to update slip", "error");
    }
  };

  const handleRunAnalysis = async () => {
    try {
      await slipApi.runSlipAnalysis(id);
      showSnackbar("Analysis started. Results will update shortly.", "info");
      setTimeout(fetchSlipDetails, 3000);
    } catch (err) {
      showSnackbar("Failed to start analysis", "error");
    }
  };

  const handleDeleteSlip = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this slip? This action cannot be undone."
      )
    ) {
      try {
        await slipApi.deleteSlip(id);
        showSnackbar("Slip deleted successfully", "success");
        setTimeout(() => navigate("/slips"), 1500);
      } catch (err) {
        showSnackbar("Failed to delete slip", "error");
      }
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
      case "low risk":
        return "success";
      case "medium":
      case "medium risk":
        return "warning";
      case "high":
      case "high risk":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !slip) {
    return (
      <ErrorState
        error={error}
        onRetry={fetchSlipDetails}
        navigate={navigate}
      />
    );
  }

  return (
    <Container maxWidth="lg" className="main-content">
      <Fade in={true}>
        <Box>
          {/* Header with back button */}
          <HeaderSection onBack={() => navigate(-1)} />

          {/* Main slip info card */}
          <SlipInfoCard
            slip={slip}
            onViewDetails={() => setModalOpen(true)}
            getRiskColor={getRiskColor}
          />

          {/* Matches table */}
          <MatchesTable slip={slip} />

          {/* Action buttons */}
          <ActionButtons
            onEdit={() => setEditModalOpen(true)}
            onAnalyze={handleRunAnalysis}
            onDelete={handleDeleteSlip}
          />
        </Box>
      </Fade>

      {/* Slip Detail Modal */}
      <SlipDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slip={slip}
      />

      {/* Edit Slip Modal */}
      <EditSlipModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slip={slip}
        onSave={handleSaveSlip}
        availableMatches={availableMatches}
      />

      {/* Snackbar for notifications */}
      <NotificationSnackbar snackbar={snackbar} onClose={handleSnackbarClose} />
    </Container>
  );
};

// Sub-components for better organization

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="text" width={120} height={40} sx={{ mb: 3 }} />
    <Skeleton
      variant="rectangular"
      height={200}
      sx={{ borderRadius: 3, mb: 3 }}
    />
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
  </Box>
);

const ErrorState = ({ error, onRetry, navigate }) => (
  <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
      sx={{ mb: 3 }}
    >
      {error || "Failed to load slip details"}
    </Alert>
    <Button
      variant="contained"
      onClick={() => navigate("/slips")}
      sx={{ textTransform: "none" }}
    >
      Back to Slips
    </Button>
  </Paper>
);

const HeaderSection = ({ onBack }) => (
  <Button
    startIcon={<BackIcon />}
    onClick={onBack}
    sx={{ mb: 3, color: "#636366", textTransform: "none" }}
  >
    Back to Dashboard
  </Button>
);

const SlipInfoCard = ({ slip, onViewDetails, getRiskColor }) => (
  <Paper
    sx={{
      p: 4,
      mb: 4,
      borderRadius: 3,
      background:
        "linear-gradient(135deg, rgba(123, 31, 162, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
      border: "1px solid rgba(156, 39, 176, 0.1)",
    }}
  >
    <Grid container spacing={3} alignItems="center">
      <Grid item xs={12} md={8}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1C1C1E" }}>
            {slip.name || "Unnamed Slip"}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {slip.status && (
              <Chip
                label={slip.status}
                sx={{
                  bgcolor:
                    slip.status === "Won"
                      ? "success.main"
                      : slip.status === "Lost"
                        ? "error.main"
                        : slip.status === "Pending"
                          ? "warning.main"
                          : "primary.main",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}
            {slip.risk_level && (
              <Chip
                label={slip.risk_level}
                color={getRiskColor(slip.risk_level)}
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        <Typography variant="body1" sx={{ color: "#636366", mb: 2 }}>
          Analyzed on{" "}
          {slip.created_at
            ? new Date(slip.created_at).toLocaleDateString()
            : "N/A"}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={onViewDetails}
          sx={{ textTransform: "none" }}
        >
          View Detailed Analysis
        </Button>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            COMBINED ODDS
          </Typography>
          <Typography
            variant="h2"
            sx={{ color: "primary.main", fontWeight: 900, mb: 1 }}
          >
            {slip.total_odds ? slip.total_odds.toFixed(2) : "N/A"}
          </Typography>

          {slip.confidence_score && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
              >
                Confidence: {slip.confidence_score}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={slip.confidence_score}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      slip.confidence_score > 75
                        ? "success.main"
                        : slip.confidence_score > 50
                          ? "warning.main"
                          : "error.main",
                  },
                }}
              />
            </Box>
          )}
        </Card>
      </Grid>
    </Grid>
  </Paper>
);

const MatchesTable = ({ slip }) => (
  <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
    <Table>
      <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Match
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Market
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Prediction
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Confidence
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, color: "#636366" }}>
            Odds
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {slip.matches?.length > 0 ? (
          slip.matches.map((match, idx) => (
            <TableRow key={idx} hover>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  {match.home_team} vs {match.away_team}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {match.league} •{" "}
                  {match.match_date
                    ? new Date(match.match_date).toLocaleDateString()
                    : "Date N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={match.market_name || "Market"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={match.outcome || "N/A"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(106, 27, 154, 0.1)",
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell>
                {match.confidence && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 6,
                        bgcolor: "rgba(0,0,0,0.1)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${match.confidence}%`,
                          height: "100%",
                          bgcolor:
                            match.confidence > 75
                              ? "success.main"
                              : match.confidence > 50
                                ? "warning.main"
                                : "error.main",
                        }}
                      />
                    </Box>
                    <Typography variant="caption">
                      {match.confidence}%
                    </Typography>
                  </Box>
                )}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, fontSize: "1.1rem" }}
              >
                {match.odds ? parseFloat(match.odds).toFixed(2) : "N/A"}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
              <Sports
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No matches found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add matches to this slip to see them here
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
);

const ActionButtons = ({ onEdit, onAnalyze, onDelete }) => (
  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
    <Button
      variant="outlined"
      startIcon={<DeleteIcon />}
      onClick={onDelete}
      sx={{ textTransform: "none" }}
      color="error"
    >
      Delete
    </Button>
    <Button
      variant="outlined"
      startIcon={<RefreshIcon />}
      onClick={onAnalyze}
      sx={{ textTransform: "none" }}
    >
      Re-run Analysis
    </Button>
    <Button
      variant="contained"
      startIcon={<EditIcon />}
      onClick={onEdit}
      sx={{ textTransform: "none" }}
    >
      Edit Slip
    </Button>
  </Box>
);

const NotificationSnackbar = ({ snackbar, onClose }) => (
  <Snackbar
    open={snackbar.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  >
    <Alert
      onClose={onClose}
      severity={snackbar.severity}
      sx={{ width: "100%" }}
    >
      {snackbar.message}
    </Alert>
  </Snackbar>
);

export default SlipDetailPage;
