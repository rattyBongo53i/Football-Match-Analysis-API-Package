import React, { memo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  IconButton,
  Button,
  Collapse,
  Chip,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore,
  ExpandLess,
  History,
} from "@mui/icons-material";

const HeadToHeadInput = memo(({ matches = [], onChange, disabled }) => {
  const [expanded, setExpanded] = React.useState(false);

  const addMatch = () => {
    onChange([
      ...matches,
      { date: "", home_team: "", away_team: "", score: "", result: "" },
    ]);
  };

  const removeMatch = (index) => {
    onChange(matches.filter((_, i) => i !== index));
  };

  const updateMatch = (index, field, value) => {
    const updated = [...matches];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "score" && value.includes("-")) {
      const [h, a] = value.split("-").map((n) => parseInt(n.trim()));
      if (!isNaN(h) && !isNaN(a)) {
        updated[index].result = h > a ? "H" : h < a ? "A" : "D";
      }
    }
    onChange(updated);
  };

  return (
    <Box mb={4}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <History /> Head-to-Head (Last {matches.length} Matches)
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Alert severity="info" sx={{ my: 2 }}>
          Enter past matches between these teams (most recent first). Helps
          Python engine a lot!
        </Alert>

        {matches.map((m, i) => (
          <Card key={i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography>Match #{matches.length - i}</Typography>
                <IconButton
                  size="small"
                  onClick={() => removeMatch(i)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={m.date}
                    onChange={(e) => updateMatch(i, "date", e.target.value)}
                    disabled={disabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Home"
                    value={m.home_team}
                    onChange={(e) =>
                      updateMatch(i, "home_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Away"
                    value={m.away_team}
                    onChange={(e) =>
                      updateMatch(i, "away_team", e.target.value)
                    }
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Score"
                    placeholder="2-1"
                    value={m.score}
                    onChange={(e) => updateMatch(i, "score", e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={1} display="flex" alignItems="center">
                  <Chip
                    label={m.result || "?"}
                    color={
                      m.result === "H"
                        ? "success"
                        : m.result === "A"
                          ? "error"
                          : "default"
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={addMatch}
          disabled={disabled || matches.length >= 10}
        >
          Add Past Match {matches.length >= 10 && "(Max 10)"}
        </Button>
      </Collapse>
    </Box>
  );
});

export default HeadToHeadInput;
