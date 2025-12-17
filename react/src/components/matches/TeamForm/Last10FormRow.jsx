import React, { memo } from "react";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Box,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

const Last10FormRow = memo(
  ({ row, index, onUpdate, onDelete, disabled = false }) => {
    const handleChange = (field, value) => {
      onUpdate(index, { ...row, [field]: value });
    };

    const getOutcomeColor = (outcome) => {
      switch (outcome?.toUpperCase()) {
        case "W":
          return "#4caf50";
        case "D":
          return "#ff9800";
        case "L":
          return "#f44336";
        default:
          return "inherit";
      }
    };

    return (
      <Box
        sx={{
          mb: 2,
          p: 2,
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Opponent"
              value={row.opponent || ""}
              onChange={(e) => handleChange("opponent", e.target.value)}
              size="small"
              disabled={disabled}
              placeholder="e.g., Chelsea"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Score"
              value={row.result || ""}
              onChange={(e) => handleChange("result", e.target.value)}
              size="small"
              disabled={disabled}
              placeholder="e.g., 2-1"
              inputProps={{
                pattern: "\\d+-\\d+",
              }}
              helperText="Format: X-Y (goals for - goals against)"
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Outcome</InputLabel>
              <Select
                value={row.outcome || ""}
                onChange={(e) => handleChange("outcome", e.target.value)}
                label="Outcome"
                disabled={disabled}
                sx={{
                  "& .MuiSelect-select": {
                    color: getOutcomeColor(row.outcome),
                  },
                }}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="W" sx={{ color: "#4caf50", fontWeight: 600 }}>
                  Win (W)
                </MenuItem>
                <MenuItem value="D" sx={{ color: "#ff9800", fontWeight: 600 }}>
                  Draw (D)
                </MenuItem>
                <MenuItem value="L" sx={{ color: "#f44336", fontWeight: 600 }}>
                  Loss (L)
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1} sx={{ textAlign: "center" }}>
            <IconButton
              size="small"
              onClick={() => onDelete(index)}
              disabled={disabled}
              color="error"
              aria-label="Delete match"
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    );
  }
);

Last10FormRow.displayName = "Last10FormRow";

export default Last10FormRow;
