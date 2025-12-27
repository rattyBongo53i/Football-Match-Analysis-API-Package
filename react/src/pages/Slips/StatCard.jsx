// src/pages/MasterSlipAnalysis/components/StatCard.jsx
import React from "react";
import { Card, CardContent, Box, Typography, Stack, Zoom } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DARK_THEME from "./ThemeProvider";

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, size = "medium" }) => (
  <Zoom in={true}>
    <Card
      sx={{
        height: "100%",
        borderRadius: DARK_THEME.shape.borderRadius.lg,
        backgroundColor: DARK_THEME.palette.background.surface2,
        border: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.5)}`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(color || DARK_THEME.palette.accents.primary, 0.3),
          boxShadow: DARK_THEME.shadows.surface2,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: DARK_THEME.shape.borderRadius.md,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(color || DARK_THEME.palette.accents.primary, 0.1),
                color: color || DARK_THEME.palette.accents.primary,
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: DARK_THEME.palette.text.secondary,
                fontWeight: 500,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
              }}
            >
              {title}
            </Typography>
          </Stack>
          <Typography
            variant={size === "large" ? "h3" : "h4"}
            sx={{
              fontWeight: 700,
              color: DARK_THEME.palette.text.primary,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: DARK_THEME.palette.text.tertiary,
                mt: 1,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  </Zoom>
);

export default StatCard;