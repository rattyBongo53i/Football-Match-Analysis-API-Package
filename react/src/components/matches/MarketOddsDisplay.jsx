import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  alpha,
  Alert,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  TrendingUp as OddsIcon,
} from "@mui/icons-material";

const MarketOddsDisplay = ({
  markets = [],
  onMarketSelect,
  selectedMarketId,
}) => {
  const handleMarketClick = (market) => {
    if (onMarketSelect) {
      onMarketSelect(market);
    }
  };

  const getOddsColor = (odds) => {
    if (odds < 1.5) return "error";
    if (odds < 2.5) return "warning";
    if (odds < 4) return "info";
    return "success";
  };

  const getOddsLabel = (odds) => {
    if (odds < 1.5) return "High Favorite";
    if (odds < 2.5) return "Moderate";
    if (odds < 4) return "Underdog";
    return "Long Shot";
  };

  if (!markets || markets.length === 0) {
    return (
      <Card variant="outlined">
        <CardHeader
          title={
            <Typography variant="h6">
              <MoneyIcon color="info" sx={{ mr: 1 }} />
              Betting Markets
            </Typography>
          }
        />
        <CardContent>
          <Alert severity="info">
            No betting markets available for this match
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Typography variant="h6">
            <MoneyIcon color="info" sx={{ mr: 1 }} />
            Betting Markets & Odds
          </Typography>
        }
        subheader="Select a market to add to betslip"
      />
      <CardContent>
        {selectedMarketId && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Market selected:{" "}
            {markets.find((m) => m.id === selectedMarketId)?.name}
          </Alert>
        )}

        <Grid container spacing={2}>
          {markets.map((market) => (
            <Grid item xs={12} sm={6} md={4} key={market.id}>
              <Button
                fullWidth
                variant={
                  selectedMarketId === market.id ? "contained" : "outlined"
                }
                onClick={() => handleMarketClick(market)}
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: selectedMarketId === market.id ? 2 : 1,
                  borderColor:
                    selectedMarketId === market.id ? "primary.main" : "divider",
                  bgcolor:
                    selectedMarketId === market.id
                      ? alpha("#1976d2", 0.1)
                      : "background.paper",
                  "&:hover": {
                    bgcolor: alpha("#1976d2", 0.05),
                    borderColor: "primary.main",
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {market.name}
                </Typography>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <OddsIcon fontSize="small" />
                  <Typography variant="h5" color={getOddsColor(market.odds)}>
                    {market.odds}
                  </Typography>
                </Box>

                <Chip
                  label={getOddsLabel(market.odds)}
                  size="small"
                  color={getOddsColor(market.odds)}
                  variant="outlined"
                />

                {market.probability && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Probability: {(market.probability * 100).toFixed(1)}%
                  </Typography>
                )}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MarketOddsDisplay;
