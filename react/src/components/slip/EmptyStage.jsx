import React from "react";
import { Box, Paper, Typography, Button, Grid } from "@mui/material";
import {
  ReceiptLong as SlipIcon,
  SportsSoccer as SoccerIcon,
  Add as AddIcon,
  TrendingUp as AnalysisIcon,
} from "@mui/icons-material";

const EmptyState = ({ onCreateSlip }) => {
  return (
    <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
      <SlipIcon
        sx={{ fontSize: 80, color: "text.secondary", mb: 2, opacity: 0.5 }}
      />

      <Typography variant="h5" gutterBottom color="text.secondary">
        No Slips Created Yet
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
        sx={{ maxWidth: 600, mx: "auto", mb: 4 }}
      >
        Start by creating your first betting slip. Add matches, set your stake,
        and generate predictions using our ML analysis.
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2 }}>
            <SoccerIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              1. Add Matches
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select 5-10 matches from upcoming fixtures
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2 }}>
            <AnalysisIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              2. Run Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use ML to generate 100+ betting alternatives
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2 }}>
            <SlipIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              3. Place Bets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose the best slip based on confidence scores
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateSlip}
        sx={{ borderRadius: 2, px: 4, py: 1.5 }}
      >
        Create Your First Slip
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mt: 3 }}
      >
        Need help? Check out our{" "}
        <Button size="small" color="primary">
          quick start guide
        </Button>
      </Typography>
    </Paper>
  );
};

export default EmptyState;
