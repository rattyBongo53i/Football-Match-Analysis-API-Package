import React, { useState, memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  Grid,
  Collapse,
  Button,
  Chip,
  Fade,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  History as HistoryIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";
import { MemoizedTextField } from "./MemoizedComponents";
import { EMPTY_H2H_MATCH } from "./constants";
import { StyledPaper } from "./styledComponents";

const HeadToHeadInput = memo(({ matches = [], onChange, disabled }) => {
  const [expanded, setExpanded] = useState(true);

  const getResultColor = (res) => {
    if (res === "H") return { bg: "rgba(76, 175, 80, 0.1)", text: "#81c784" };
    if (res === "A") return { bg: "rgba(244, 67, 54, 0.1)", text: "#e57373" };
    return { bg: "rgba(255, 152, 0, 0.1)", text: "#ffb74d" };
  };

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
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderRadius: 3,
          cursor: "pointer",
          background:
            "linear-gradient(90deg, rgba(156, 39, 176, 0.08) 0%, transparent 100%)",
          border: "1px solid rgba(156, 39, 176, 0.15)",
          mb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" fontWeight="700">
            Historical Meetings ({matches.length})
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {matches.map((m, i) => {
            const colors = getResultColor(m.result);
            return (
              <Grid item xs={12} key={i}>
                <Fade in timeout={300 + i * 100}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        opacity: 0.3,
                        fontSize: 12,
                        fontWeight: "bold",
                        minWidth: 20,
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <MemoizedTextField
                          type="date"
                          fullWidth
                          size="small"
                          label="Date"
                          value={m.date}
                          onChange={(e) =>
                            handleChange(i, "date", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          disabled={disabled}
                        />
                      </Grid>
                      <Grid item xs={5} sm={3}>
                        <MemoizedTextField
                          fullWidth
                          size="small"
                          label="Home"
                          value={m.home_team}
                          onChange={(e) =>
                            handleChange(i, "home_team", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </Grid>
                      <Grid item xs={2} sm={2}>
                        <MemoizedTextField
                          fullWidth
                          size="small"
                          label="Score"
                          placeholder="0-0"
                          value={m.score}
                          onChange={(e) =>
                            handleChange(i, "score", e.target.value)
                          }
                          disabled={disabled}
                          sx={{
                            "& input": {
                              textAlign: "center",
                              letterSpacing: 2,
                              fontWeight: "bold",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={5} sm={3}>
                        <MemoizedTextField
                          fullWidth
                          size="small"
                          label="Away"
                          value={m.away_team}
                          onChange={(e) =>
                            handleChange(i, "away_team", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </Grid>
                    </Grid>
                    <Chip
                      label={m.result || "?"}
                      size="small"
                      sx={{
                        bgcolor: colors.bg,
                        color: colors.text,
                        fontWeight: "900",
                        width: 40,
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemove(i)}
                      disabled={disabled}
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Fade>
              </Grid>
            );
          })}
        </Grid>

        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={disabled || matches.length >= 10}
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: 2,
            border: "1px dashed rgba(156, 39, 176, 0.3)",
            color: "primary.main",
          }}
        >
          Add H2H Match
        </Button>
      </Collapse>
    </Box>
  );
});

export default HeadToHeadInput;
