// src/components/common/ConfirmActionDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";

const ConfirmActionDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
  confirmText = "Confirm",
  confirmColor = "primary",
  icon: Icon, // Optional icon to pass in
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 3, p: 1, width: "100%", maxWidth: "400px" },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {Icon && (
          <Icon color={confirmColor === "error" ? "error" : "primary"} />
        )}
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ color: "text.primary", mb: 1 }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          autoFocus
          disabled={loading}
          sx={{ minWidth: "100px", borderRadius: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog;
