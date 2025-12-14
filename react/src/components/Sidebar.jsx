import React from "react";
import { NavLink } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  SportsSoccer,
  ReceiptLong,
  ListAlt,
  Dashboard,
} from "@mui/icons-material";

export default function Sidebar() {
  const navItems = [
    {
      path: "/",
      text: "Dashboard",
      icon: <Dashboard />,
    },
    {
      path: "/matches",
      text: "Matches",
      icon: <SportsSoccer />,
    },
    {
      path: "/slip/new",
      text: "Master Slip",
      icon: <ReceiptLong />,
    },
    {
      path: "/slips",
      text: "All Slips",
      icon: <ListAlt />,
    },
  ];

  const activeStyle = {
    backgroundColor: "primary.main",
    color: "white",
    "& .MuiListItemText-primary": {
      fontWeight: 600,
    },
    "& .MuiSvgIcon-root": {
      color: "white",
    },
    "&:hover": {
      backgroundColor: "primary.dark",
    },
  };

  const inactiveStyle = {
    color: "text.secondary",
    "&:hover": {
      backgroundColor: "action.hover",
      color: "text.primary",
    },
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: "100%",
        borderRadius: 2,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "primary.main",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Dashboard color="primary" />
          Betting System
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2 }}
        >
          Navigation Menu
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>

      <List sx={{ p: 2 }}>
        {navItems.map((item) => (
          <ListItem
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={(theme) => ({
              borderRadius: 2,
              mb: 1,
              textDecoration: "none",
              transition: "all 0.2s ease-in-out",
              "&.active": activeStyle,
              ...inactiveStyle,
            })}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
                py: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                }}
              >
                {React.cloneElement(item.icon, { fontSize: "small" })}
              </Box>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: "0.95rem",
                }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 3, mt: "auto" }}>
        <Divider sx={{ mb: 2 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          Version 1.0.0
        </Typography>
      </Box>
    </Paper>
  );
}
