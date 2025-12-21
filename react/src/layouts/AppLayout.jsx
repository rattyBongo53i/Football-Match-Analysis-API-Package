import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Box } from "@mui/material"; // If using MUI

export default function AppLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "90vh",
        backgroundColor: "background.default", // MUI theme color
      }}
    >
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: 0, sm: "280px" }, // Responsive margin
          width: { xs: "100%", sm: "calc(100% - 280px)" },
          p: { xs: 2, sm: 3, md: 4 },
          transition: "margin 0.3s ease",
          minHeight: "100vh",
          backgroundColor: "background.paper", // MUI theme
          borderRadius: { xs: 0, sm: "12px 0 0 12px" }, // Rounded corners on right side
          boxShadow: { xs: "none", sm: 2 }, // Subtle shadow on desktop
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
