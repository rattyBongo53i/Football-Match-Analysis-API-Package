import { styled, keyframes } from "@mui/material/styles";
import { Paper, Box, Typography, Chip } from "@mui/material";

// --- Keyframes ---
export const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-15px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const pulseStatus = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// --- Components ---

/**
 * 1. MAIN SLIP CARD
 * Uses a "Frosted Glass" effect. High transparency, heavy blur.
 */
export const StyledSlipCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  borderRadius: "20px",
  padding: theme.spacing(3),
  background: "rgba(255, 255, 255, 0.6)", // High transparency
  backdropFilter: "blur(14px) saturate(160%)", // Frosted glass effect
  border: "1px solid rgba(255, 255, 255, 0.4)", // White edge highlight
  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.05)", // Soft organic shadow
  transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", // Springy feel
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 20px 40px -12px rgba(106, 27, 154, 0.12)",
    background: "rgba(255, 255, 255, 0.8)",
    borderColor: "rgba(106, 27, 154, 0.2)",
  },
}));

/**
 * 2. SLIP HEADER SECTION
 */
export const SlipHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
}));

/**
 * 3. MATCH ROW ITEM
 * Subtle gray backgrounds for match rows within the slip.
 */
export const MatchRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  borderRadius: "12px",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  marginBottom: theme.spacing(1),
  animation: `${slideIn} 0.5s ease forwards`,
  "&:hover": {
    backgroundColor: "rgba(106, 27, 154, 0.03)",
  },
}));

/**
 * 4. ODDS & STAKE BADGE
 * Minimalist container for the numbers.
 */
export const StatsBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.5),
  borderRadius: "10px",
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
}));

/**
 * 5. CONFIDENCE INDICATOR
 * Using the secondary teal/cyan for a fresh look.
 */
export const ConfidenceBar = styled(Box)(({ theme, value }) => ({
  height: "6px",
  width: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.05)",
  borderRadius: "3px",
  marginTop: theme.spacing(1),
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: `${value}%`,
    borderRadius: "3px",
    background:
      value > 75
        ? "linear-gradient(90deg, #00BFA5, #1DE9B6)"
        : "linear-gradient(90deg, #6A1B9A, #9C27B0)",
    transition: "width 1s ease-in-out",
  },
}));

/**
 * 6. STATUS CHIP
 */
export const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 700,
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderRadius: "8px",
  animation: status === "live" ? `${pulseStatus} 2s infinite` : "none",
  backgroundColor:
    status === "won" ? "rgba(0, 191, 165, 0.1)" : "rgba(0, 0, 0, 0.05)",
  color: status === "won" ? "#00796B" : "#636366",
  border: "none",
}));
