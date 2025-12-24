import React from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationSnackbar = ({ snackbar, onClose }) => (
  <Snackbar
    open={snackbar.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  >
    <Alert
      onClose={onClose}
      severity={snackbar.severity}
      sx={{ width: "100%" }}
    >
      {snackbar.message}
    </Alert>
  </Snackbar>
);

export default NotificationSnackbar;
