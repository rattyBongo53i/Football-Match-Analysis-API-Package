import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

export default function SlipBuilder({ slipMatches, setSlipMatches }) {
  const handleRemove = (index) => {
    setSlipMatches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    setSlipMatches((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  return (
    <Box>
      {slipMatches.map((m, i) => (
        <Paper key={m.match_id} sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>
              {m.home_team} vs {m.away_team}
            </Typography>
            <IconButton size="small" onClick={() => handleRemove(i)}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>

          <TextField
            select
            label="Market"
            value={m.market?.id || ""}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onChange={(e) =>
              handleChange(i, "market", {
                id: e.target.value,
                label: e.target.value,
              })
            }
          >
            <MenuItem value="1X2">1X2</MenuItem>
            <MenuItem value="Over/Under">Over/Under</MenuItem>
            <MenuItem value="BTTS">BTTS</MenuItem>
          </TextField>

          <TextField
            label="Outcome"
            value={m.outcome || ""}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onChange={(e) => handleChange(i, "outcome", e.target.value)}
          />

          <TextField
            label="Odds"
            type="number"
            value={m.odds || ""}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onChange={(e) =>
              handleChange(i, "odds", parseFloat(e.target.value))
            }
          />
        </Paper>
      ))}
    </Box>
  );
}
