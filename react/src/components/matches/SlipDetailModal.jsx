import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Grid,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  AttachMoney,
  Warning,
  Sports,
  Close,
  Info,
  CalendarToday,
  ShowChart,
  AccountBalanceWallet,
  Security,
} from "@mui/icons-material";

const SlipDetailModal = ({ open, onClose, slip }) => {
  const theme = useTheme();

  // Calculate derived values
  const calculatedValues = useMemo(() => {
    if (!slip) return {};

    const stake = slip.stake || 0;
    const totalOdds = slip.total_odds || 1;
    const confidence = slip.confidence_score || 0;

    // Calculate potential return
    const possibleReturn = stake * totalOdds;

    // Calculate potential profit
    const potentialProfit = possibleReturn - stake;

    // Calculate Expected Value
    const expectedValue = possibleReturn * (confidence / 100);

    // Determine risk level based on confidence
    const getRiskLevel = () => {
      if (confidence >= 75) return "Low Risk";
      if (confidence >= 50) return "Medium Risk";
      return "High Risk";
    };

    return {
      possibleReturn,
      potentialProfit,
      expectedValue,
      riskLevel: slip.risk_level || getRiskLevel(),
      stake,
      totalOdds,
      confidence,
      matchesCount: slip.matches?.length || 0,
      combinedOdds:
        slip.matches?.reduce(
          (total, match) => total * (parseFloat(match.odds) || 1),
          1
        ) || 1,
    };
  }, [slip]);

  if (!slip) return null;

  const getRiskColor = (risk) => {
    if (!risk) return "default";
    switch (risk.toLowerCase()) {
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

  const getConfidenceColor = (score) => {
    if (score >= 75) return "success";
    if (score >= 50) return "warning";
    return "error";
  };

  const formatCurrency = (amount, currency = slip.currency || "USD") => {
    if (!amount) return `$0.00`;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    });

    return formatter.format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)",
          backdropFilter: "blur(20px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          background:
            "linear-gradient(135deg, rgba(123, 31, 162, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="800">
              {slip.name || "Slip Analysis"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed analysis and predictions
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Key Metrics Summary */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: 2,
                border: "1px solid rgba(123, 31, 162, 0.1)",
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <ShowChart sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Confidence Score
                </Typography>
              </Box>
              <Typography variant="h3" color="primary" fontWeight="800">
                {calculatedValues.confidence.toFixed(0)}%
              </Typography>
              <Chip
                label={
                  calculatedValues.confidence >= 75
                    ? "High"
                    : calculatedValues.confidence >= 50
                      ? "Medium"
                      : "Low"
                }
                size="small"
                color={getConfidenceColor(calculatedValues.confidence)}
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: 2,
                border: "1px solid rgba(123, 31, 162, 0.1)",
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <TrendingUp sx={{ mr: 1, color: "secondary.main" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Combined Odds
                </Typography>
              </Box>
              <Typography variant="h3" color="secondary" fontWeight="800">
                {calculatedValues.totalOdds.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {calculatedValues.matchesCount} matches
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: 2,
                border: "1px solid rgba(123, 31, 162, 0.1)",
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <AccountBalanceWallet sx={{ mr: 1, color: "success.main" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Potential Return
                </Typography>
              </Box>
              <Typography variant="h3" color="success.main" fontWeight="800">
                {formatCurrency(calculatedValues.possibleReturn)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stake: {formatCurrency(calculatedValues.stake)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: 2,
                border: "1px solid rgba(123, 31, 162, 0.1)",
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <Security
                  sx={{
                    mr: 1,
                    color: getRiskColor(calculatedValues.riskLevel),
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  Risk Level
                </Typography>
              </Box>
              <Chip
                label={calculatedValues.riskLevel}
                color={getRiskColor(calculatedValues.riskLevel)}
                size="medium"
                sx={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  height: 40,
                  width: "100%",
                }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Confidence Analysis */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <ShowChart /> Confidence Analysis
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Confidence Score: {calculatedValues.confidence.toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                color={getConfidenceColor(calculatedValues.confidence)}
              >
                {calculatedValues.confidence >= 75
                  ? "High Confidence"
                  : calculatedValues.confidence >= 50
                    ? "Moderate Confidence"
                    : "Low Confidence"}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculatedValues.confidence}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: getConfidenceColor(
                    calculatedValues.confidence
                  ),
                  borderRadius: 6,
                },
              }}
            />
            <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <Warning
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                Low (0-49%)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Moderate (50-74%)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <TrendingUp
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                High (75-100%)
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Matches Selections */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Sports /> Match Selections ({calculatedValues.matchesCount})
          </Typography>
          {slip.matches?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Match</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>League</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Market</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Prediction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Odds
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Confidence
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slip.matches.map((match, index) => {
                    const matchConfidence =
                      match.confidence ||
                      (calculatedValues.confidence /
                        calculatedValues.matchesCount) *
                        (0.8 + Math.random() * 0.4);

                    return (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {match.home_team || "Home"} vs{" "}
                            {match.away_team || "Away"}
                          </Typography>
                          {match.match_date && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarToday fontSize="small" />
                              {new Date(match.match_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={match.league || "Unknown"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={match.market_name || "Market"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={match.outcome || "N/A"}
                            size="small"
                            sx={{
                              bgcolor: "rgba(123, 31, 162, 0.1)",
                              color: "primary.main",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="700">
                            {parseFloat(match.odds || 1).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
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
                                  width: `${Math.min(matchConfidence, 100)}%`,
                                  height: "100%",
                                  bgcolor:
                                    matchConfidence > 75
                                      ? "success.main"
                                      : matchConfidence > 50
                                        ? "warning.main"
                                        : "error.main",
                                }}
                              />
                            </Box>
                            <Typography variant="caption">
                              {Math.min(matchConfidence, 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Sports
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  opacity: 0.3,
                  mb: 2,
                }}
              />
              <Typography variant="body1" color="text.secondary">
                No matches found in this slip
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Financial Analysis */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AccountBalanceWallet /> Profit/Loss Analysis
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Stake Amount
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(calculatedValues.stake)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Potential Profit
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(calculatedValues.potentialProfit)}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {calculatedValues.totalOdds > 1
                      ? `${((calculatedValues.totalOdds - 1) * 100).toFixed(0)}% ROI`
                      : "No profit"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Risk Amount (Max Loss)
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(calculatedValues.stake)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Info /> Additional Information
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Expected Value (EV):
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="600"
                    color="success.main"
                  >
                    {formatCurrency(calculatedValues.expectedValue)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Created:
                  </Typography>
                  <Typography variant="body1">
                    {slip.created_at
                      ? new Date(slip.created_at).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={slip.status || "Active"}
                    size="small"
                    color={
                      slip.status === "Won"
                        ? "success"
                        : slip.status === "Lost"
                          ? "error"
                          : slip.status === "Pending"
                            ? "warning"
                            : "default"
                    }
                  />
                </Box>
                {slip.currency && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Currency:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {slip.currency}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Analysis Type:
                  </Typography>
                  <Chip
                    label={
                      calculatedValues.confidence >= 75
                        ? "AI Premium"
                        : calculatedValues.confidence >= 50
                          ? "AI Standard"
                          : "AI Basic"
                    }
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2 }}
          startIcon={<AttachMoney />}
        >
          Place Bet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlipDetailModal;
