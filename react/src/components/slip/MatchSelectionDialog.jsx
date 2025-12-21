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
  Divider,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  SportsSoccer as SoccerIcon,
  Add as AddIcon,
  CheckCircle as AddedIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import slipApi from "../../services/api/slipApi";

const MatchSelectionDialog = ({
  open,
  onClose,
  onSelectMatch,
  existingMatchIds = [],
}) => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchMatches();
    }
  }, [open]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    console.log("Modal triggered, getting all matches");

    try {
      // Use the slipApi service instead of direct axios call
      const response = await slipApi.getAllMatches({
        limit: 50,
        status: "upcoming",
      });

      if (response.success) {
        const matches = response.data || [];
        setMatches(matches);
        setFilteredMatches(matches);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
      setError("Failed to load matches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearch(term);
    if (!term.trim()) {
      setFilteredMatches(matches);
      return;
    }

    const filtered = matches.filter(
      (match) =>
        match.home_team?.toLowerCase().includes(term.toLowerCase()) ||
        match.away_team?.toLowerCase().includes(term.toLowerCase()) ||
        match.league?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredMatches(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAlreadyAdded = (matchId) => existingMatchIds.includes(matchId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        // Fix the elevation issue by using a valid elevation
        elevation: 8,
        sx: {
          borderRadius: 2,
          minHeight: "60vh",
          maxHeight: "80vh",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Select Matches to Add</Typography>
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by team name, league..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ width: "100%" }}>
            <LinearProgress />
          </Box>
        ) : filteredMatches.length === 0 ? (
          <Alert severity="info">
            {search
              ? "No matches found for your search."
              : "No matches available."}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredMatches.map((match) => {
              const added = isAlreadyAdded(match.id);
              return (
                <Grid item xs={12} md={6} key={match.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {match.home_team} vs {match.away_team}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {match.league} • {formatDate(match.match_date)}
                          </Typography>
                        </Box>
                        {added && (
                          <Chip
                            icon={<AddedIcon />}
                            label="Added"
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                          mb: 2,
                        }}
                      >
                        {match.markets?.slice(0, 3).map((market, idx) => (
                          <Chip
                            key={idx}
                            label={`${market.name}: ${market.home_odds?.toFixed(2)}/${market.draw_odds?.toFixed(2)}/${market.away_odds?.toFixed(2)}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {!match.markets && (
                          <Chip
                            label="No markets available"
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant={added ? "outlined" : "contained"}
                          size="small"
                          startIcon={added ? <AddedIcon /> : <AddIcon />}
                          onClick={() => !added && onSelectMatch(match)}
                          disabled={added}
                          sx={{ minWidth: 120 }}
                        >
                          {added ? "Already Added" : "Add to Slip"}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MatchSelectionDialog;
