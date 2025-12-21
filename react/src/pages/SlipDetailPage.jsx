import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Badge,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  ReceiptLong as SlipIcon,
  TrendingUp as TrendIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as DateIcon,
  BarChart as ChartIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import slipApi from "../services/api/slipApi";
import { useBetslip } from "../contexts/BetslipContext";
import AddToBetslipButton from "../components/betslip/AddToBetslipButton";
import GeneratedSlipsList from "../components/slip/GeneratedSlipsList";
import MatchSelectionDialog from "../components/slip/MatchSelectionDialog";
import "./SlipDetailPage.css";

const SlipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMatchToBetslip, isMatchInBetslip } = useBetslip();

  const [slip, setSlip] = useState(null);
  const [matches, setMatches] = useState([]);
  const [generatedSlips, setGeneratedSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [addMatchDialog, setAddMatchDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingSlip, setEditingSlip] = useState({});

  // Fetch slip details
  const fetchSlipDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch master slip details
      const slipResponse = await slipApi.getMasterSlip(id);
      if (slipResponse.success) {
        setSlip(slipResponse.data);
        setEditingSlip(slipResponse.data);
      }

      // Fetch matches in this slip
      const matchesResponse = await slipApi.getSlipMatches(id);
      if (matchesResponse.success) {
        setMatches(matchesResponse.data);
      }

      // Fetch generated slips
      const generatedResponse = await slipApi.getGeneratedSlips(id);
      if (generatedResponse.success) {
        setGeneratedSlips(generatedResponse.data);
      }
    } catch (err) {
      console.error("Failed to fetch slip details:", err);
      setError("Failed to load slip details. The slip may not exist.");
    } finally {
      setLoading(false);
    }
  };

  // Handle slip update
