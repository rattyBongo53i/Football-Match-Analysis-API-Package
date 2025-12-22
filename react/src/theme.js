import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6A1B9A", // Elegant Deep Purple
      light: "#E1BEE7",
      dark: "#4A148C",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#00BFA5", // Modern Teal/Cyan
      light: "#B2DFDB",
      dark: "#00796B",
      contrastText: "#FFFFFF",
    },
    // Custom Gray Scale for Glass layers
    background: {
      default: "#F8F9FC", // Off-white/Ice Blue tint
      paper: "#FFFFFF",
      glass: "rgba(255, 255, 255, 0.7)",
    },
    text: {
      primary: "#1C1C1E", // Soft Black
      secondary: "#636366", // Medium Gray
      disabled: "#AEAEB2",
    },
    divider: "rgba(0, 0, 0, 0.05)",
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.04em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: {
    borderRadius: 16, // Softer, more modern corners
  },
  components: {
    // 1. GLOBAL RESET & SCROLLBARS
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F8F9FC",
          backgroundImage: `radial-gradient(at 0% 0%, rgba(106, 27, 154, 0.03) 0, transparent 50%), 
                            radial-gradient(at 50% 0%, rgba(0, 191, 165, 0.03) 0, transparent 50%)`,
          backgroundAttachment: "fixed",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#D1D1D6",
            borderRadius: "10px",
            border: "2px solid #F8F9FC",
          },
        },
      },
    },
    // 2. MODERN GLASS CARDS
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255, 255, 255, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        elevation1: {
          boxShadow: "0 4px 20px -5px rgba(0, 0, 0, 0.05)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    // 3. SPRINGY BUTTONS
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)", // Spring effect
          "&:hover": {
            transform: "scale(1.02) translateY(-1px)",
            boxShadow: "0 8px 25px -5px rgba(106, 27, 154, 0.25)",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)",
        },
      },
    },
    // 4. GLASS INPUT FIELDS
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            },
            "&.Mui-focused": {
              backgroundColor: "#FFFFFF",
              boxShadow: "0 0 0 4px rgba(106, 27, 154, 0.1)",
              "& fieldset": { borderWidth: "1px !important" },
            },
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.08)",
              borderRadius: 12,
            },
          },
        },
      },
    },
    // 5. MODERN TABS
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
          backgroundColor: "rgba(0, 0, 0, 0.03)",
          borderRadius: 12,
          padding: 4,
        },
        indicator: {
          height: "100%",
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          zIndex: 1,
          minHeight: 36,
          borderRadius: 10,
          transition: "color 0.3s",
          "&.Mui-selected": { color: "#6A1B9A" },
        },
      },
    },
  },
});

export default theme;
