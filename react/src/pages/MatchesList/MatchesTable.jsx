import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup,
  Typography,
  Box,
  Paper,
  Button,
  Menu,
  MenuItem,
  Fade,
  Card,
  CardContent,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme,
  styled,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  SportsSoccer as SoccerIcon,
  AccessTime as TimeIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Cancel as CancelledIcon,
  PlayCircle as OngoingIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

// Styled Components
const StyledTableRow = styled(TableRow)(({ theme, matchstatus }) => ({
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.03),
    transition: "background-color 0.3s ease",
  },
  ...(matchstatus === "completed" && {
    backgroundColor: alpha(theme.palette.success.main, 0.02),
    borderLeft: `4px solid ${theme.palette.success.main}`,
  }),
  ...(matchstatus === "ongoing" && {
    backgroundColor: alpha(theme.palette.warning.main, 0.02),
    borderLeft: `4px solid ${theme.palette.warning.main}`,
  }),
  ...(matchstatus === "cancelled" && {
    backgroundColor: alpha(theme.palette.error.main, 0.02),
    borderLeft: `4px solid ${theme.palette.error.main}`,
  }),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  ...(status === "completed" && {
    backgroundColor: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
  }),
  ...(status === "ongoing" && {
    backgroundColor: alpha(theme.palette.warning.main, 0.15),
    color: theme.palette.warning.dark,
    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
  }),
  ...(status === "scheduled" && {
    backgroundColor: alpha(theme.palette.info.main, 0.15),
    color: theme.palette.info.dark,
    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
  }),
  ...(status === "cancelled" && {
    backgroundColor: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.dark,
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
  }),
}));

const ScoreContainer = styled(Box)(({ theme, winner }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: theme.spacing(0.5, 1.5),
  borderRadius: "12px",
  backgroundColor: alpha(
    winner === "home"
      ? theme.palette.primary.main
      : winner === "away"
        ? theme.palette.error.main
        : theme.palette.warning.main,
    0.1
  ),
  border: `1px solid ${alpha(
    winner === "home"
      ? theme.palette.primary.main
      : winner === "away"
        ? theme.palette.error.main
        : theme.palette.warning.main,
    0.3
  )}`,
}));

const ActionButton = styled(IconButton)(({ theme, actiontype }) => ({
  backgroundColor: alpha(
    actiontype === "view"
      ? theme.palette.info.main
      : actiontype === "edit"
        ? theme.palette.warning.main
        : theme.palette.error.main,
    0.1
  ),
  color:
    actiontype === "view"
      ? theme.palette.info.main
      : actiontype === "edit"
        ? theme.palette.warning.main
        : theme.palette.error.main,
  "&:hover": {
    backgroundColor: alpha(
      actiontype === "view"
        ? theme.palette.info.main
        : actiontype === "edit"
          ? theme.palette.warning.main
          : theme.palette.error.main,
      0.2
    ),
  },
}));

const EnhancedTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  fontWeight: 700,
  fontSize: "0.9rem",
  color: theme.palette.primary.dark,
}));

const LeagueAvatar = styled(Avatar)(({ theme, leaguecolor }) => ({
  backgroundColor: leaguecolor || theme.palette.secondary.main,
  width: 32,
  height: 32,
  fontSize: "0.875rem",
}));

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CompletedIcon />;
    case "ongoing":
      return <OngoingIcon />;
    case "scheduled":
      return <PendingIcon />;
    case "cancelled":
      return <CancelledIcon />;
    default:
      return <PendingIcon />;
  }
};

const getFormIndicator = (form) => {
  if (!form || !form.recent_results) return null;

  const wins = (form.recent_results || []).filter((r) => r === "W").length;
  const total = form.recent_results?.length || 1;
  const winRate = (wins / total) * 100;

  return (
    <Tooltip title={`Win Rate: ${Math.round(winRate)}%`}>
      <Box sx={{ width: 60 }}>
        <LinearProgress
          variant="determinate"
          value={winRate}
          color={
            winRate >= 60 ? "success" : winRate >= 40 ? "warning" : "error"
          }
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha("#000", 0.1),
          }}
        />
      </Box>
    </Tooltip>
  );
};

