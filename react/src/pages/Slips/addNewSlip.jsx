import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  AttachMoney,
  CurrencyExchange,
  SportsSoccer,
} from "@mui/icons-material";
import slipApi from "../../services/api/slipApi";
import ConfirmActionDialog from "../slip-detail-components/ConfirmActionDialog";

const CreateSlipModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  // State for new slip
  const [newSlip, setNewSlip] = useState({
    name: "",
    stake: 0,
    currency: "USD",
  });

  const [errors, setErrors] = useState({});

  // State for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const validate = () => {
    const newErrors = {};

    if (!newSlip.name?.trim()) {
      newErrors.name = "Slip name is required";
    }

    if (!newSlip.stake || newSlip.stake <= 0) {
      newErrors.stake = "Valid stake amount is required";
    }

    if (!newSlip.currency) {
      newErrors.currency = "Currency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setNewSlip((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSlip = async () => {
    if (!validate()) return;

    setConfirmDialogOpen(true);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);

    try {
      // Format the slip data for API
      const slipData = {
        name: newSlip.name,
        stake: parseFloat(newSlip.stake),
        currency: newSlip.currency,
        matches: [], // Empty matches array - matches will be added on a different page
      };

      // Call the API
      const response = await slipApi.createSlip(slipData);

      // Show success message
      setSnackbar({
        open: true,
        message: "Slip created successfully!",
        severity: "success",
      });

      // Close confirmation dialog
      setConfirmDialogOpen(false);

      // Navigate to the slip detail page for adding matches
      const slipId = response.data?.id || response.data?.data?.id;
      if (slipId) {
        setTimeout(() => {
          navigate(`/slips/${slipId}`);
          onClose(); // Close the modal
        }, 1500);
      } else {
        // If no ID returned, navigate to slips list
        setTimeout(() => {
          navigate("/slips");
          onClose(); // Close the modal
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating slip:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          "Failed to create slip. Please try again.",
        severity: "error",
      });
      setConfirmDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseModal = () => {
    // Reset form state
    setNewSlip({
      name: "",
      stake: 0,
      currency: "USD",
    });
    setErrors({});
    onClose();
  };

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  ];

  return (
    <>
      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Create New Slip</Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Basic Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              Basic Information
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Create a slip first, then add matches on the next page
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slip Name"
                  value={newSlip.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  placeholder="Enter a name for your slip"
                  autoFocus
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stake Amount"
                  type="number"
                  InputProps={{
                    startAdornment: (
                      <AttachMoney sx={{ mr: 1, opacity: 0.5 }} />
                    ),
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  value={newSlip.stake || ""}
                  onChange={(e) =>
                    handleFieldChange("stake", parseFloat(e.target.value) || 0)
                  }
                  error={!!errors.stake}
                  helperText={errors.stake}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.currency}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={newSlip.currency || ""}
                    onChange={(e) =>
                      handleFieldChange("currency", e.target.value)
                    }
                    label="Currency"
                    startAdornment={
                      <CurrencyExchange sx={{ mr: 1, opacity: 0.5 }} />
                    }
                  >
                    {currencies.map((currency) => (
                      <MenuItem
                        key={currency.code}
                        value={currency.code}
                        sx={{ py: 1.5 }}
                      >
                        {currency.symbol} {currency.name} ({currency.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.currency && (
                    <Typography variant="caption" color="error">
                      {errors.currency}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> After creating this slip, you'll be
                redirected to add matches to it. You can always edit the slip
                details later.
              </Typography>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleCloseModal} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleCreateSlip}
            variant="contained"
            color="primary"
          >
            Create Slip
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onClose={() => !loading && setConfirmDialogOpen(false)}
        onConfirm={handleConfirmCreate}
        title="Create New Slip"
        message={
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to create this slip?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Slip Name:</strong> {newSlip.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Stake:</strong> {newSlip.stake} {newSlip.currency}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You'll be redirected to add matches after creation.
            </Typography>
          </Box>
        }
        loading={loading}
        confirmText="Create Slip"
        confirmColor="primary"
        icon={SportsSoccer}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateSlipModal;
