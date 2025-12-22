import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  alpha,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  SportsSoccer as SoccerIcon,
} from "@mui/icons-material";

const LastMeetingsTable = ({ meetings = [] }) => {
  if (!meetings || meetings.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 4,
          color: "text.secondary",
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
        }}
      >
        <SoccerIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1">
          No historical meeting data available
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getResultColor = (result) => {
    switch (result?.toLowerCase()) {
      case "home":
        return "success";
      case "away":
        return "error";
      default:
        return "warning";
    }
  };

  const getResultLabel = (result) => {
    switch (result?.toLowerCase()) {
      case "home":
        return "Home Win";
      case "away":
        return "Away Win";
      default:
        return "Draw";
    }
  };

  return (
    <Paper variant="outlined" sx={{ width: "100%" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <CalendarIcon color="primary" />
          Last {meetings.length} Meetings
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell>Date</TableCell>
              <TableCell>Home Team</TableCell>
              <TableCell>Away Team</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Result</TableCell>
              <TableCell>Competition</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetings.map((meeting, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  bgcolor: (theme) =>
                    alpha(
                      getResultColor(meeting.result) === "success"
                        ? theme.palette.success.main
                        : getResultColor(meeting.result) === "error"
                          ? theme.palette.error.main
                          : theme.palette.warning.main,
                      0.05
                    ),
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    {formatDate(meeting.date)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    fontWeight={meeting.result === "home" ? 700 : 400}
                  >
                    {meeting.home_team}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    fontWeight={meeting.result === "away" ? 700 : 400}
                  >
                    {meeting.away_team}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={meeting.score || "N/A"}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      borderWidth: 2,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={getResultLabel(meeting.result)}
                    color={getResultColor(meeting.result)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {meeting.competition || "Friendly"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LastMeetingsTable;
