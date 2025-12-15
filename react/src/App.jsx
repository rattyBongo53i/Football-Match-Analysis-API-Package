import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import router from "./routes";
import { RouterProvider } from "react-router-dom"; // ✅ MISSING IMPOR
import { BetslipProvider } from "./contexts/BetslipContext";
import { JobProvider } from "./contexts/JobContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
