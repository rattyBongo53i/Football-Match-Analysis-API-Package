import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

import matchAPI from "../services/api";
import slipAPI from "../services/slipAPI";
import MatchCard from "../components/match/MatchCard";
import SlipBuilder from "../components/slip/SlipBuilder";

export default function SlipMaster() {
  const [matches, setMatches] = useState([]);
  const [slipMatches, setSlipMatches] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const loadMatches = async () => {
    const response = await matchAPI.getMatches();
    setMatches(response.data || []);
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleAddToSlip = (match) => {
    if (slipMatches.find((m) => m.match_id === match.id)) {
      return setSnackbar({
        open: true,
        message: "Match already added to slip",
        severity: "warning",
      });
    }

    setSlipMatches((prev) => [
      ...prev,
      {
        match_id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        market: null,
        outcome: null,
        odds: null,
      },
    ]);
  };

  const handleSaveSlip = async () => {
    if (slipMatches.length === 0)
      return setSnackbar({
        open: true,
        message: "Slip is empty",
        severity: "error",
      });

    const payload = {
      status: "draft",
      matches: slipMatches.map((m) => ({
        match_id: m.match_id,
        selected_market_id: m.market?.id || null,
        selected_outcome: m.outcome?.label || null,
        selected_odds: m.odds,
      })),
    };

    const response = await slipAPI.createSlip(payload);

    setSnackbar({
      open: true,
      message: "Master slip saved!",
      severity: "success",
    });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Build Master Slip
      </Typography>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* LEFT: Matches */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6">Matches</Typography>
          <Divider sx={{ mb: 2 }} />

          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onAdd={() => handleAddToSlip(match)}
            />
          ))}
        </Paper>

        {/* RIGHT: Slip */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6">Slip Builder</Typography>
          <Divider sx={{ mb: 2 }} />

          <SlipBuilder
            slipMatches={slipMatches}
            setSlipMatches={setSlipMatches}
          />

          <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveSlip}>
            Save Slip
          </Button>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
