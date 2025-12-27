// src/pages/MasterSlipAnalysis/components/TabPanel.jsx
import React from "react";
import { Box, Fade } from "@mui/material";

const TabPanel = ({ children, value, index }) => (
  <Fade in={value === index} timeout={300}>
    <div hidden={value !== index} style={{ width: "100%" }}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  </Fade>
);

export default TabPanel;
