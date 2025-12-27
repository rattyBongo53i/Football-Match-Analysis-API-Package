// src/pages/MasterSlipAnalysis/components/MLGenerationButton.jsx
import React, { useState } from "react";
import { Button, Box, Typography, Stack, Tooltip } from "@mui/material";
import { AutoGraph } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import DARK_THEME from "./ThemeProvider";
import { pulseGlow, spinSlow, shimmer } from "./utils/animations";

const MLGenerationButton = ({ onRun, loading }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip
      title="Generate optimized slip using machine learning"
      arrow
      placement="top"
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          my: 4,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: DARK_THEME.palette.gradients.mlButton,
            filter: "blur(40px)",
            opacity: 0.2,
            animation: `${pulseGlow} 3s infinite`,
          }}
        />
        <Button
          onClick={onRun}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={loading}
          sx={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: DARK_THEME.palette.gradients.mlButton,
            color: "white",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            border: `3px solid ${alpha("#ffffff", 0.2)}`,
            boxShadow: `0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
            position: "relative",
            overflow: "hidden",
            animation: loading ? `${spinSlow} 3s linear infinite` : "none",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: `0 0 60px rgba(139, 92, 246, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.15)`,
              "& .button-content": { transform: "translateY(-2px)" },
              "& .button-icon": { transform: "scale(1.1)" },
            },
            "&:active": { transform: "scale(0.98)" },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              animation: `${shimmer} 3s infinite linear`,
            },
          }}
        >
          <Stack
            spacing={1}
            alignItems="center"
            className="button-content"
            sx={{ transition: "transform 0.3s ease" }}
          >
            <AutoGraph
              className="button-icon"
              sx={{ fontSize: 36, mb: 1, transition: "transform 0.3s ease" }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="button"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  display: "block",
                }}
              >
                Run ML
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  opacity: 0.9,
                  display: "block",
                }}
              >
                Slip Generation
              </Typography>
            </Box>
          </Stack>
        </Button>
      </Box>
    </Tooltip>
  );
};

export default MLGenerationButton;
