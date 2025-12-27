import React from "react";
import { Box, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import { AddCircle as AddCircleIcon } from "@mui/icons-material";

const ActionButtons = ({
  onEdit,
  onAnalyze,
  onDelete,
  onAddMatchesToSlip,
  matchesCount,
  onViewAnalysis,
}) => (
  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
    <Button
      variant="outlined"
      startIcon={<DeleteIcon />}
      onClick={onDelete}
      sx={{ textTransform: "none" }}
      color="error"
    >
      Delete Slip
    </Button>

    {matchesCount >= 2 && (
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onAnalyze}
        sx={{ textTransform: "none" }}
      >
        Run Analysis
      </Button>
    )}
    {matchesCount > 0 && (
      <Button
        variant="contained"
        color="secondary"
        startIcon={<AddCircleIcon />}
        onClick={onAddMatchesToSlip}
        sx={{ textTransform: "none" }}
      >
        Add Matches to Slip
      </Button>
    )}
    <Button
      variant="contained"
      startIcon={<EditIcon />}
      onClick={onEdit}
      sx={{ textTransform: "none" }}
    >
      Edit Slip
    </Button>

    {/* //add button to redirect to analysis page */}
    <Button
      variant="contained"
      color="warning"
      onClick={() => onViewAnalysis()}
      sx={{ textTransform: "none" }}
    >
      View Analysis
    </Button>
  </Box>
);

export default ActionButtons;
