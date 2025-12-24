import { createTheme, alpha } from "@mui/material/styles";

// Design tokens for better consistency - moved to top level
const designTokens = {
  colors: {
    // Primary Purple Scale
    purple: {
      50: "#F5E8FF",
      100: "#E1BEE7",
      200: "#CE93D8",
      300: "#BA68C8",
      400: "#AB47BC",
      500: "#6A1B9A",
      600: "#4A148C",
      700: "#38006B",
      800: "#2A0049",
      900: "#1B002E",
    },
    // Secondary Teal Scale
    teal: {
      50: "#E0F2F1",
      100: "#B2DFDB",
      200: "#80CBC4",
      300: "#4DB6AC",
      400: "#26A69A",
      500: "#00BFA5",
      600: "#00897B",
      700: "#00796B",
      800: "#00695C",
      900: "#004D40",
    },
    // Neutral Scale
    neutral: {
      50: "#F8F9FC",
      100: "#F1F3F9",
      200: "#E9ECF4",
      300: "#D1D1D6",
      400: "#AEAEB2",
      500: "#8E8E93",
      600: "#636366",
      700: "#3A3A3C",
      800: "#1C1C1E",
      900: "#0A0A0B",
    },
    // Semantic Colors
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3",
  },
  spacing: {
    unit: 8,
    borderRadius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      pill: 40,
      circle: "50%",
    },
  },
  shadows: {
    elevation: {
      1: "0 2px 8px rgba(0, 0, 0, 0.05)",
      2: "0 4px 20px -5px rgba(0, 0, 0, 0.08)",
      3: "0 8px 30px rgba(0, 0, 0, 0.12)",
      4: "0 12px 40px rgba(0, 0, 0, 0.16)",
      5: "0 20px 50px rgba(0, 0, 0, 0.20)",
    },
    glow: {
      primary: "0 8px 32px rgba(106, 27, 154, 0.25)",
      secondary: "0 8px 32px rgba(0, 191, 165, 0.25)",
    },
  },
  transitions: {
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};

