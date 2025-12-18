// src/components/betslip/SubmitMasterSlipButton.jsx
import React, { useState } from "react";
import { Button, CircularProgress, Alert } from "@mui/material";
import { api } from "../../services/api"; // your axios instance

const SubmitMasterSlipButton = ({ betslipMatches, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmitMasterSlip = async () => {
    if (betslipMatches.length === 0) {
      setMessage({ type: "error", text: "Betslip is empty" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        stake: 100, // You can make this configurable later
        matches: betslipMatches.map((match) => ({
          match_id: match.id,
          markets: match.selectedMarkets || [], // Ensure this is populated when adding to betslip
        })),
      };

      const response = await api.post("/master-slips", payload);

      if (response.success) {
        setMessage({
          type: "success",
          text: "Master Slip submitted! Generating alternatives...",
        });
        if (onSuccess) onSuccess(response.data);
      }
    } catch (err) {
      const text =
        err.response?.data?.message || "Failed to submit Master Slip";
      setMessage({ type: "error", text });
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={3}>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        onClick={handleSubmitMasterSlip}
        disabled={loading || betslipMatches.length === 0}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? "Submitting..." : "Generate 100+ Alternative Slips"}
      </Button>
    </Box>
  );
};

export default SubmitMasterSlipButton;
