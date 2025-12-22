import { styled, Box, Typography } from "@mui/material";

/**
 * CurrencyChip - A high-visibility indicator for the currency type.
 * Uses a soft glow effect to stand out in the dark UI.
 */
export const CurrencyChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "rgba(156, 39, 176, 0.15)",
  border: "1px solid rgba(156, 39, 176, 0.3)",
  color: theme.palette.primary.light,
  fontWeight: 800,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "1px",
  backdropFilter: "blur(4px)",
}));

/**
 * FinancialMetric - A reusable container for data points like "Total Odds" or "EV".
 * Features a vertical layout with a subtle bottom-glow.
 */
export const FinancialMetric = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  minWidth: "120px",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(156, 39, 176, 0.4)",
  },
  "& .metric-label": {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  "& .metric-value": {
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#fff",
    fontFamily: '"Roboto Mono", monospace', // Monospace feels more "financial"
  },
}));

/**
 * Quick Utility for a modern glass divider
 */
export const GlassDivider = styled(Box)(() => ({
  height: "1px",
  width: "100%",
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
  margin: "16px 0",
}));
