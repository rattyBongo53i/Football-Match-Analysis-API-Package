import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Home as HomeIcon,
  List as ListIcon,
} from "@mui/icons-material";
import matchApi from "../../services/api/matchApi";
import { useBetslip } from "../../contexts/BetslipContext";
import AddToBetslipButton from "../../components/betslip/AddToBetslipButton";
import MatchView from "./MatchView";
import "./MatchDetails.css";

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMatchInBetslip } = useBetslip();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadMatch();
    }
  }, [id]);

  const loadMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await matchApi.getMatchById(id);
      if (response.success) {
        setMatch(response.data);
      } else {
        setError("Failed to load match details. The match may not exist.");
      }
    } catch (err) {
      setError("Failed to load match details. Please try again.");
      console.error("Error loading match:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this match? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await matchApi.deleteMatch(id);
      if (response.success) {
        navigate("/matches", {
          state: { message: "Match deleted successfully" },
        });
      } else {
        alert("Failed to delete match. Please try again.");
      }
    } catch (err) {
      alert("Failed to delete match. Please try again.");
      console.error("Error deleting match:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !match) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Match not found"}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/matches")}
          variant="outlined"
        >
          Back to Matches
        </Button>
      </Container>
    );
  }

  const inBetslip = isMatchInBetslip(match.id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/matches")}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ListIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Matches
          </Link>
          <Typography color="text.primary">
            {match.home_team} vs {match.away_team}
          </Typography>
        </Breadcrumbs>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h4" component="h1" gutterBottom>
                {match.home_team} vs {match.away_team}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Chip
                  label={match.league || "Unknown League"}
                  color="primary"
                  variant="outlined"
                  size="small"
                />

                <Typography variant="body2" color="text.secondary">
                  {new Date(match.match_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {match.match_time && ` • ${match.match_time}`}
                </Typography>

                <Chip
                  label={match.status || "Scheduled"}
                  color={
                    match.status === "completed"
                      ? "success"
                      : match.status === "ongoing"
                        ? "warning"
                        : match.status === "cancelled"
                          ? "error"
                          : "info"
                  }
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item>
              <Box display="flex" gap={1} flexWrap="wrap">
                <AddToBetslipButton match={match} />

                <Button
                  startIcon={<AutoAwesomeIcon />}
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate(`/matches/${id}/results`)}
                >
                  Results
                </Button>

                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => navigate(`/matches/${id}/edit`)}
                >
                  Edit
                </Button>

                <IconButton
                  color="error"
                  onClick={handleDelete}
                  disabled={deleting}
                  size="large"
                >
                  <DeleteIcon />
                </IconButton>

                <Button
                  startIcon={<BackIcon />}
                  onClick={() => navigate("/matches")}
                  variant="outlined"
                >
                  Back
                </Button>
              </Box>
            </Grid>
          </Grid>

          {inBetslip && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This match is in your betslip
            </Alert>
          )}
        </Paper>
      </Box>

      <MatchView match={match} />
    </Container>
  );
};

export default MatchDetails;
