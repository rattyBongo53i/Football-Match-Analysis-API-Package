import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Box,
  LinearProgress,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Search as SearchIcon,
  SportsSoccer as SoccerIcon,
  Add as AddIcon,
  CheckCircle as AddedIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import slipApi from "../../services/api/slipApi";

const MatchSelectionDialog = ({
  open,
  onClose,
  onSelectMatch,
  existingMatchIds = [],
}) => {
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchMatches();
  }, [open]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await slipApi.getAvailableMatches(); // Simplified API call
      setMatches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = matches.filter(
    (m) =>
      m.home_team.toLowerCase().includes(search.toLowerCase()) ||
      m.away_team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: { borderRadius: 4, bgcolor: "#1a1a2e", color: "white" },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5" fontWeight="900">
          Select Match
        </Typography>
        <TextField
          size="small"
          placeholder="Filter teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.05)",
              color: "white",
            },
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2}>
          {filtered.map((match) => {
            const isAdded = existingMatchIds.includes(match.id);
            return (
              <Grid item xs={12} key={match.id}>
                <Card
                  sx={{
                    bgcolor: isAdded
                      ? "rgba(156, 39, 176, 0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: isAdded
                      ? "1px solid #9c27b0"
                      : "1px solid rgba(255,255,255,0.05)",
                    transition: "0.2s",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: "16px !important",
                    }}
                  >
                    <SoccerIcon sx={{ mr: 2, opacity: 0.3 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.5 }}>
                        {match.league} • {match.match_date}
                      </Typography>
                    </Box>
                    <Button
                      variant={isAdded ? "text" : "contained"}
                      color={isAdded ? "success" : "primary"}
                      startIcon={isAdded ? <AddedIcon /> : <AddIcon />}
                      onClick={() => !isAdded && onSelectMatch(match)}
                      sx={{ borderRadius: 2 }}
                    >
                      {isAdded ? "Added" : "Pick"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default MatchSelectionDialog;