// Pre-calculate commonly used values
const glassBackground = "rgba(255, 255, 255, 0.75)";
const subtleBackground = alpha(designTokens.colors.neutral[900], 0.03);
const hoverBackground = alpha(designTokens.colors.neutral[900], 0.04);
const primaryGradient = `linear-gradient(135deg, ${designTokens.colors.purple[500]} 0%, ${designTokens.colors.purple[400]} 100%)`;
const secondaryGradient = `linear-gradient(135deg, ${designTokens.colors.teal[500]} 0%, ${designTokens.colors.teal[400]} 100%)`;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: designTokens.colors.purple[500],
      light: designTokens.colors.purple[200],
      dark: designTokens.colors.purple[700],
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: designTokens.colors.teal[500],
      light: designTokens.colors.teal[200],
      dark: designTokens.colors.teal[700],
      contrastText: "#FFFFFF",
    },
    success: {
      main: designTokens.colors.success,
      light: alpha(designTokens.colors.success, 0.12),
    },
    warning: {
      main: designTokens.colors.warning,
      light: alpha(designTokens.colors.warning, 0.12),
    },
    error: {
      main: designTokens.colors.error,
      light: alpha(designTokens.colors.error, 0.12),
    },
    info: {
      main: designTokens.colors.info,
      light: alpha(designTokens.colors.info, 0.12),
    },
    background: {
      default: designTokens.colors.neutral[50],
      paper: "#FFFFFF",
      glass: glassBackground,
      subtle: designTokens.colors.neutral[100],
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[600],
      disabled: designTokens.colors.neutral[400],
      hint: alpha(designTokens.colors.neutral[900], 0.6),
    },
    divider: alpha(designTokens.colors.neutral[900], 0.08),
    action: {
      hover: alpha(designTokens.colors.neutral[900], 0.04),
      selected: alpha(designTokens.colors.purple[500], 0.08),
      disabled: alpha(designTokens.colors.neutral[900], 0.12),
    },
  },
  typography: {
    fontFamily:
      '"Inter", "SF Pro Display", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
      fontSize: "3.5rem",
      lineHeight: 1.1,
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
      fontSize: "2.75rem",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "2.25rem",
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
      fontSize: "1.75rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      letterSpacing: "-0.01em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      letterSpacing: "-0.005em",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "-0.01em",
      fontSize: "0.9375rem",
    },
    caption: {
      fontSize: "0.75rem",
      letterSpacing: "0.01em",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
  },
  shape: {
    borderRadius: designTokens.spacing.borderRadius.lg,
  },
  shadows: [
    "none",
    designTokens.shadows.elevation[1],
    designTokens.shadows.elevation[2],
    designTokens.shadows.elevation[3],
    designTokens.shadows.elevation[4],
    designTokens.shadows.elevation[5],
    ...Array(19).fill("none"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: designTokens.colors.neutral[50],
          backgroundImage: `
            radial-gradient(at 0% 0%, ${alpha(designTokens.colors.purple[500], 0.04)} 0px, transparent 50%),
            radial-gradient(at 50% 0%, ${alpha(designTokens.colors.teal[500], 0.04)} 0px, transparent 50%),
            radial-gradient(at 100% 0%, ${alpha(designTokens.colors.info, 0.03)} 0px, transparent 50%)
          `,
          backgroundAttachment: "fixed",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-track": {
            background: designTokens.colors.neutral[100],
            borderRadius: designTokens.spacing.borderRadius.sm,
          },
          "&::-webkit-scrollbar-thumb": {
            background: designTokens.colors.neutral[300],
            borderRadius: designTokens.spacing.borderRadius.sm,
            border: `2px solid ${designTokens.colors.neutral[100]}`,
            "&:hover": {
              background: designTokens.colors.neutral[400],
            },
          },
          "&::-webkit-scrollbar-corner": {
            background: designTokens.colors.neutral[100],
          },
        },
        html: {
          scrollBehavior: "smooth",
        },
        "::selection": {
          backgroundColor: alpha(designTokens.colors.purple[500], 0.2),
          color: designTokens.colors.purple[700],
        },
        "*:focus-visible": {
          outline: `2px solid ${alpha(designTokens.colors.purple[500], 0.5)}`,
          outlineOffset: "2px",
          borderRadius: designTokens.spacing.borderRadius.xs,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(designTokens.colors.neutral[900], 0.08)}`,
          transition: `all 0.3s ${designTokens.transitions.smooth}`,
          backgroundImage: "none",
        },
        outlined: {
          backgroundColor: glassBackground,
          backdropFilter: "blur(20px) saturate(180%)",
          boxShadow: designTokens.shadows.elevation[1],
          "&:hover": {
            boxShadow: designTokens.shadows.elevation[2],
            borderColor: alpha(designTokens.colors.neutral[900], 0.12),
          },
        },
        elevation1: {
          backgroundColor: glassBackground,
          backdropFilter: "blur(20px) saturate(180%)",
          boxShadow: designTokens.shadows.elevation[2],
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: designTokens.spacing.borderRadius.md,
          padding: "10px 24px",
          transition: `all 0.3s ${designTokens.transitions.spring}`,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: designTokens.shadows.glow.primary,
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        sizeSmall: {
          padding: "6px 16px",
          fontSize: "0.875rem",
        },
        sizeLarge: {
          padding: "14px 32px",
          fontSize: "1rem",
        },
        containedPrimary: {
          background: primaryGradient,
          "&:hover": {
            background: `linear-gradient(135deg, ${designTokens.colors.purple[600]} 0%, ${designTokens.colors.purple[500]} 100%)`,
          },
        },
        containedSecondary: {
          background: secondaryGradient,
          "&:hover": {
            background: `linear-gradient(135deg, ${designTokens.colors.teal[600]} 0%, ${designTokens.colors.teal[500]} 100%)`,
          },
        },
        outlined: {
          borderWidth: "1.5px",
          backgroundColor: alpha(designTokens.colors.neutral[900], 0.02),
          "&:hover": {
            backgroundColor: hoverBackground,
            borderWidth: "1.5px",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: hoverBackground,
            transform: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: subtleBackground,
            transition: `all 0.2s ${designTokens.transitions.smooth}`,
            borderRadius: designTokens.spacing.borderRadius.md,
            "&:hover": {
              backgroundColor: alpha(designTokens.colors.neutral[900], 0.06),
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(designTokens.colors.neutral[900], 0.2),
              },
            },
            "&.Mui-focused": {
              backgroundColor: "#FFFFFF",
              boxShadow: `0 0 0 3px ${alpha(designTokens.colors.purple[500], 0.1)}`,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: designTokens.colors.purple[500],
                borderWidth: "2px",
              },
            },
            "&.Mui-error": {
              "&.Mui-focused": {
                boxShadow: `0 0 0 3px ${alpha(designTokens.colors.error, 0.1)}`,
              },
            },
            "&.Mui-disabled": {
              backgroundColor: alpha(designTokens.colors.neutral[900], 0.04),
            },
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(designTokens.colors.neutral[900], 0.1),
            transition: `border-color 0.2s ${designTokens.transitions.smooth}`,
          },
          "& .MuiInputLabel-root": {
            "&.Mui-focused": {
              color: designTokens.colors.purple[600],
              fontWeight: 500,
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
          backgroundColor: subtleBackground,
          borderRadius: designTokens.spacing.borderRadius.lg,
          padding: 4,
        },
        indicator: {
          height: "100%",
          borderRadius: designTokens.spacing.borderRadius.md,
          backgroundColor: "#FFFFFF",
          boxShadow: designTokens.shadows.elevation[1],
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          zIndex: 1,
          minHeight: 36,
          borderRadius: designTokens.spacing.borderRadius.md,
          transition: `all 0.3s ${designTokens.transitions.smooth}`,
          fontWeight: 500,
          "&.Mui-selected": {
            color: designTokens.colors.purple[600],
            fontWeight: 600,
          },
          "&:hover": {
            backgroundColor: hoverBackground,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: glassBackground,
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${alpha(designTokens.colors.neutral[900], 0.08)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: "hidden",
          "&:hover": {
            "& .MuiCardMedia-root": {
              transform: "scale(1.05)",
            },
          },
        },
      },
    },
    MuiCardMedia: {
      styleOverrides: {
        root: {
          transition: `transform 0.6s ${designTokens.transitions.smooth}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.spacing.borderRadius.pill,
          fontWeight: 500,
          "&.MuiChip-filledPrimary": {
            background: `linear-gradient(135deg, ${alpha(designTokens.colors.purple[500], 0.12)} 0%, ${alpha(designTokens.colors.purple[400], 0.12)} 100%)`,
            color: designTokens.colors.purple[700],
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(designTokens.colors.neutral[900], 0.06),
          borderRadius: designTokens.spacing.borderRadius.md,
        },
      },
    },
  },
});

// Add custom theme properties after theme creation
theme.custom = {
  shadows: designTokens.shadows,
  transitions: designTokens.transitions,
  borderRadius: designTokens.spacing.borderRadius,
  colors: designTokens.colors,
  glassEffect: {
    background: glassBackground,
    backdropFilter: "blur(20px) saturate(180%)",
    border: `1px solid ${alpha(designTokens.colors.neutral[900], 0.08)}`,
  },
  gradients: {
    primary: primaryGradient,
    secondary: secondaryGradient,
    subtle: `linear-gradient(135deg, ${alpha(designTokens.colors.neutral[100], 0.8)} 0%, ${alpha(designTokens.colors.neutral[50], 0.8)} 100%)`,
  },
  spacing: (factor) => `${designTokens.spacing.unit * factor}px`,
};

export default theme;
