import React from "react";
import { Button } from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";

const HeaderSection = ({ onBack }) => (
  <Button
    startIcon={<BackIcon />}
    onClick={onBack}
    sx={{ mb: 3, color: "#636366", textTransform: "none" }}
  >
    Back to Dashboard
  </Button>
);

export default HeaderSection;
