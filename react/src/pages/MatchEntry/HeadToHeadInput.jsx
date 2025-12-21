import React, { useState, memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid,
  Collapse,
  Button,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  History as HistoryIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { MemoizedTextField } from "./MemoizedComponents";
import { EMPTY_H2H_MATCH } from "./constants";

const HeadToHeadInput = memo(({ matches = [], onChange, disabled }) => {
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => onChange([...matches, { ...EMPTY_H2H_MATCH }]);
  const handleRemove = (i) => onChange(matches.filter((_, idx) => idx !== i));

  const handleChange = (i, field, value) => {
    const updated = [...matches];
    updated[i] = { ...updated[i], [field]: value };

    if (field === "score" && value.includes("-")) {
      const [h, a] = value.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(h) && !isNaN(a)) {
        updated[i].result = h > a ? "H" : h < a ? "A" : "D";
      }
    }

    onChange(updated);
  };

  return (
    <Box mb={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          cursor: "pointer",
          p: 2,
          borderRadius: "12px",
          background:
            "linear-gradient(90deg, rgba(156, 39, 176, 0.05), rgba(255, 235, 59, 0.05))",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(156, 39, 176, 0.1), rgba(255, 235, 59, 0.1))",
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" sx={{ display: "flex", gap: 1 }}>
          <HistoryIcon /> Head-to-Head ({matches.length})
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Collapse in={expanded}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Optional historical meetings (most recent first)
        </Alert>

        {matches.map((m, i) => (
          <Card key={i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    type="date"
                    fullWidth
                    label="Date"
                    value={m.date}
                    onChange={(e) => handleChange(i, "date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Home"
                    value={m.home_team}
                    onChange={(e) =>
                      handleChange(i, "home_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <MemoizedTextField
                    fullWidth
                    label="Away"
                    value={m.away_team}
                    onChange={(e) =>
                      handleChange(i, "away_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <MemoizedTextField
                    fullWidth
                    label="Score"
                    value={m.score}
                    onChange={(e) => handleChange(i, "score", e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Chip label={m.result || "?"} size="small" />
                </Grid>
              </Grid>
              <IconButton onClick={() => handleRemove(i)} disabled={disabled}>
                <DeleteIcon />
              </IconButton>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={disabled || matches.length >= 10}
        >
          Add H2H Match
        </Button>
      </Collapse>
    </Box>
  );
});

HeadToHeadInput.displayName = "HeadToHeadInput";
export default HeadToHeadInput;
