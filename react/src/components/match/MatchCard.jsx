import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";

export default function MatchCard({ match, onAdd }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1">
          {match.home_team} vs {match.away_team}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {match.league} | {new Date(match.match_date).toLocaleString()}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" onClick={onAdd}>
            Add to Slip
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
