// src/components/matches/TeamFormsSection.jsx
import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import Last10Form from "./Last10Form";

const TeamFormsSection = ({
  homeFormMatches,
  setHomeFormMatches,
  awayFormMatches,
  setAwayFormMatches,
  submitting,
}) => {
  return (
    <Box mb={4}>
      <Typography
        variant="h6"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        Team Forms (Last 10 Matches)
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Last10Form
            teamName="Home Team"
            color="primary"
            value={homeFormMatches}
            onChange={setHomeFormMatches}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Last10Form
            teamName="Away Team"
            color="error"
            value={awayFormMatches}
            onChange={setAwayFormMatches}
            disabled={submitting}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamFormsSection;
