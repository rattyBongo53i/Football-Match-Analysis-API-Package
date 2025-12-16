import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { matchService } from "../../services/api/matchService";
import MatchEntryForm from "./MatchEntryForm";
import "./MatchEntryForm.css";

const MatchEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && id !== "new") {
      loadMatch();
    }
  }, [id]);

  const loadMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const matchData = await matchService.getMatchById(id);
      setMatch(matchData);
    } catch (err) {
      setError("Failed to load match. Please try again.");
      console.error("Error loading match:", err);
    } finally {
      setLoading(false);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {id && id !== "new" ? "Edit Match" : "Add New Match"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter match details, team forms, and market odds
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MatchEntryForm
        matchId={id && id !== "new" ? id : null}
        initialData={match}
        onSuccess={() => navigate("/matches")}
      />
    </Container>
  );
};

export default MatchEntry;
