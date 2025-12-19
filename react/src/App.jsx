import React, { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import router from "./routes";
import { RouterProvider } from "react-router-dom";
import { BetslipProvider, useBetslip } from "./contexts/BetslipContext"; // ✅ Import useBetslip
import { JobProvider } from "./contexts/JobContext";
import BetslipDrawer from "./components/betslip/BetslipDrawer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import './global.css'
// Separate component for the betslip button that uses the hook
function BetslipButton({ setBetslipOpen }) {
  const { betslipMatches } = useBetslip(); // ✅ Now inside provider context

  return (
    <Button
      variant="contained"
      color="secondary"
      size="large"
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        borderRadius: "50%",
        width: 56,
        height: 56,
        minWidth: 56,
        zIndex: 1300,
      }}
      onClick={() => setBetslipOpen(true)}
    >
      <ShoppingCartIcon />
      {betslipMatches.length > 0 && (
        <Chip
          label={betslipMatches.length}
          color="primary"
          size="small"
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            fontSize: "0.75rem",
            height: 20,
            minWidth: 20,
          }}
        />
      )}
    </Button>
  );
}

function AppContent() {
  const [betslipOpen, setBetslipOpen] = useState(false);

  return (
    <>
      <RouterProvider router={router} />
      <BetslipButton setBetslipOpen={setBetslipOpen} />
      <BetslipDrawer open={betslipOpen} onClose={() => setBetslipOpen(false)} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <JobProvider>
        <BetslipProvider>
          <AppContent />
        </BetslipProvider>
      </JobProvider>
    </ThemeProvider>
  );
}

export default App;
