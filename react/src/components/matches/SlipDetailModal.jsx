import React from "react";
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
} from "@mui/material";
import {
  TrendingUp,
  AttachMoney,
  Warning,
  Sports,
  Close,
  Info,
} from "@mui/icons-material";

const SlipDetailModal = ({ open, onClose, slip }) => {
  const theme = useTheme();

  if (!slip) return null;

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Low Risk":
        return "success";
      case "Medium Risk":
        return "warning";
      case "High Risk":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Slip Details: {slip.slip_id}</Typography>
          <Button onClick={onClose} size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Confidence Score
              </Typography>
              <Typography variant="h4" color="primary">
                {slip.confidence_score.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Total Odds
              </Typography>
              <Typography variant="h4" color="secondary">
                {slip.total_odds.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Potential Return
              </Typography>
              <Typography variant="h4" color="success.main">
                ${slip.possible_return.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Risk Level
              </Typography>
              <Chip
                label={slip.risk_level}
                color={getRiskColor(slip.risk_level)}
                size="small"
                sx={{ fontSize: "1rem", fontWeight: "bold" }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Confidence Progress */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Confidence Analysis
          </Typography>
          <LinearProgress
            variant="determinate"
            value={slip.confidence_score}
            sx={{
              height: 16,
              borderRadius: 8,
              mb: 1,
              backgroundColor: theme.palette.grey[200],
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  slip.confidence_score > 70
                    ? theme.palette.success.main
                    : slip.confidence_score > 50
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
              },
            }}
          />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              0% - Very Low
            </Typography>
            <Typography variant="caption" color="text.secondary">
              50% - Moderate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              100% - Very High
            </Typography>
          </Box>
        </Box>

        {/* Selections Table */}
        <Box mb={3}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Sports />
            Selections ({slip.legs.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Match ID</TableCell>
                  <TableCell>Market</TableCell>
                  <TableCell>Selection</TableCell>
                  <TableCell align="right">Odds</TableCell>
                  <TableCell align="center">Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slip.legs.map((leg, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {leg.match_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leg.market}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{leg.selection}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={leg.odds.toFixed(2)}
                        color="secondary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <LinearProgress
                        variant="determinate"
                        value={70 + Math.random() * 20} // Mock confidence
                        sx={{
                          height: 6,
                          width: 60,
                          margin: "0 auto",
                          borderRadius: 3,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: theme.palette.info.main,
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Profit/Loss Calculation */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Profit/Loss Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: "success.light",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="success.dark">
                  Potential Profit
                </Typography>
                <Typography variant="h6" color="success.dark">
                  ${(slip.possible_return - slip.stake).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{ p: 1.5, backgroundColor: "error.light", borderRadius: 1 }}
              >
                <Typography variant="body2" color="error.dark">
                  Risk Amount
                </Typography>
                <Typography variant="h6" color="error.dark">
                  ${slip.stake}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Additional Info */}
        <Paper sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Info />
            Additional Information
          </Typography>
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Generated At:
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleString()}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Stake:
              </Typography>
              <Typography variant="body2">${slip.stake}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total Investment:
              </Typography>
              <Typography variant="body2">${slip.stake}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Expected Value (EV):
              </Typography>
              <Typography variant="body2" color="success.main">
                $
                {(slip.possible_return * (slip.confidence_score / 100)).toFixed(
                  2
                )}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button variant="contained" color="primary">
          Place Bet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlipDetailModal;
