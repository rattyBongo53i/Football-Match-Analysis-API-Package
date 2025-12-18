// src/components/matches/MarketsSection.jsx
import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MarketItem from "./MarketItem"; // Create this file next

const MarketsSection = ({
  markets,
  onMarketChange,
  onAddMarket,
  onRemoveMarket,
  marketErrors,
  submitting,
}) => {
  return (
    <Box mb={4}>
      <Typography
        variant="h6"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        <AddIcon /> Market Odds
      </Typography>
      <Grid container spacing={3}>
        {markets.map((market, index) => (
          <MarketItem
            key={market.id}
            market={market}
            index={index}
            marketErrors={marketErrors}
            submitting={submitting}
            onRemoveMarket={onRemoveMarket}
            onMarketChange={onMarketChange}
          />
        ))}
      </Grid>
      <Button
        startIcon={<AddIcon />}
        onClick={onAddMarket}
        sx={{ mt: 2 }}
        disabled={submitting}
      >
        Add Another Market
      </Button>
    </Box>
  );
};

export default MarketsSection;
