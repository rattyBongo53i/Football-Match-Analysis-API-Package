import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light", // Changed from dark to light
    primary: {
      main: "#6A1B9A", // Deep purple
      light: "#9C4DCC",
      dark: "#38006B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#2E7D32", // Forest green
      light: "#60AD5E",
      dark: "#005005",
      contrastText: "#FFFFFF",
    },
    accent: {
      main: "#9C27B0", // Bright purple accent
      light: "#D05CE3",
      dark: "#6A1B9A",
    },
    accent2: {
      main: "#43A047", // Bright green accent
      light: "#76D275",
      dark: "#00701A",
    },
    // Beautiful shades of gray
    background: {
      default: "#F5F5F7", // Light gray - Apple style
      paper: "#FFFFFF", // Pure white for cards
      level1: "#FAFAFA", // Slightly off-white
      level2: "#F0F0F0", // Light gray for sections
      level3: "#E0E0E0", // Medium light gray
    },
    // Gray text palette for great contrast
    text: {
      primary: "#1A1A1A", // Near black for main text
      secondary: "#424242", // Dark gray for secondary text
      disabled: "#9E9E9E", // Medium gray for disabled
      hint: "#757575", // Hint text
    },
    // Gray shades for components
    grey: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
    // Status colors
    error: {
      main: "#D32F2F",
      light: "#EF5350",
      dark: "#C62828",
    },
    warning: {
      main: "#F57C00",
      light: "#FFB74D",
      dark: "#EF6C00",
    },
    info: {
      main: "#0288D1",
      light: "#4FC3F7",
      dark: "#01579B",
    },
    success: {
      main: "#388E3C",
      light: "#66BB6A",
      dark: "#1B5E20",
    },
    divider: "rgba(0, 0, 0, 0.08)", // Very subtle divider
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 800,
      lineHeight: 1.2,
      color: "#1A1A1A",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#1A1A1A",
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.4,
      color: "#1A1A1A",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1A1A1A",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1A1A1A",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1A1A1A",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.75,
      color: "#424242",
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.57,
      color: "#424242",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#1A1A1A",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#424242",
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.02em",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.66,
      color: "#757575",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      lineHeight: 2.66,
      letterSpacing: "0.1em",
      color: "#757575",
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  shadows: [
    "none",
    "0px 1px 2px rgba(0, 0, 0, 0.05)", // Very subtle
    "0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)",
    "0px 1px 4px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.04)",
    "0px 2px 4px rgba(0, 0, 0, 0.08), 0px 1px 5px rgba(0, 0, 0, 0.04)",
    "0px 3px 5px rgba(0, 0, 0, 0.08), 0px 1px 18px rgba(0, 0, 0, 0.04)",
    "0px 3px 5px rgba(0, 0, 0, 0.10), 0px 1px 18px rgba(0, 0, 0, 0.06)",
    "0px 4px 6px rgba(0, 0, 0, 0.10), 0px 2px 16px rgba(0, 0, 0, 0.08)",
    "0px 5px 7px rgba(0, 0, 0, 0.12), 0px 3px 20px rgba(0, 0, 0, 0.10)",
    "0px 6px 8px rgba(0, 0, 0, 0.12), 0px 4px 22px rgba(0, 0, 0, 0.12)",
    "0px 7px 9px rgba(0, 0, 0, 0.14), 0px 5px 24px rgba(0, 0, 0, 0.14)",
    "0px 8px 10px rgba(0, 0, 0, 0.16), 0px 6px 26px rgba(0, 0, 0, 0.16)",
    "0px 9px 11px rgba(0, 0, 0, 0.18), 0px 7px 28px rgba(0, 0, 0, 0.18)",
    "0px 10px 12px rgba(0, 0, 0, 0.20), 0px 8px 30px rgba(0, 0, 0, 0.20)",
    "0px 11px 13px rgba(0, 0, 0, 0.22), 0px 9px 32px rgba(0, 0, 0, 0.22)",
    "0px 12px 14px rgba(0, 0, 0, 0.24), 0px 10px 34px rgba(0, 0, 0, 0.24)",
    "0px 13px 15px rgba(0, 0, 0, 0.26), 0px 11px 36px rgba(0, 0, 0, 0.26)",
    "0px 14px 16px rgba(0, 0, 0, 0.28), 0px 12px 38px rgba(0, 0, 0, 0.28)",
    "0px 15px 17px rgba(0, 0, 0, 0.30), 0px 13px 40px rgba(0, 0, 0, 0.30)",
    "0px 16px 18px rgba(0, 0, 0, 0.32), 0px 14px 42px rgba(0, 0, 0, 0.32)",
    "0px 17px 19px rgba(0, 0, 0, 0.34), 0px 15px 44px rgba(0, 0, 0, 0.34)",
    "0px 18px 20px rgba(0, 0, 0, 0.36), 0px 16px 46px rgba(0, 0, 0, 0.36)",
    "0px 19px 21px rgba(0, 0, 0, 0.38), 0px 17px 48px rgba(0, 0, 0, 0.38)",
    "0px 20px 22px rgba(0, 0, 0, 0.40), 0px 18px 50px rgba(0, 0, 0, 0.40)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F5F7",
          color: "#1A1A1A",
          transition: "background-color 0.3s ease",
          scrollbarColor: "#BDBDBD #F5F5F7",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#F5F5F7",
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#BDBDBD",
            border: "2px solid #F5F5F7",
            minHeight: 24,
            minWidth: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#9E9E9E",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#757575",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#9E9E9E",
          },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#F5F5F7",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#FFFFFF",
          color: "#1A1A1A",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "1px solid rgba(0, 0, 0, 0.04)",
          "&.glass-effect": {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          },
          "&.betting-card": {
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)",
            border: "1px solid rgba(106, 27, 154, 0.1)",
            "&:hover": {
              borderColor: "rgba(106, 27, 154, 0.3)",
              boxShadow: "0 12px 40px rgba(106, 27, 154, 0.15)",
            },
          },
          "&.purple-gradient": {
            background: "linear-gradient(135deg, #6A1B9A 0%, #9C27B0 100%)",
            color: "#FFFFFF",
            border: "none",
          },
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 24px",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          },
          "&.Mui-disabled": {
            backgroundColor: "#F5F5F5",
            color: "#9E9E9E",
          },
        },
        contained: {
          "&.MuiButton-containedPrimary": {
            background: "linear-gradient(135deg, #6A1B9A 0%, #9C27B0 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5A0B8A 0%, #8C17A0 100%)",
            },
          },
          "&.MuiButton-containedSecondary": {
            background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #1E6D22 0%, #339037 100%)",
            },
          },
        },
        outlined: {
          borderWidth: 2,
          backgroundColor: "transparent",
          "&.MuiButton-outlinedPrimary": {
            borderColor: "#6A1B9A",
            color: "#6A1B9A",
            "&:hover": {
              backgroundColor: "rgba(106, 27, 154, 0.04)",
              borderWidth: 2,
            },
          },
          "&.MuiButton-outlinedSecondary": {
            borderColor: "#2E7D32",
            color: "#2E7D32",
            "&:hover": {
              backgroundColor: "rgba(46, 125, 50, 0.04)",
              borderWidth: 2,
            },
          },
        },
        text: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
          backgroundImage: "none",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
            borderColor: "rgba(106, 27, 154, 0.2)",
          },
          "& .MuiCardContent-root": {
            padding: 24,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#FAFAFA",
            },
            "&.Mui-focused": {
              backgroundColor: "#FFFFFF",
              boxShadow: "0 0 0 3px rgba(106, 27, 154, 0.1)",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.12)",
              borderWidth: 2,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.24)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#6A1B9A",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#757575",
            "&.Mui-focused": {
              color: "#6A1B9A",
              fontWeight: 600,
            },
          },
          "& .MuiInputBase-input": {
            color: "#1A1A1A",
            "&::placeholder": {
              color: "#9E9E9E",
              opacity: 1,
            },
          },
          "& .MuiFormHelperText-root": {
            color: "#757575",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.24)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6A1B9A",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#757575",
          "&.Mui-focused": {
            color: "#6A1B9A",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          color: "#1A1A1A",
          "&.MuiTableCell-head": {
            color: "#1A1A1A",
            fontWeight: 700,
            backgroundColor: "#FAFAFA",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          "&:hover": {
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
          "&.MuiChip-colorPrimary": {
            backgroundColor: "rgba(106, 27, 154, 0.1)",
            color: "#6A1B9A",
            borderColor: "rgba(106, 27, 154, 0.2)",
          },
          "&.MuiChip-colorSecondary": {
            backgroundColor: "rgba(46, 125, 50, 0.1)",
            color: "#2E7D32",
            borderColor: "rgba(46, 125, 50, 0.2)",
          },
          "&.MuiChip-colorSuccess": {
            backgroundColor: "rgba(56, 142, 60, 0.1)",
            color: "#388E3C",
          },
          "&.MuiChip-colorError": {
            backgroundColor: "rgba(211, 47, 47, 0.1)",
            color: "#D32F2F",
          },
          "&.MuiChip-colorWarning": {
            backgroundColor: "rgba(245, 124, 0, 0.1)",
            color: "#F57C00",
          },
          "&.MuiChip-colorInfo": {
            backgroundColor: "rgba(2, 136, 209, 0.1)",
            color: "#0288D1",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          "& .MuiAlert-icon": {
            fontSize: "1.25rem",
          },
        },
        standardSuccess: {
          backgroundColor: "rgba(56, 142, 60, 0.08)",
          color: "#1B5E20",
        },
        standardError: {
          backgroundColor: "rgba(211, 47, 47, 0.08)",
          color: "#C62828",
        },
        standardWarning: {
          backgroundColor: "rgba(245, 124, 0, 0.08)",
          color: "#EF6C00",
        },
        standardInfo: {
          backgroundColor: "rgba(2, 136, 209, 0.08)",
          color: "#01579B",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          fontSize: "0.75rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.16)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
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
          borderColor: "rgba(0, 0, 0, 0.06)",
          borderWidth: 1,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.16)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "#F0F0F0",
          borderRadius: 4,
        },
        bar: {
          borderRadius: 4,
          "&.MuiLinearProgress-barColorPrimary": {
            background: "linear-gradient(90deg, #6A1B9A 0%, #9C27B0 100%)",
          },
          "&.MuiLinearProgress-barColorSecondary": {
            background: "linear-gradient(90deg, #2E7D32 0%, #43A047 100%)",
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          "&.MuiCircularProgress-colorPrimary": {
            color: "#6A1B9A",
          },
          "&.MuiCircularProgress-colorSecondary": {
            color: "#2E7D32",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#6A1B9A",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#6A1B9A",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          "&.Mui-checked": {
            color: "#6A1B9A",
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          "&.Mui-checked": {
            color: "#6A1B9A",
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "& .MuiSlider-track": {
            backgroundColor: "#6A1B9A",
          },
          "& .MuiSlider-thumb": {
            backgroundColor: "#6A1B9A",
            boxShadow: "0 2px 8px rgba(106, 27, 154, 0.3)",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(106, 27, 154, 0.4)",
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#6A1B9A",
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          "&.Mui-selected": {
            color: "#6A1B9A",
          },
        },
      },
    },
  },
});

export default theme;