import { styled, keyframes } from "@mui/material/styles";
import { Box, Paper, Button } from "@mui/material";

// --- Keyframes ---
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(156, 39, 176, 0); }
  100% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0); }
`;

export const glow = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;


/**
 * 3. GRADIENT BUTTON
 * Professional vibrant buttons that stand out on dark backgrounds.
 */
export const GradientButton = styled(Button)(({ theme, variant }) => ({
  background:
    variant === "contained"
      ? `linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)`
      : "rgba(255, 255, 255, 0.05)",
  border: variant === "outlined" ? `1px solid rgba(156, 39, 176, 0.5)` : "none",
  color: "#ffffff",
  borderRadius: "12px",
  padding: "10px 24px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    background:
      variant === "contained"
        ? `linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)`
        : "rgba(255, 255, 255, 0.1)",
    transform: "translateY(-2px)",
    boxShadow:
      variant === "contained" ? "0 8px 20px rgba(156, 39, 176, 0.4)" : "none",
  },
  "&.Mui-disabled": {
    background: "rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 0.3)",
  },
}));

/**
 * 4. MARKET CARD
 * Adjusted for the MarketItem grid density.
 */
export const MarketCard = styled(Box)(({ theme }) => ({
  borderRadius: "16px",
  padding: theme.spacing(2),
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.05)",
    transform: "translateY(-4px)",
    borderColor: "rgba(156, 39, 176, 0.4)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  },
}));

/**
 * 5. STEPPER STYLING
 * Ensure labels are visible on the dark background.
 */
export const StyledStepper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0, 4),
  "& .MuiStepLabel-label": {
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: 500,
    "&.Mui-active": { color: "#ffffff", fontWeight: 700 },
    "&.Mui-completed": { color: "#9c27b0" },
  },
  "& .MuiStepIcon-root": {
    color: "rgba(255, 255, 255, 0.1)",
    "&.Mui-active": { color: "#9c27b0" },
    "&.Mui-completed": { color: "#7b1fa2" },
  },
}));

/**
 * 6. HEADER
 * Enhanced with a subtle glass effect rather than a solid primary color.
 */
export const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "20px",
  background: "rgba(156, 39, 176, 0.1)",
  border: "1px solid rgba(156, 39, 176, 0.2)",
  marginBottom: theme.spacing(4),
  color: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

/**
 * 7. VS BADGE
 */
export const VsBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "rgba(156, 39, 176, 0.2)",
  border: "2px solid #9c27b0",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "1rem",
  boxShadow: "0 0 15px rgba(156, 39, 176, 0.4)",
}));

export const GradientContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "radial-gradient(circle at 0% 0%, #F8F9FC 0%, #E8EAF6 100%)",
  padding: theme.spacing(4),
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: "900px",
  padding: theme.spacing(5),
  borderRadius: "32px",
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.5)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
}));