const MatchesTable = ({ matches, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("match_date");
  const [order, setOrder] = useState("desc");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const theme = useTheme();

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleClick = (event, match) => {
    setAnchorEl(event.currentTarget);
    setSelectedMatch(match);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedMatch(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle view action - redirects to match detail page
  const handleView = (match) => {
    navigate(`/matches/${match.id}`);
  };

  // Handle the case where onView prop is not provided
  const handleViewAction = (match) => {
    if (onView) {
      onView(match);
    } else {
      handleView(match);
    }
  };

  const getTeamInitials = (teamName) => {
    if (!teamName) return "??";
    return teamName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  const getWinner = (match) => {
    if (match.home_score === null || match.away_score === null) return null;
    if (match.home_score > match.away_score) return "home";
    if (match.home_score < match.away_score) return "away";
    return "draw";
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (orderBy === "match_date") {
        return order === "asc"
          ? new Date(a.match_date) - new Date(b.match_date)
          : new Date(b.match_date) - new Date(a.match_date);
      }
      if (orderBy === "home_score") {
        return order === "asc"
          ? (a.home_score || 0) - (b.home_score || 0)
          : (b.home_score || 0) - (a.home_score || 0);
      }
      return 0;
    });
  }, [matches, order, orderBy]);

  const paginatedMatches = useMemo(() => {
    return sortedMatches.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedMatches, page, rowsPerPage]);

  const leagueColors = {
    "Premier League": "#3D195B",
    "La Liga": "#FFD700",
    Bundesliga: "#D3010C",
    "Serie A": "#0066B3",
    "Ligue 1": "#091C3F",
    "Champions League": "#0C7C46",
  };

  return (
    <Fade in timeout={500}>
      <Card elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <CardContent sx={{ p: 0 }}>
          {/* Table Header */}
          <Box
            sx={{
              p: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SoccerIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Matches Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {matches.length} matches found • Showing{" "}
                    {paginatedMatches.length} per page
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Filter">
                  <IconButton
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Search">
                  <IconButton
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.info.main, 0.2),
                      },
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Table Container */}
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <EnhancedTableHeadCell>
                    <TableSortLabel
                      active={orderBy === "match_date"}
                      direction={orderBy === "match_date" ? order : "asc"}
                      onClick={() => handleRequestSort("match_date")}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TimeIcon fontSize="small" />
                        Date & Time
                      </Box>
                    </TableSortLabel>
                  </EnhancedTableHeadCell>
                  <EnhancedTableHeadCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrophyIcon fontSize="small" />
                      League
                    </Box>
                  </EnhancedTableHeadCell>
                  <EnhancedTableHeadCell>Match</EnhancedTableHeadCell>
                  <EnhancedTableHeadCell>Score</EnhancedTableHeadCell>
                  <EnhancedTableHeadCell>Status</EnhancedTableHeadCell>
                  <EnhancedTableHeadCell>Form</EnhancedTableHeadCell>
                  <EnhancedTableHeadCell align="center">
                    Actions
                  </EnhancedTableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMatches.map((match) => {
                  const winner = getWinner(match);
                  const homeForm = match.teamForms?.find(
                    (f) => f.venue === "home"
                  );
                  const awayForm = match.teamForms?.find(
                    (f) => f.venue === "away"
                  );

                  return (
                    <StyledTableRow
                      key={match.id}
                      hover
                      matchstatus={match.status?.toLowerCase()}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {formatDate(match.match_date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(match.match_time) || "Time TBD"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LeagueAvatar
                            leaguecolor={leagueColors[match.league]}
                            sx={{ bgcolor: leagueColors[match.league] }}
                          >
                            {match.league?.charAt(0) || "?"}
                          </LeagueAvatar>
                          <Typography variant="body2" fontWeight={500}>
                            {match.league || "Unknown"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <AvatarGroup max={2} spacing="small">
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            >
                              {getTeamInitials(match.home_team)}
                            </Avatar>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            >
                              {getTeamInitials(match.away_team)}
                            </Avatar>
                          </AvatarGroup>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {match.home_team}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              vs {match.away_team}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {match.home_score !== null &&
                        match.away_score !== null ? (
                          <ScoreContainer winner={winner}>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              sx={{
                                color:
                                  winner === "home"
                                    ? theme.palette.primary.main
                                    : winner === "away"
                                      ? theme.palette.text.primary
                                      : theme.palette.warning.main,
                              }}
                            >
                              {match.home_score}
                            </Typography>
                            <Typography variant="body1" sx={{ mx: 0.5 }}>
                              :
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              sx={{
                                color:
                                  winner === "away"
                                    ? theme.palette.error.main
                                    : winner === "home"
                                      ? theme.palette.text.primary
                                      : theme.palette.warning.main,
                              }}
                            >
                              {match.away_score}
                            </Typography>
                          </ScoreContainer>
                        ) : (
                          <Chip
                            label="Not Played"
                            size="small"
                            variant="outlined"
                            sx={{
                              color: theme.palette.text.secondary,
                              borderColor: alpha(theme.palette.divider, 0.5),
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          size="small"
                          status={match.status?.toLowerCase()}
                          icon={getStatusIcon(match.status)}
                          label={
                            match.status?.charAt(0).toUpperCase() +
                              match.status?.slice(1) || "Scheduled"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Home
                            </Typography>
                            {getFormIndicator(homeForm)}
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Away
                            </Typography>
                            {getFormIndicator(awayForm)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="View Details">
                            <ActionButton
                              size="small"
                              actiontype="view"
                              onClick={() => handleViewAction(match)}
                            >
                              <ViewIcon fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                          <Tooltip title="Edit Match">
                            <ActionButton
                              size="small"
                              actiontype="edit"
                              onClick={() => onEdit?.(match)}
                            >
                              <EditIcon fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                          <Tooltip title="Delete Match">
                            <ActionButton
                              size="small"
                              actiontype="delete"
                              onClick={() => onDelete?.(match)}
                            >
                              <DeleteIcon fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleClick(e, match)}
                            sx={{
                              bgcolor: alpha(theme.palette.grey[500], 0.1),
                              "&:hover": {
                                bgcolor: alpha(theme.palette.grey[500], 0.2),
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={matches.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontWeight: 500,
                },
            }}
          />
        </CardContent>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: 2,
              minWidth: 200,
              mt: 1,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleViewAction(selectedMatch);
              handleClose();
            }}
            sx={{
              color: theme.palette.info.main,
              "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) },
            }}
          >
            <ViewIcon sx={{ mr: 2, fontSize: 20 }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              onEdit?.(selectedMatch);
              handleClose();
            }}
            sx={{
              color: theme.palette.warning.main,
              "&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.1) },
            }}
          >
            <EditIcon sx={{ mr: 2, fontSize: 20 }} />
            Edit Match
          </MenuItem>
          <MenuItem
            onClick={() => {
              onDelete?.(selectedMatch);
              handleClose();
            }}
            sx={{
              color: theme.palette.error.main,
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
            }}
          >
            <DeleteIcon sx={{ mr: 2, fontSize: 20 }} />
            Delete Match
          </MenuItem>
        </Menu>
      </Card>
    </Fade>
  );
};

export default MatchesTable;