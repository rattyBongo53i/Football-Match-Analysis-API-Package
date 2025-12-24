import React from "react";
import { Paper, Alert, Button } from "@mui/material";

const ErrorState = ({ error, onRetry, navigate }) => (
  <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
      sx={{ mb: 3 }}
    >
      {error || "Failed to load slip details"}
    </Alert>
    <Button
      variant="contained"
      onClick={() => navigate("/slips")}
      sx={{ textTransform: "none" }}
    >
      Back to Slips
    </Button>
  </Paper>
);

export default ErrorState;