const handleUpdateSlip = async () => {
  try {
    const response = await slipApi.updateSlip(id, editingSlip);
    if (response.success) {
      // Merge the updated fields into the existing slip object
      setSlip((prevSlip) => ({
        ...prevSlip,
        ...response.data, // This updates name, stake, notes, updated_at, etc.
        // Preserve relations that weren't returned
        matches: prevSlip.matches,
        generatedSlips: prevSlip.generatedSlips,
        slipMatches: prevSlip.slipMatches,
        // Add any other relations your UI uses
      }));

      setEditDialog(false);
      setSuccess("Slip updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    }
  } catch (err) {
    console.error("Failed to update slip:", err);
    setError("Failed to update slip. Please try again.");
  }
};

  // Handle slip deletion
  const handleDeleteSlip = async () => {
    try {
      const response = await slipApi.deleteSlip(id);
      if (response.success) {
        navigate("/slips", {
          state: { message: "Slip deleted successfully" },
        });
      }
    } catch (err) {
      console.error("Failed to delete slip:", err);
      setError("Failed to delete slip. Please try again.");
    }
  };

  // Handle adding a match to slip
  const handleAddMatch = async (match) => {
    try {
      const response = await slipApi.addMatchToSlip(id, {
        match_id: match.id,
        market: match.markets?.[0]?.name || "1X2",
        selection: "home",
        odds: match.markets?.[0]?.home_odds || 1.85,
      });

      if (response.success) {
        // Update matches list
        setMatches((prev) => [...prev, match]);
        setAddMatchDialog(false);
        setSuccess(`Added ${match.home_team} vs ${match.away_team} to slip!`);
        setTimeout(() => setSuccess(null), 3000);

        // Also add to betslip context for UI consistency
        addMatchToBetslip(match);
      }
    } catch (err) {
      console.error("Failed to add match:", err);
      setError(err.response?.data?.message || "Failed to add match to slip.");
    }
  };

  // Handle removing a match from slip
  const handleRemoveMatch = async (matchId) => {
    if (!window.confirm("Remove this match from the slip?")) return;

    try {
      const response = await slipApi.removeMatchFromSlip(id, matchId);
      if (response.success) {
        setMatches(matches.filter((m) => m.id !== matchId));
        setSuccess("Match removed from slip!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Failed to remove match:", err);
      setError("Failed to remove match from slip.");
    }
  };

  // Handle running ML analysis
  const handleRunAnalysis = async () => {
    try {
      const response = await slipApi.runSlipAnalysis(id);
      if (response.success) {
        setSuccess("Analysis started! Generated slips will appear shortly.");
        // Poll for updates
        setTimeout(fetchSlipDetails, 2000);
      }
    } catch (err) {
      console.error("Failed to run analysis:", err);
      setError("Failed to start analysis. Please try again.");
    }
  };

  // Copy slip ID to clipboard
  const handleCopySlipId = () => {
    navigator.clipboard.writeText(id);
    setSuccess("Slip ID copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  useEffect(() => {
    fetchSlipDetails();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 2, mb: 3 }}
        />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (error && !slip) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate("/slips")}
        >
          Back to Slips
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const canRunAnalysis = matches.length >= 5 && matches.length <= 10;
  const progress = Math.min((matches.length / 10) * 100, 100);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/slips")}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SlipIcon /> {slip?.name || "Unnamed Slip"}
                <Chip
                  label={slip?.status}
                  color={getStatusColor(slip?.status)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
              >
                <DateIcon fontSize="small" /> Created{" "}
                {formatDate(slip?.created_at)}
                <Tooltip title="Copy Slip ID">
                  <IconButton size="small" onClick={handleCopySlipId}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" component="span">
                  ID: {id.substring(0, 8)}...
                </Typography>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialog(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialog(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h3" color="primary.main" align="center">
                {matches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Matches
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h3" color="secondary.main" align="center">
                {generatedSlips.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Generated Slips
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h3" color="success.main" align="center">
                ${slip?.stake || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Stake
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendIcon
                  sx={{
                    color: canRunAnalysis ? "success.main" : "warning.main",
                    mr: 1,
                  }}
                />
                <Typography
                  variant="h3"
                  color={canRunAnalysis ? "success.main" : "warning.main"}
                >
                  {canRunAnalysis ? "Ready" : "Setup"}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Analysis Status
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="body2">
              {matches.length}/10 matches added
            </Typography>
            <Typography
              variant="body2"
              color={canRunAnalysis ? "success.main" : "text.secondary"}
            >
              {canRunAnalysis
                ? "Ready for analysis!"
                : `Need ${5 - matches.length} more matches`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={canRunAnalysis ? "success" : "primary"}
            sx={{ height: 8, borderRadius: 4 }}
          />
          {!canRunAnalysis && matches.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Add {5 - matches.length} more match
              {5 - matches.length === 1 ? "" : "es"} to run ML analysis (5-10
              matches required).
            </Alert>
          )}
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Matches" icon={<SoccerIcon />} iconPosition="start" />
          <Tab
            label="Generated Slips"
            icon={<TrendIcon />}
            iconPosition="start"
          />
          <Tab label="Slip Details" icon={<SlipIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 ? (
          // Matches Tab
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Matches in Slip ({matches.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddMatchDialog(true)}
                  >
                    Add Match
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchSlipDetails}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {matches.length === 0 ? (
                <Alert severity="info">
                  No matches added yet. Click "Add Match" to start building your
                  slip.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Match</TableCell>
                        <TableCell>League</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Markets</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id} hover>
                          <TableCell>
                            <Typography fontWeight="bold">
                              {match.home_team} vs {match.away_team}
                            </Typography>
                            {match.home_score !== null &&
                              match.away_score !== null && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Score: {match.home_score} - {match.away_score}
                                </Typography>
                              )}
                          </TableCell>
                          <TableCell>{match.league}</TableCell>
                          <TableCell>{formatDate(match.match_date)}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {match.markets?.slice(0, 2).map((market, idx) => (
                                <Chip
                                  key={idx}
                                  label={market.name}
                                  size="small"
                                />
                              ))}
                              {match.markets?.length > 2 && (
                                <Chip
                                  label={`+${match.markets.length - 2}`}
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.status || "upcoming"}
                              size="small"
                              color={
                                match.status === "completed"
                                  ? "success"
                                  : match.status === "live"
                                    ? "error"
                                    : "default"
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "flex-end",
                              }}
                            >
                              <AddToBetslipButton
                                match={match}
                                size="small"
                                variant={
                                  isMatchInBetslip(match.id)
                                    ? "contained"
                                    : "outlined"
                                }
                              />
                              <Tooltip title="Remove from slip">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveMatch(match.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            {/* Analysis Button */}
            {matches.length > 0 && (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  Ready to Generate Predictions?
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Our ML engine will analyze these {matches.length} matches and
                  generate 100+ optimized betting slips.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<TrendIcon />}
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis}
                  sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                  {canRunAnalysis
                    ? "Run ML Analysis"
                    : `Need ${5 - matches.length} More Matches`}
                </Button>
              </Paper>
            )}
          </Box>
        ) : activeTab === 1 ? (
          // Generated Slips Tab
          <GeneratedSlipsList
            slips={generatedSlips}
            loading={loading}
            onRefresh={fetchSlipDetails}
          />
        ) : (
          // Slip Details Tab
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <SlipIcon /> Slip Information
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Slip Name
                    </Typography>
                    <Typography variant="body1">{slip?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={slip?.status}
                      color={getStatusColor(slip?.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Stake
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <MoneyIcon fontSize="small" /> ${slip?.stake}{" "}
                      {slip?.currency}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(slip?.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(slip?.updated_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Slip ID
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {id}
                    </Typography>
                  </Grid>
                </Grid>

                {slip?.notes && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, mt: 1, bgcolor: "background.default" }}
                    >
                      <Typography variant="body2">{slip.notes}</Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <ChartIcon /> Quick Actions
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddMatchDialog(true)}
                    fullWidth
                  >
                    Add More Matches
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<TrendIcon />}
                    onClick={handleRunAnalysis}
                    disabled={!canRunAnalysis}
                    fullWidth
                  >
                    {canRunAnalysis ? "Run Analysis" : "Need More Matches"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditDialog(true)}
                    fullWidth
                  >
                    Edit Slip Details
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialog(true)}
                    fullWidth
                  >
                    Delete This Slip
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchSlipDetails}
                    fullWidth
                  >
                    Refresh Data
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Analysis Requirements
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon
                      fontSize="small"
                      color={matches.length >= 5 ? "success" : "disabled"}
                    />
                    <Typography variant="body2">Minimum 5 matches</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon
                      fontSize="small"
                      color={matches.length <= 10 ? "success" : "disabled"}
                    />
                    <Typography variant="body2">Maximum 10 matches</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon
                      fontSize="small"
                      color={matches.length > 0 ? "success" : "disabled"}
                    />
                    <Typography variant="body2">
                      At least 1 market per match
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Slip Details</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Slip Name"
            fullWidth
            value={editingSlip.name || ""}
            onChange={(e) =>
              setEditingSlip({ ...editingSlip, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Stake"
            type="number"
            fullWidth
            value={editingSlip.stake || 0}
            onChange={(e) =>
              setEditingSlip({
                ...editingSlip,
                stake: parseFloat(e.target.value),
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Currency"
            select
            fullWidth
            value={editingSlip.currency || "USD"}
            onChange={(e) =>
              setEditingSlip({ ...editingSlip, currency: e.target.value })
            }
          >
            {["USD", "EUR", "GBP", "CAD", "AUD"].map((curr) => (
              <MenuItem key={curr} value={curr}>
                {curr}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateSlip} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Match Dialog */}
      <MatchSelectionDialog
        open={addMatchDialog}
        onClose={() => setAddMatchDialog(false)}
        onSelectMatch={handleAddMatch}
        existingMatchIds={matches.map((m) => m.id)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Slip</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All generated slips and data will be
            permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>"{slip?.name}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteSlip} color="error" variant="contained">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SlipDetailPage;
