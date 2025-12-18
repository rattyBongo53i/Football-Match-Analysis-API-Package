// src/components/matches/MarketItem.jsx
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  TextField,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const MarketItem = ({
  market,
  index,
  marketErrors,
  submitting,
  onRemoveMarket,
  onMarketChange,
}) => {
  const handleChange = (field, value) => {
    onMarketChange(index, { ...market, [field]: value });
  };

  return (
    <Grid item xs={12}>
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography>
              {market.name} {market.required && "*"}
            </Typography>
            {!market.required && (
              <IconButton
                size="small"
                onClick={() => onRemoveMarket(index)}
                disabled={submitting}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          <TextField
            fullWidth
            label="Odds"
            type="number"
            value={market.odds || ""}
            onChange={(e) => handleChange("odds", e.target.value)}
            disabled={submitting}
          />
        </CardContent>
      </Card>
    </Grid>
  );
};

export default MarketItem;
