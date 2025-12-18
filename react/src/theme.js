// frontend/src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9c27b0", // Purple
      light: "#d05ce3",
      dark: "#6a1b9a",
    },
    secondary: {
      main: "#cddc39", // Lemon Green
      light: "#ffff6e",
      dark: "#99aa00",
    },
    // Beautiful shades of gray for background
    background: {
      default: "#0a0a0a", // Very dark gray - almost black
      paper: "#1a1a1a", // Dark charcoal
      level1: "#2a2a2a", // Medium dark gray
      level2: "#333333", // Medium gray for cards
    },
    // Black and gray text palette
    text: {
      primary: "#000000", // Pure black for main text
      secondary: "#333333", // Dark gray for secondary text
      disabled: "#666666", // Medium gray for disabled
      hint: "#555555", // Hint text
      contrast: "#ffffff", // White for contrast on dark backgrounds
    },
    // Gray accent colors
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
    error: {
      main: "#f44336",
      light: "#e57373",
      dark: "#d32f2f",
    },
    warning: {
      main: "#ff9800",
      light: "#ffb74d",
      dark: "#f57c00",
    },
    info: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
    },
    success: {
      main: "#4caf50",
      light: "#81c784",
      dark: "#388e3c",
    },
    divider: "rgba(0, 0, 0, 0.15)", // Darker divider
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 800,
      lineHeight: 1.2,
      color: "#000000", // Black for all headings
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#000000",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.4,
      color: "#000000",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.75,
      color: "#333333", // Dark gray
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.57,
      color: "#333333",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#000000", // Black body text
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#222222", // Near black
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "none",
      color: "#000000",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.66,
      color: "#555555",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      lineHeight: 2.66,
      color: "#666666",
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  // Enhanced shadows for better depth and visibility
  shadows: [
    "none",
    "0px 1px 3px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
    "0px 1px 5px rgba(0, 0, 0, 0.2), 0px 2px 2px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12)",
    "0px 1px 8px rgba(0, 0, 0, 0.2), 0px 3px 4px rgba(0, 0, 0, 0.14), 0px 3px 3px -2px rgba(0, 0, 0, 0.12)",
    "0px 2px 4px -1px rgba(0, 0, 0, 0.25), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 1px 10px rgba(0, 0, 0, 0.12)",
    "0px 3px 5px -1px rgba(0, 0, 0, 0.3), 0px 5px 8px rgba(0, 0, 0, 0.14), 0px 1px 14px rgba(0, 0, 0, 0.12)",
    "0px 3px 5px -1px rgba(0, 0, 0, 0.3), 0px 6px 10px rgba(0, 0, 0, 0.14), 0px 1px 18px rgba(0, 0, 0, 0.12)",
    "0px 4px 5px -2px rgba(0, 0, 0, 0.3), 0px 7px 10px 1px rgba(0, 0, 0, 0.14), 0px 2px 16px 1px rgba(0, 0, 0, 0.12)",
    "0px 5px 5px -3px rgba(0, 0, 0, 0.3), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)",
    "0px 5px 6px -3px rgba(0, 0, 0, 0.3), 0px 9px 12px 1px rgba(0, 0, 0, 0.14), 0px 3px 16px 2px rgba(0, 0, 0, 0.12)",
    "0px 6px 6px -3px rgba(0, 0, 0, 0.3), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12)",
    "0px 6px 7px -4px rgba(0, 0, 0, 0.3), 0px 11px 15px 1px rgba(0, 0, 0, 0.14), 0px 4px 20px 3px rgba(0, 0, 0, 0.12)",
    "0px 7px 8px -4px rgba(0, 0, 0, 0.35), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12)",
    "0px 7px 8px -4px rgba(0, 0, 0, 0.35), 0px 13px 19px 2px rgba(0, 0, 0, 0.14), 0px 5px 24px 4px rgba(0, 0, 0, 0.12)",
    "0px 7px 9px -4px rgba(0, 0, 0, 0.35), 0px 14px 21px 2px rgba(0, 0, 0, 0.14), 0px 5px 26px 4px rgba(0, 0, 0, 0.12)",
    "0px 8px 9px -5px rgba(0, 0, 0, 0.35), 0px 15px 22px 2px rgba(0, 0, 0, 0.14), 0px 6px 28px 5px rgba(0, 0, 0, 0.12)",
    "0px 8px 10px -5px rgba(0, 0, 0, 0.4), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)",
    "0px 8px 11px -5px rgba(0, 0, 0, 0.4), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12)",
    "0px 9px 11px -5px rgba(0, 0, 0, 0.4), 0px 18px 28px 2px rgba(0, 0, 0, 0.14), 0px 7px 34px 6px rgba(0, 0, 0, 0.12)",
    "0px 9px 12px -6px rgba(0, 0, 0, 0.4), 0px 19px 29px 2px rgba(0, 0, 0, 0.14), 0px 7px 36px 6px rgba(0, 0, 0, 0.12)",
    "0px 10px 13px -6px rgba(0, 0, 0, 0.4), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12)",
    "0px 10px 13px -6px rgba(0, 0, 0, 0.4), 0px 21px 33px 3px rgba(0, 0, 0, 0.14), 0px 8px 40px 7px rgba(0, 0, 0, 0.12)",
    "0px 10px 14px -6px rgba(0, 0, 0, 0.4), 0px 22px 35px 3px rgba(0, 0, 0, 0.14), 0px 8px 42px 7px rgba(0, 0, 0, 0.12)",
    "0px 11px 14px -7px rgba(0, 0, 0, 0.45), 0px 23px 36px 3px rgba(0, 0, 0, 0.14), 0px 9px 44px 8px rgba(0, 0, 0, 0.12)",
    "0px 11px 15px -7px rgba(0, 0, 0, 0.45), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0a0a0a",
          color: "#000000",
          scrollbarColor: "#424242 #1a1a1a",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#1a1a1a",
            width: "12px",
            height: "12px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            backgroundColor: "#424242",
            border: "2px solid #1a1a1a",
            minHeight: 24,
            minWidth: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
            {
              backgroundColor: "#616161",
            },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
            {
              backgroundColor: "#757575",
            },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#616161",
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#1a1a1a",
          },
          "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
            backgroundColor: "#1a1a1a",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1a1a1a",
          color: "#000000",
          transition: "all 0.2s ease-in-out",
          "&.elevated": {
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.35)",
          },
        },
        elevation1: {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
        },
        elevation2: {
          boxShadow: "0px 3px 12px rgba(0, 0, 0, 0.3)",
        },
        elevation3: {
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.35)",
        },
      },
      defaultProps: {
        elevation: 1,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 20px",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
          },
          "&:active": {
            transform: "translateY(0px)",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
          },
        },
        contained: {
          boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)",
          "&:hover": {
            boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.4)",
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },
        text: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#2a2a2a", // Slightly lighter than paper
          backgroundImage: "none",
          color: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.3)",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#2a2a2a",
            color: "#000000",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#333333",
            },
            "&.Mui-focused": {
              backgroundColor: "#333333",
              boxShadow: "0 0 0 2px rgba(156, 39, 176, 0.2)",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.15)",
              borderWidth: 2,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.25)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#9c27b0",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#666666",
            "&.Mui-focused": {
              color: "#9c27b0",
              fontWeight: 600,
            },
          },
          "& .MuiInputBase-input": {
            color: "#000000",
            "&::placeholder": {
              color: "#666666",
              opacity: 1,
            },
          },
          "& .MuiFormHelperText-root": {
            color: "#666666",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#2a2a2a",
          color: "#000000",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.15)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.25)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9c27b0",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#666666",
          "&.Mui-focused": {
            color: "#9c27b0",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1a1a1a",
          boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.4)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "2px 0 12px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#000000",
          "&.MuiTableCell-head": {
            color: "#000000",
            fontWeight: 700,
            backgroundColor: "#2a2a2a",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.2)",
          "&:hover": {
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.3)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
          "& .MuiAlert-icon": {
            fontSize: "1.25rem",
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          fontSize: "0.75rem",
          color: "#ffffff",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
        },
        arrow: {
          color: "rgba(26, 26, 26, 0.95)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2a2a2a",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "& .MuiSlider-track": {
            backgroundColor: "#9c27b0",
          },
          "& .MuiSlider-thumb": {
            backgroundColor: "#9c27b0",
            boxShadow: "0px 2px 8px rgba(156, 39, 176, 0.4)",
            "&:hover": {
              boxShadow: "0px 4px 12px rgba(156, 39, 176, 0.6)",
            },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#9c27b0",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#9c27b0",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          "&.Mui-checked": {
            color: "#9c27b0",
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          "&.Mui-checked": {
            color: "#9c27b0",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "#2a2a2a",
          borderRadius: 4,
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#9c27b0",
        },
      },
    },
  },
});

export default theme;
