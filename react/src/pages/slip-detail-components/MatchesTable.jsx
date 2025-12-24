import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";
import SportsIcon from "@mui/icons-material/Sports";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const MatchesTable = ({ slip }) => (
  <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
    <Table>
      <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Match
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            League
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Market
          </TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#636366" }}>
            Selection
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, color: "#636366" }}>
            Odds
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {slip.matches?.length > 0 ? (
          slip.matches.map((match, idx) => (
            <TableRow key={idx} hover>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  {match.home_team} vs {match.away_team}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <CalendarTodayIcon
                    fontSize="small"
                    sx={{ mr: 0.5, fontSize: 12 }}
                  />
                  {match.match_date
                    ? new Date(match.match_date).toLocaleDateString()
                    : "Date N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={match.league || "N/A"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={match.market || "N/A"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={match.selection || "N/A"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(106, 27, 154, 0.1)",
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, fontSize: "1.1rem" }}
              >
                {match.odds ? parseFloat(match.odds).toFixed(2) : "N/A"}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
              <SportsIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No matches added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add matches to this slip to see them here
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
);

export default MatchesTable;
