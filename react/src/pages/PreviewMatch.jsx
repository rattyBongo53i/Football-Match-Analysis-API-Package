// frontend/src/pages/PreviewMatches.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import {
  Edit,
  Delete,
  Save,
  Cancel,
  Send,
  Download,
  CloudUpload,
  Visibility,
  VisibilityOff,
  ExpandMore,
  ContentCopy,
  FileCopy,
  AttachMoney,
  Casino,
  EditNote,
  Preview,
  SmartToy,
} from "@mui/icons-material";

// Memoized helper components
const MatchCard = memo(function MatchCard({ match, index, onEdit, onRemove }) {
  const {
    home_team,
    away_team,
    league,
    head_to_head_summary,
    home_form = [],
    away_form = [],
    odds = {},
  } = match;

  return (
    <Card elevation={3} sx={{ mb: 2, bgcolor: "background.paper" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {home_team || "Home"} vs {away_team || "Away"}
            </Typography>
            <Chip
              label={league || "No league"}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`${Object.keys(odds).length} odds`}
              size="small"
              variant="outlined"
            />
          </Box>
          <Box>
            <Chip
              label={`H:${home_form.length} A:${away_form.length}`}
              size="small"
              color="info"
              variant="outlined"
            />
          </Box>
        </Box>

        {head_to_head_summary && (
          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{ fontStyle: "italic" }}
          >
            "
            {head_to_head_summary.length > 120
              ? `${head_to_head_summary.substring(0, 120)}...`
              : head_to_head_summary}
            "
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Home Form (Last {home_form.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {home_form.slice(0, 3).map((form, i) => (
                <Chip
                  key={i}
                  label={form.result || "?"}
                  size="small"
                  color={
                    form.outcome === "W"
                      ? "success"
                      : form.outcome === "L"
                      ? "error"
                      : "warning"
                  }
                  variant="outlined"
                />
              ))}
              {home_form.length > 3 && (
                <Chip label={`+${home_form.length - 3}`} size="small" />
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Away Form (Last {away_form.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {away_form.slice(0, 3).map((form, i) => (
                <Chip
                  key={i}
                  label={form.result || "?"}
                  size="small"
                  color={
                    form.outcome === "W"
                      ? "success"
                      : form.outcome === "L"
                      ? "error"
                      : "warning"
                  }
                  variant="outlined"
                />
              ))}
              {away_form.length > 3 && (
                <Chip label={`+${away_form.length - 3}`} size="small" />
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Key Odds
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
            {odds.home_win && (
              <Chip
                label={`H: ${odds.home_win}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {odds.draw && (
              <Chip label={`D: ${odds.draw}`} size="small" variant="outlined" />
            )}
            {odds.away_win && (
              <Chip
                label={`A: ${odds.away_win}`}
                size="small"
                variant="outlined"
              />
            )}
            {odds.over_2_5 && (
              <Chip
                label={`O2.5: ${odds.over_2_5}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
        <Tooltip title="Edit match">
          <IconButton
            size="small"
            onClick={() => onEdit(index)}
            color="primary"
          >
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove match">
          <IconButton
            size="small"
            onClick={() => onRemove(index)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
});

const EditMatchDialog = memo(function EditMatchDialog({
  open,
  match,
  onClose,
  onSave,
  index,
}) {
  const [editingMatch, setEditingMatch] = useState(match);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open) {
      setEditingMatch(JSON.parse(JSON.stringify(match)));
    }
  }, [open, match]);

  const handleChange = useCallback((field, value) => {
    setEditingMatch((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleNestedChange = useCallback((parent, field, value) => {
    setEditingMatch((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(editingMatch);
  }, [editingMatch, onSave]);

  const handleOddsJsonChange = useCallback(
    (e) => {
      try {
        const parsed = JSON.parse(e.target.value);
        handleChange("odds", parsed);
      } catch (err) {
        // Keep invalid JSON for user to fix
      }
    },
    [handleChange]
  );

  const tabs = useMemo(
    () => [
      { label: "Basic", value: "basic" },
      { label: "Forms", value: "forms" },
      { label: "Odds", value: "odds" },
      { label: "JSON", value: "json" },
    ],
    []
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "background.paper" },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EditNote color="primary" />
        Edit Match #{index + 1}
      </DialogTitle>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Home Team"
                value={editingMatch.home_team || ""}
                onChange={(e) => handleChange("home_team", e.target.value)}
                margin="normal"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Away Team"
                value={editingMatch.away_team || ""}
                onChange={(e) => handleChange("away_team", e.target.value)}
                margin="normal"
                color="primary"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="League"
                value={editingMatch.league || ""}
                onChange={(e) => handleChange("league", e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Head-to-Head Summary"
                multiline
                rows={3}
                value={editingMatch.head_to_head_summary || ""}
                onChange={(e) =>
                  handleChange("head_to_head_summary", e.target.value)
                }
                margin="normal"
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                Home Team Form
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {editingMatch.home_form?.map((form, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      label="Opponent"
                      value={form.opponent || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.home_form];
                        newForm[i] = {
                          ...newForm[i],
                          opponent: e.target.value,
                        };
                        handleChange("home_form", newForm);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Score"
                      value={form.result || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.home_form];
                        newForm[i] = { ...newForm[i], result: e.target.value };
                        handleChange("home_form", newForm);
                      }}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      size="small"
                      label="Outcome"
                      value={form.outcome || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.home_form];
                        newForm[i] = { ...newForm[i], outcome: e.target.value };
                        handleChange("home_form", newForm);
                      }}
                      sx={{ width: 100 }}
                    />
                  </Box>
                ))}
                <Button
                  size="small"
                  onClick={() => {
                    const newForm = [
                      ...(editingMatch.home_form || []),
                      { opponent: "", result: "", outcome: "" },
                    ];
                    handleChange("home_form", newForm);
                  }}
                >
                  Add Match
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom color="secondary">
                Away Team Form
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {editingMatch.away_form?.map((form, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      label="Opponent"
                      value={form.opponent || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.away_form];
                        newForm[i] = {
                          ...newForm[i],
                          opponent: e.target.value,
                        };
                        handleChange("away_form", newForm);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Score"
                      value={form.result || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.away_form];
                        newForm[i] = { ...newForm[i], result: e.target.value };
                        handleChange("away_form", newForm);
                      }}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      size="small"
                      label="Outcome"
                      value={form.outcome || ""}
                      onChange={(e) => {
                        const newForm = [...editingMatch.away_form];
                        newForm[i] = { ...newForm[i], outcome: e.target.value };
                        handleChange("away_form", newForm);
                      }}
                      sx={{ width: 100 }}
                    />
                  </Box>
                ))}
                <Button
                  size="small"
                  onClick={() => {
                    const newForm = [
                      ...(editingMatch.away_form || []),
                      { opponent: "", result: "", outcome: "" },
                    ];
                    handleChange("away_form", newForm);
                  }}
                >
                  Add Match
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {Object.entries(editingMatch.odds || {}).map(([market, value]) => (
              <Grid item xs={12} sm={6} md={4} key={market}>
                <TextField
                  fullWidth
                  label={market.replace(/_/g, " ")}
                  type="number"
                  value={value || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "odds",
                      market,
                      parseFloat(e.target.value)
                    )
                  }
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
            {Object.keys(editingMatch.odds || {}).length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No odds added yet. Add odds in the JSON tab or through the
                  match form.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {activeTab === 3 && (
          <TextField
            fullWidth
            multiline
            rows={12}
            value={JSON.stringify(editingMatch, null, 2)}
            onChange={handleOddsJsonChange}
            sx={{ fontFamily: "monospace" }}
            error={(() => {
              try {
                JSON.parse(JSON.stringify(editingMatch));
                return false;
              } catch {
                return true;
              }
            })()}
            helperText={(() => {
              try {
                JSON.parse(JSON.stringify(editingMatch));
                return "Valid JSON";
              } catch (err) {
                return "Invalid JSON: " + err.message;
              }
            })()}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" startIcon={<Cancel />}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          startIcon={<Save />}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const PreviewMatches = memo(function PreviewMatches({
  matches = [],
  onUpdateMatches,
}) {
  const [localMatches, setLocalMatches] = useState(matches);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [sending, setSending] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [generateCount, setGenerateCount] = useState(100);
  const [bankroll, setBankroll] = useState(40);

  useEffect(() => {
    setLocalMatches(matches || []);
  }, [matches]);

  const syncUp = useCallback(
    (updated) => {
      setLocalMatches(updated);
      if (typeof onUpdateMatches === "function") onUpdateMatches(updated);
    },
    [onUpdateMatches]
  );

  const removeMatch = useCallback(
    (idx) => {
      const updated = localMatches.filter((_, i) => i !== idx);
      syncUp(updated);
      showSnackbar("Match removed", "info");
    },
    [localMatches, syncUp]
  );

  const startEdit = useCallback((idx) => {
    setEditingIndex(idx);
  }, []);

  const saveEdit = useCallback(
    (updatedMatch) => {
      const updated = [...localMatches];
      updated[editingIndex] = updatedMatch;
      syncUp(updated);
      setEditingIndex(null);
      showSnackbar("Match updated", "success");
    },
    [localMatches, editingIndex, syncUp]
  );

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const submitToBackend = useCallback(async () => {
    setError(null);
    setResponseData(null);

    if (!localMatches.length) {
      setError("No matches to send.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        matches: localMatches,
        count: parseInt(generateCount, 10),
        bankroll: parseFloat(bankroll),
      };

      const res = await axios.post(
        (process.env.REACT_APP_NODE_URL || "http://localhost:4000") +
          "/generate",
        payload,
        { timeout: 120000 }
      );

      setResponseData(res.data);
      showSnackbar("Betting slips generated successfully!", "success");
    } catch (err) {
      console.error(err);
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Unknown error while calling backend";
      setError(errorMsg);
      showSnackbar(errorMsg, "error");
    } finally {
      setSending(false);
    }
  }, [localMatches, generateCount, bankroll]);

  const handleSaveLocally = useCallback(() => {
    localStorage.setItem("matches_backup", JSON.stringify(localMatches));
    showSnackbar("Matches saved to localStorage", "success");
  }, [localMatches]);

  const handleDownloadJson = useCallback(() => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(localMatches, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute(
      "download",
      `matches_${new Date().toISOString().split("T")[0]}.json`
    );
    dlAnchor.click();
    showSnackbar("JSON file downloaded", "success");
  }, [localMatches]);

  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(localMatches, null, 2));
    showSnackbar("JSON copied to clipboard", "success");
  }, [localMatches]);

  const stats = useMemo(
    () => ({
      totalMatches: localMatches.length,
      totalOdds: localMatches.reduce(
        (sum, match) => sum + Object.keys(match.odds || {}).length,
        0
      ),
      avgOddsPerMatch:
        localMatches.length > 0
          ? (
              localMatches.reduce(
                (sum, match) => sum + Object.keys(match.odds || {}).length,
                0
              ) / localMatches.length
            ).toFixed(1)
          : 0,
      totalFormEntries: localMatches.reduce(
        (sum, match) =>
          sum + (match.home_form?.length || 0) + (match.away_form?.length || 0),
        0
      ),
    }),
    [localMatches]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Preview color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Preview & Send Matches
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Review, edit, and generate betting slips
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`${stats.totalMatches} matches`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${stats.totalOdds} odds`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Configuration Panel */}
        <Paper
          elevation={1}
          sx={{ p: 3, mb: 3, bgcolor: "background.default" }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Casino color="secondary" />
            Generator Configuration
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Slips to Generate"
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                InputProps={{
                  inputProps: { min: 10, max: 2000 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SmartToy fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Number of betting slips (10-2000)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bankroll ($)"
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
                InputProps={{
                  inputProps: { min: 1, step: 1 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Available betting budget"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  height: "100%",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setShowJson(!showJson)}
                  startIcon={showJson ? <VisibilityOff /> : <Visibility />}
                >
                  {showJson ? "Hide JSON" : "Show JSON"}
                </Button>
                {showJson && (
                  <Tooltip title="Copy JSON">
                    <IconButton onClick={handleCopyJson} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Matches List */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
          >
            <FileCopy color="primary" />
            Matches ({localMatches.length})
          </Typography>

          {localMatches.length === 0 ? (
            <Paper
              sx={{ p: 4, textAlign: "center", bgcolor: "background.default" }}
            >
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No matches added yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Go to Match Entry to add matches.
              </Typography>
            </Paper>
          ) : (
            <Box>
              {localMatches.map((match, idx) => (
                <MatchCard
                  key={idx}
                  match={match}
                  index={idx}
                  onEdit={startEdit}
                  onRemove={removeMatch}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* JSON Preview */}
        {showJson && localMatches.length > 0 && (
          <Accordion defaultExpanded sx={{ mb: 4 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Visibility color="action" />
                JSON Preview
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                <pre style={{ margin: 0, fontSize: "0.75rem" }}>
                  {JSON.stringify(localMatches, null, 2)}
                </pre>
              </Paper>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Button
            variant="contained"
            onClick={submitToBackend}
            disabled={sending || localMatches.length === 0}
            startIcon={sending ? <CircularProgress size={20} /> : <Send />}
            sx={{
              bgcolor: "secondary.main",
              "&:hover": { bgcolor: "secondary.dark" },
              minWidth: 200,
            }}
          >
            {sending ? "Generating..." : "Generate Betting Slips"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleSaveLocally}
            startIcon={<CloudUpload />}
            disabled={localMatches.length === 0}
          >
            Save to Browser
          </Button>

          <Button
            variant="outlined"
            onClick={handleDownloadJson}
            startIcon={<Download />}
            disabled={localMatches.length === 0}
          >
            Download JSON
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Backend Error
            </Typography>
            {error}
          </Alert>
        )}

        {/* Response Display */}
        {responseData && (
          <Paper
            elevation={3}
            sx={{ p: 3, mt: 3, bgcolor: "background.paper" }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SmartToy color="success" />
              Generator Results
            </Typography>

            {responseData.summary && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1">{responseData.summary}</Typography>
              </Alert>
            )}

            {responseData.betting_slips && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Generated Betting Slips ({responseData.betting_slips.length})
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 300 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Matches</TableCell>
                        <TableCell>Odds</TableCell>
                        <TableCell>Stake</TableCell>
                        <TableCell>Potential Win</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {responseData.betting_slips
                        .slice(0, 10)
                        .map((slip, idx) => (
                          <TableRow key={idx}>
                            <TableCell>#{idx + 1}</TableCell>
                            <TableCell>{slip.matches?.length || 0}</TableCell>
                            <TableCell>{slip.total_odds?.toFixed(2)}</TableCell>
                            <TableCell>${slip.stake?.toFixed(2)}</TableCell>
                            <TableCell>
                              ${slip.potential_win?.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2">View Full Response</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, bgcolor: "background.default" }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}
      </Paper>

      {/* Edit Dialog */}
      {editingIndex !== null && localMatches[editingIndex] && (
        <EditMatchDialog
          open={editingIndex !== null}
          match={localMatches[editingIndex]}
          index={editingIndex}
          onClose={() => setEditingIndex(null)}
          onSave={saveEdit}
        />
      )}

      {/* Snackbar */}
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
});

export default PreviewMatches;
