// src/pages/MasterSlipAnalysis/components/ThemeProvider.jsx
import { keyframes } from "@mui/system";

export const DARK_THEME = {
  palette: {
    background: {
      primary: "#0f1215",
      surface1: "#161b22",
      surface2: "#1d2229",
      surface3: "#242a33",
      overlay: "rgba(22, 27, 34, 0.8)",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a0aec0",
      tertiary: "#718096",
      accent: "#38bdf8",
    },
    status: {
      draft: "#38bdf8",
      active: "#10b981",
      won: "#10b981",
      lost: "#ef4444",
      pending: "#f59e0b",
    },
    accents: {
      primary: "#6366f1",
      secondary: "#10b981",
      tertiary: "#8b5cf6",
      highlight: "#f59e0b",
    },
    gradients: {
      mlButton:
        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
      success: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
      warning: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
      danger: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
      surface: "linear-gradient(180deg, #1d2229 0%, #161b22 100%)",
    },
  },
  shadows: {
    surface1:
      "0px 2px 8px rgba(0, 0, 0, 0.24), 0px 1px 4px rgba(0, 0, 0, 0.16)",
    surface2:
      "0px 4px 16px rgba(0, 0, 0, 0.32), 0px 2px 8px rgba(0, 0, 0, 0.24)",
    surface3:
      "0px 8px 32px rgba(0, 0, 0, 0.4), 0px 4px 16px rgba(0, 0, 0, 0.32)",
    glow: "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(99, 102, 241, 0.2)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
    },
    h3: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.57 },
    caption: { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 },
    mono: {
      fontFamily:
        "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
    },
  },
  shape: {
    borderRadius: {
      xs: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
      pill: "9999px",
      circle: "50%",
    },
  },
  spacing: (factor) => `${0.5 * factor}rem`,
};

export default DARK_THEME;
