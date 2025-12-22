// components/betslip/AddToBetslipButton.jsx
import React, { useState } from "react";
import {
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  ReceiptLong as SlipIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useBetslip } from "../../contexts/BetslipContext";

const AddToBetslipButton = ({
  match,
  size = "medium",
  variant = "outlined",
}) => {
  const {
    addMatchToBetslip,
    isMatchInBetslip,
    getActiveSlips,
    getCurrentSlipId,
    setCurrentSlipId,
    createNewSlip,
  } = useBetslip();

  const [selectingSlip, setSelectingSlip] = useState(false);
  const [adding, setAdding] = useState(false);

  const isInBetslip = isMatchInBetslip(match.id);
  const currentSlipId = getCurrentSlipId();
  const activeSlips = getActiveSlips();

  const handleAdd = async (slipId = null) => {
    if (isInBetslip) return;

    setAdding(true);
    try {
      await addMatchToBetslip(match, slipId);
      setSelectingSlip(false);
    } catch (error) {
      console.error("Failed to add match:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleOpenSelection = () => {
    if (isInBetslip) return;

    if (currentSlipId) {
      handleAdd(currentSlipId);
    } else {
      setSelectingSlip(true);
    }
  };

  const handleCreateNew = async () => {
    setAdding(true);
    try {
      const { success, slip } = await createNewSlip({ name: "New Slip" });
      if (success) {
        handleAdd(slip.id);
      }
    } finally {
      setAdding(false);
    }
  };

  if (isInBetslip) {
    return (
      <Tooltip title="Already in betslip">
        <Chip
          icon={<CheckIcon />}
          label="In Betslip"
          color="success"
          variant="outlined"
          size={size}
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={adding ? <CircularProgress size={20} /> : <AddIcon />}
        onClick={handleOpenSelection}
        disabled={adding || isInBetslip}
      >
        {adding ? "Adding..." : "Add to Betslip"}
      </Button>

      <Dialog
        open={selectingSlip}
        onClose={() => setSelectingSlip(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Choose a Slip</Typography>
            <IconButton onClick={() => setSelectingSlip(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {activeSlips.length === 0 ? (
            <Box textAlign="center" py={3}>
              <SlipIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                No active slips yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                disabled={adding}
              >
                Create New Slip
              </Button>
            </Box>
          ) : (
            <List>
              {activeSlips.map((slip) => (
                <ListItem
                  key={slip.id}
                  button
                  onClick={() => handleAdd(slip.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <ListItemText
                    primary={slip.name || `Slip #${slip.id}`}
                    secondary={`${slip.matches_count || 0} matches • ${slip.status || "active"}`}
                  />
                  {slip.id === currentSlipId && (
                    <ListItemSecondaryAction>
                      <Chip label="Current" size="small" color="primary" />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectingSlip(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            disabled={adding}
          >
            Create New Slip
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddToBetslipButton;
