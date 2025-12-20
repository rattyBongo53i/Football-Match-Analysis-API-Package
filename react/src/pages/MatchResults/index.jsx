import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Refresh, ArrowBack, AutoAwesome } from "@mui/icons-material";

import { matchService } from "../../services/api/matchService";

function pickProbabilities(payload) {
  // Common shapes we might see
  // - { probabilities: { home, draw, away } }
  // - { data: { probabilities: ... } }
  // - { predictions: [{ probabilities: ... }] }
  // - { data: { predictions: [{ probabilities: ... }] } }
  const direct = payload?.probabilities;
  const nested = payload?.data?.probabilities;
  const fromPredList =
    payload?.predictions?.[0]?.probabilities ?? payload?.data?.predictions?.[0]?.probabilities;

  return direct || nested || fromPredList || null;
}

function pickSlips(payload) {
  // Common shapes:
  // - { slips: [...] }
  // - { data: { slips: [...] } }
  // - { fallback_slips: [...] }
  // - { data: { fallback_slips: [...] } }
  const slips =
    payload?.slips ??
    payload?.data?.slips ??
    payload?.fallback_slips ??
    payload?.data?.fallback_slips;

  if (!slips) return null;

  // If slips are objects, allow slip.text or slip.summary; otherwise string
  return Array.isArray(slips) ? slips : null;
}

function formatPct(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

export default function MatchResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [match, setMatch] = useState(null);
  const [resultsPayload, setResultsPayload] = useState(null);

  const pollRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always load the match so we can show analysis_status / prediction_ready
      const m = await matchService.getMatchById(id);
      setMatch(m);

      // Try to load prediction results (may be missing until backend finishes V1)
      const payload = await matchService.getPredictionResults(id);
      setResultsPayload(payload);
    } catch (e) {
      setError("Failed to load results. Check backend connectivity.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const startAnalysis = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      await matchService.generatePredictions(id);
      // Immediately reload and then start polling
      await load();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        status === 409
          ? "Analysis already running or completed for this match."
          : e?.response?.data?.message || "Failed to start analysis.";
      setError(msg);
    } finally {
      setStarting(false);
    }
  }, [id, load]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await load();
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    // Poll only while match is processing or results aren't available yet.
    if (!match) return;

    const analysisStatus = match.analysis_status || match.analysisStatus;
    const predictionReady = match.prediction_ready ?? match.predictionReady;
    const probs = pickProbabilities(resultsPayload);
    const slips = pickSlips(resultsPayload);

    const shouldPoll =
      analysisStatus === "processing" || (!predictionReady && (!probs || !slips));

    if (!shouldPoll) return;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      load();
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [match, resultsPayload, load]);

  const probabilities = useMemo(() => pickProbabilities(resultsPayload), [resultsPayload]);
  const slips = useMemo(() => pickSlips(resultsPayload), [resultsPayload]);
  const topSlips = useMemo(() => (slips ? slips.slice(0, 2) : []), [slips]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Box>
            <Typography variant="h4" component="h1">
              Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Match ID: {id}
            </Typography>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
            <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button
              startIcon={<Refresh />}
              variant="outlined"
              onClick={load}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              startIcon={starting ? <CircularProgress size={18} /> : <AutoAwesome />}
              variant="contained"
              onClick={startAnalysis}
              disabled={starting}
            >
              {starting ? "Starting..." : "Generate"}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Chip
            label={`analysis_status: ${match?.analysis_status ?? "unknown"}`}
            color={
              match?.analysis_status === "completed"
                ? "success"
                : match?.analysis_status === "processing"
                  ? "warning"
                  : "default"
            }
            variant="outlined"
          />
          <Chip
            label={`prediction_ready: ${
              typeof match?.prediction_ready === "boolean" ? String(match.prediction_ready) : "unknown"
            }`}
            variant="outlined"
          />
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Win / Draw / Loss probabilities
        </Typography>
        {!probabilities ? (
          <Alert severity="info">
            No probabilities found in API response yet. This page will auto-populate once the backend
            starts returning prediction JSON for this match.
          </Alert>
        ) : (
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label={`Home: ${formatPct(probabilities.home)}`} color="primary" />
            <Chip label={`Draw: ${formatPct(probabilities.draw)}`} color="warning" />
            <Chip label={`Away: ${formatPct(probabilities.away)}`} color="error" />
          </Box>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generated slips (1–2)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {topSlips.length === 0 ? (
          <Alert severity="info">
            No slips found in API response yet. When the backend provides slips, they’ll appear here.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {topSlips.map((s, idx) => {
              const text =
                typeof s === "string"
                  ? s
                  : s?.text || s?.summary || JSON.stringify(s, null, 2);

              return (
                <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Slip #{idx + 1}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {text}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}



