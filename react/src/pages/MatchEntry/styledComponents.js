import { styled, keyframes } from "@mui/material/styles";

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

// Main Container with Gradient
export const GradientContainer = styled("div")(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.background.paper} 0%, 
    #f3e5f5 30%, 
    #f1f8e9 70%, 
    ${theme.palette.background.paper} 100%)`,
  minHeight: "100vh",
  padding: theme.spacing(3),
  animation: `${glow} 15s ease infinite`,
  backgroundSize: "400% 400%",
}));

// Styled Paper with Purple Border
export const StyledPaper = styled("div")(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: "24px",
  border: `2px solid ${theme.palette.primary.light}`,
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  boxShadow: `0 20px 60px rgba(156, 39, 176, 0.15),
              0 5px 15px rgba(156, 39, 176, 0.05)`,
  animation: `${fadeIn} 0.8s ease-out`,
  "&:hover": {
    boxShadow: `0 25px 70px rgba(156, 39, 176, 0.25),
                0 8px 20px rgba(156, 39, 176, 0.1)`,
    transform: "translateY(-2px)",
    transition: "all 0.3s ease",
  },
}));

// Gradient Button
export const GradientButton = styled("button")(({ theme, variant }) => ({
  background:
    variant === "contained"
      ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
      : "transparent",
  border:
    variant === "outlined" ? `2px solid ${theme.palette.primary.main}` : "none",
  color: variant === "outlined" ? theme.palette.primary.main : "white",
  borderRadius: "50px",
  padding: "12px 32px",
  fontWeight: 600,
  textTransform: "none",
  letterSpacing: "0.5px",
  transition: "all 0.3s ease",
  "&:hover": {
    background:
      variant === "contained"
        ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`
        : "rgba(156, 39, 176, 0.08)",
    transform: "translateY(-2px)",
    boxShadow: `0 10px 30px rgba(156, 39, 176, 0.3)`,
  },
  "&.Mui-disabled": {
    background: variant === "contained" ? "#e0e0e0" : "transparent",
    color: "#9e9e9e",
  },
}));

// Styled Card for Market Items
export const MarketCard = styled("div")(({ theme }) => ({
  borderRadius: "16px",
  border: `1px solid ${theme.palette.divider}`,
  background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    borderColor: theme.palette.primary.main,
    boxShadow: `0 12px 40px rgba(156, 39, 176, 0.15)`,
  },
}));

// Styled TextField
export const StyledTextField = styled("div")(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    transition: "all 0.3s ease",
    "&:hover": {
      "& fieldset": {
        borderColor: theme.palette.primary.light,
      },
    },
    "&.Mui-focused": {
      "& fieldset": {
        borderWidth: "2px",
        borderColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
}));

// Stepper Styling
export const StyledStepper = styled("div")(({ theme }) => ({
  "& .MuiStepLabel-root .Mui-completed": {
    color: theme.palette.primary.main,
  },
  "& .MuiStepLabel-root .Mui-active": {
    color: theme.palette.secondary.main,
    fontWeight: 600,
  },
  "& .MuiStepLabel-label": {
    fontWeight: 500,
    color: theme.palette.text.secondary,
    "&.Mui-active": {
      color: theme.palette.secondary.main,
      fontWeight: 600,
    },
    "&.Mui-completed": {
      color: theme.palette.primary.main,
    },
  },
}));

// Step Icon Container
export const StepIconContainer = styled("div")(
  ({ theme, active, completed }) => ({
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: completed
      ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
      : active
        ? `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`
        : theme.palette.grey[300],
    color: completed || active ? "white" : theme.palette.grey[500],
    fontWeight: "bold",
    boxShadow: active ? `0 0 0 8px rgba(255, 235, 59, 0.2)` : "none",
    animation: active ? `${pulse} 2s infinite` : "none",
  })
);

// VS Badge Component
export const VsBadge = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: "white",
  fontWeight: "bold",
  fontSize: "1.2rem",
  boxShadow: `0 4px 20px rgba(156, 39, 176, 0.3)`,
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: "50%",
    zIndex: -1,
    filter: "blur(10px)",
    opacity: 0.5,
  },
}));

// Header Component
export const Header = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  borderRadius: "20px",
  background: `linear-gradient(90deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.primary.dark} 100%)`,
  color: "white",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%239C27B0" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")`',
    opacity: 0.1,
  },
}));
