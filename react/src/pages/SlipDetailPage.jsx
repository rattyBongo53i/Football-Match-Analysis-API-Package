import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@mui/material";
import { DeleteForever, AddCircle } from "@mui/icons-material";
import slipApi from "../services/api/slipApi";
import matchApi from "../services/api/matchApi";
import SlipDetailModal from "../components/matches/SlipDetailModal";
import EditSlipModal from "../components/slip/EditSlipModal";

// Extracted components
import LoadingSkeleton from "./slip-detail-components/LoadingSkeleton";
import ErrorState from "./slip-detail-components/ErrorState";
import HeaderSection from "./slip-detail-components/HeaderSection";
import SlipInfoCard from "./slip-detail-components/SlipInfoCard";
import MatchesTable from "./slip-detail-components/MatchesTable";
import ActionButtons from "./slip-detail-components/ActionButtons";
import AddMatchesDialog from "./slip-detail-components/AddMatchesDialog";
import NotificationSnackbar from "./slip-detail-components/NotificationSnackbar";
import ConfirmActionDialog from "./slip-detail-components/ConfirmActionDialog";

// Shared market helpers
import {
  MARKET_TYPES,
  MARKET_DISPLAY_NAMES,
  getMarketOptions,
  getMarketOutcomes,
  getMarketOptionsFromMatch,
  getSelectionOptionsFromMarket,
} from "./slip-detail-components/marketUtils";

const SlipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [addingMatches, setAddingMatches] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ open: false, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    loading: false,
  });

  useEffect(() => {
    fetchSlipDetails();
    fetchAvailableMatches();
  }, [id]);

  const fetchSlipDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await slipApi.getSlipForDashboard(id);
      const data = response.data?.data || response.data || {};

      if (!data || typeof data !== "object") {
        throw new Error("Invalid slip data format");
      }

      // Ensure matches is always array
      data.matches = Array.isArray(data.matches) ? data.matches : [];

      setSlip(data);
    } catch (err) {
      console.error("Error fetching slip details:", err);
      setError(err.message || "Failed to load slip details.");
      showSnackbar("Failed to load slip details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMatches = async () => {
    try {
      const response = await matchApi.getMatchesForBetslip();
      const data = response.data || response;
      setAvailableMatches(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      showSnackbar("Failed to load available matches", "error");
    }
  };

  const handleSaveSlip = async (updatedSlip) => {
    try {
      await slipApi.updateSlip(id, updatedSlip);
      setSlip(updatedSlip);
      showSnackbar("Slip updated successfully", "success");
    } catch (err) {
      console.error("Error updating slip:", err);
      showSnackbar("Failed to update slip", "error");
    }
  };

  const handleRunAnalysis = async () => {
    try {
      await slipApi.runSlipAnalysis(id);
      showSnackbar("Analysis started. Results will update shortly.", "info");
      setTimeout(fetchSlipDetails, 3000);
    } catch (err) {
      showSnackbar("Failed to start analysis", "error");
    }
  };

  const handleDeleteSlip = async () => {
    setIsDeleting(true);
    try {
      await slipApi.deleteSlip(id);
      showSnackbar("Slip deleted successfully", "success");
      setDeleteDialogOpen(false);
      setTimeout(() => navigate("/slips"), 1500);
    } catch (err) {
      showSnackbar("Failed to delete slip", "error");
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMatches = async () => {
    const errors = {};
    selectedMatches.forEach((match, index) => {
      if (!match.market) errors[`market_${index}`] = "Market required";
      if (!match.selection) errors[`selection_${index}`] = "Selection required";
      if (!match.odds || match.odds <= 1)
        errors[`odds_${index}`] = "Valid odds required";
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setAddingMatches(true);
    try {
      const slipData = {
        stake: slip?.stake || 0,
        currency: slip?.currency || "EUR",
        name: slip?.name || `Slip ${id}`,
        matches: selectedMatches.map((match) => {
          const matchData = availableMatches.find((m) => m.id === match.id);
          const marketData = matchData?.match_markets?.find(
            (m) => m.market?.code === match.market
          );

          return {
            match_id: match.id,
            market: match.market,
            market_name: MARKET_DISPLAY_NAMES[match.market] || match.market,
            selection: match.selection,
            odds: parseFloat(match.odds),
            home_team: match.home_team,
            away_team: match.away_team,
            league: match.league,
            match_date: match.match_date,
          };
        }),
      };

      await slipApi.addMatchesToSlip(id, slipData);

      showSnackbar("Matches added successfully", "success");
      setSelectedMatches([]);
      setAddMatchDialogOpen(false);
      setFormErrors({});
      fetchSlipDetails();
    } catch (err) {
      console.error("Error adding matches:", err);
      showSnackbar("Failed to add matches to slip", "error");
    } finally {
      setAddingMatches(false);
    }
  };

  const handleAddMatchesToSlip = async () => {
    if (!selectedMatches?.length) {
      showSnackbar("No matches selected", "warning");
      return;
    }

    setConfirmConfig({ ...confirmConfig, open: true });
  };

  const handleConfirmAddMatches = async () => {
    setIsSubmitting(true);
    try {
      const slipData = {
        stake: slip.stake || 0,
        currency: slip.currency || "EUR",
        name: slip.name || `Slip ${id}`,
        matches: selectedMatches.map((match) => ({
          match_id: match.id || match.match_id,
          market: match.market,
          market_name: MARKET_DISPLAY_NAMES[match.market] || match.market,
          selection: match.selection,
          odds: parseFloat(match.odds) || 1.85,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
        })),
      };

      await slipApi.addMatchesToSlip(id, slipData);

      showSnackbar(
        `${selectedMatches.length} match(es) added successfully`,
        "success"
      );
      setSelectedMatches([]);
      setAddMatchDialogOpen(false);
      fetchSlipDetails();
    } catch (err) {
      console.error("Error adding matches:", err);
      showSnackbar("Failed to add matches", "error");
    } finally {
      setIsSubmitting(false);
      setConfirmConfig({ ...confirmConfig, open: false });
    }
  };

  const handleMatchSelect = (match) => {
    const isSelected = selectedMatches.some((m) => m.id === match.id);
    if (isSelected) {
      setSelectedMatches(selectedMatches.filter((m) => m.id !== match.id));
    } else {
      const defaultMarket = match.match_markets?.[0]?.market?.code || "";
      setSelectedMatches([
        ...selectedMatches,
        {
          id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          market: defaultMarket,
          selection: "",
          odds: "",
        },
      ]);
    }
  };

  const handleMatchFieldChange = (index, field, value) => {
    const updated = [...selectedMatches];
    updated[index][field] = value;

    // Auto-fill odds when selection changes
    if (field === "selection" && value && updated[index].market) {
      const match = availableMatches.find((m) => m.id === updated[index].id);
      if (match) {
        const marketData = match.match_markets?.find(
          (m) => m.market?.code === updated[index].market
        );
        const outcomes = getMarketOutcomes(
          updated[index].market,
          match,
          marketData
        );
        const selected = outcomes.find((o) => o.value === value);
        if (selected) {
          updated[index].odds = selected.odds.toFixed(2);
        }
      }
    }

    // Reset selection/odds when market changes
    if (field === "market") {
      updated[index].selection = "";
      updated[index].odds = "";
    }

    setSelectedMatches(updated);

    // Clear error
    if (formErrors[`${field}_${index}`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`${field}_${index}`];
      setFormErrors(newErrors);
    }
  };

  const handleRunAnalyze = (id) => {
    navigate(`/slips/master/${id}`);
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
      case "low risk":
        return "success";
      case "medium":
      case "medium risk":
        return "warning";
      case "high":
      case "high risk":
        return "error";
      default:
        return "default";
    }
  };

  const getSelectionOptions = (matchId, marketCode) => {
    const options = getSelectionOptionsFromMarket(
      matchId,
      marketCode,
      availableMatches
    );
    return options.map((option) => option.value);
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !slip) {
    return (
      <ErrorState
        error={error}
        onRetry={fetchSlipDetails}
        navigate={navigate}
      />
    );
  }

  return (
    <Container maxWidth="lg" className="main-content">
      <Fade in={true}>
        <Box>
          <HeaderSection onBack={() => navigate(-1)} />

          <SlipInfoCard
            slip={slip}
            onViewDetails={() => setModalOpen(true)}
            getRiskColor={getRiskColor}
            onAddMatches={() => setAddMatchDialogOpen(true)}
          />

          <MatchesTable slip={slip} />

          <ActionButtons
            onEdit={() => setEditModalOpen(true)}
            onAnalyze={handleRunAnalysis}
            onDelete={() => setDeleteDialogOpen(true)}
            // onAddMatches={() => setAddMatchDialogOpen(true)}
            onAddMatchesToSlip={handleAddMatchesToSlip}
            matchesCount={slip.matches?.length || 0}
            onViewAnalysis={() => handleRunAnalysis(slip.id)}
          />
        </Box>
      </Fade>

      <AddMatchesDialog
        open={addMatchDialogOpen}
        onClose={() => {
          setAddMatchDialogOpen(false);
          setSelectedMatches([]);
          setFormErrors({});
        }}
        availableMatches={availableMatches}
        selectedMatches={selectedMatches}
        onMatchSelect={handleMatchSelect}
        onMatchFieldChange={handleMatchFieldChange}
        onAddMatches={handleAddMatches}
        addingMatches={addingMatches}
        formErrors={formErrors}
        getMarketOptions={getMarketOptionsFromMatch}
        getSelectionOptions={getSelectionOptions}
      />

      <SlipDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slip={slip}
      />

      <EditSlipModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slip={slip}
        onSave={handleSaveSlip}
        availableMatches={availableMatches}
      />

      <ConfirmActionDialog
        open={confirmConfig.open}
        loading={confirmConfig.loading}
        onClose={() => setConfirmConfig({ ...confirmConfig, open: false })}
        onConfirm={handleConfirmAddMatches}
        title={
          dialogConfig.type === "delete"
            ? "Delete Permanently?"
            : "Add Selections?"
        }
        message={
          dialogConfig.type === "delete"
            ? "This will remove the slip and all associated data. This cannot be undone."
            : "Are you sure you want to add these matches to your current slip?"
        }
        confirmText={
          dialogConfig.type === "delete" ? "Delete" : "Confirm & Add"
        }
        confirmColor={dialogConfig.type === "delete" ? "error" : "primary"}
        icon={dialogConfig.type === "delete" ? DeleteForever : AddCircle}
      />

      <NotificationSnackbar snackbar={snackbar} onClose={handleSnackbarClose} />
    </Container>
  );
};

export default SlipDetailPage;
