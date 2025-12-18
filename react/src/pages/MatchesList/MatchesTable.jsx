import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  LinearProgress,
  Tooltip,
  Alert,
  Snackbar,
  Avatar,
  AvatarGroup,
  alpha,
  Button,
  Fade,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  SportsSoccer as SoccerIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useBetslip } from "../../contexts/BetslipContext";
import AddToBetslipButton from "../../components/betslip/AddToBetslipButton";
import "./MatchesTable.css";

const MatchesTable = ({ matches, onDelete, loading }) => {
  const navigate = useNavigate();
  const { isMatchInBetslip } = useBetslip();
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [deletedMatchName, setDeletedMatchName] = React.useState("");

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "ongoing":
      case "in_progress":
        return "warning";
      case "scheduled":
        return "info";
      case "cancelled":
        return "error";
      case "postponed":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckIcon fontSize="small" />;
      case "ongoing":
        return <TrendingIcon fontSize="small" />;
      case "scheduled":
        return <ScheduleIcon fontSize="small" />;
      case "cancelled":
        return <CancelIcon fontSize="small" />;
      default:
        return <TimeIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteClick = (matchId, matchName, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      id: matchId,
      name: matchName,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      setDeletedMatchName(deleteConfirm.name);
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      setShowDeleteSuccess(true);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const getTeamInitials = (teamName) => {
    if (!teamName) return "??";
    return teamName
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLeagueIcon = (league) => {
    if (!league) return <TrophyIcon fontSize="small" />;
    
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes("premier")) return <TrophyIcon fontSize="small" />;
    if (leagueLower.includes("champions")) return <SoccerIcon fontSize="small" />;
    if (leagueLower.includes("europa")) return <TrendingIcon fontSize="small" />;
    return <TrophyIcon fontSize="small" />;
  };

  const getScoreColor = (homeScore, awayScore) => {
    if (homeScore === null || awayScore === null) return "text.secondary";
    if (homeScore > awayScore) return "success.main";
    if (homeScore < awayScore) return "error.main";
    return "warning.main";
  };

  if (matches.length === 0 && !loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 6, 
          textAlign: "center",
          borderRadius: 2,
          border: "2px dashed",
          borderColor: "divider",
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.03)
        }}
      >
        <SoccerIcon 
          sx={{ 
            fontSize: 64, 
            color: "text.secondary", 
            mb: 2,
            opacity: 0.5
          }} 
        />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No matches found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start by adding your first match to get started
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<EditIcon />}
          onClick={() => navigate("/matches/new")}
        >
          Add New Match
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <Paper 
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading && (
          <LinearProgress 
            sx={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0,
              height: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'primary.main',
              }
            }} 
          />
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                '& th': {
                  fontWeight: 600,
                  color: "text.primary",
                  borderBottom: "2px solid",
                  borderColor: "divider",
                  py: 2,
                }
              }}>
                <TableCell sx={{ width: "30%" }}>Match</TableCell>
                <TableCell>League</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Markets</TableCell>
                <TableCell align="center" sx={{ width: "150px" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {matches.map((match, index) => {
                const inBetslip = isMatchInBetslip(match.id);
                const homeTeamName = match.home_team || match.homeTeam?.name || "Unknown";
                const awayTeamName = match.away_team || match.awayTeam?.name || "Unknown";
                const hasScore = match.home_score !== null && match.away_score !== null;

                return (
                  <Fade in={true} timeout={index * 100} key={match.id}>
                    <TableRow
                      hover
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        '&:hover': { 
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          transform: "translateY(-1px)",
                          boxShadow: 1
                        },
                        '&:not(:last-child)': {
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }
                      }}
                      onClick={() => navigate(`/matches/${match.id}`)}
                    >
                      {/* Match Column */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <AvatarGroup max={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                                fontWeight: 600,
                                width: 36,
                                height: 36
                              }}
                            >
                              {getTeamInitials(homeTeamName)}
                            </Avatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                                color: "secondary.main",
                                fontWeight: 600,
                                width: 36,
                                height: 36
                              }}
                            >
                              {getTeamInitials(awayTeamName)}
                            </Avatar>
                          </AvatarGroup>
                          
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {homeTeamName} <span style={{ color: '#666', margin: '0 8px' }}>vs</span> {awayTeamName}
                            </Typography>
                            {hasScore && (
                              <Typography 
                                variant="h6" 
                                fontWeight={700}
                                color={getScoreColor(match.home_score, match.away_score)}
                              >
                                {match.home_score} - {match.away_score}
                              </Typography>
                            )}
                            {match.venue && (
                              <Typography variant="caption" color="text.secondary">
                                {match.venue === "Home" ? "🏠 " : "⚽ "}{match.venue}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* League Column */}
                      <TableCell>
                        <Chip
                          icon={getLeagueIcon(match.league)}
                          label={match.league || "Unknown"}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 1,
                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                          }}
                        />
                      </TableCell>

                      {/* Date & Time Column */}
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {formatDate(match.match_date)}
                          </Typography>
                          {match.match_time && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <TimeIcon fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {match.match_time}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(match.status)}
                          label={match.status || "Scheduled"}
                          color={getStatusColor(match.status)}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            '& .MuiChip-icon': {
                              color: 'inherit'
                            }
                          }}
                        />
                      </TableCell>

                      {/* Markets Column */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${match.markets_count || 0}`}
                            size="small"
                            variant="filled"
                            sx={{
                              backgroundColor: (theme) => 
                                (match.markets_count || 0) > 0 
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.grey[500], 0.1),
                              color: (match.markets_count || 0) > 0 ? "success.main" : "text.secondary",
                              fontWeight: 600,
                              minWidth: 32,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            markets
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/matches/${match.id}`)}
                              sx={{
                                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <AddToBetslipButton match={match} />

                          <Tooltip title="Delete Match" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteClick(match.id, `${homeTeamName} vs ${awayTeamName}`, e)}
                              sx={{
                                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                                '&:hover': {
                                  backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2),
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </Fade>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Alert 
          severity="warning"
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1300,
            boxShadow: 3,
            minWidth: 300,
            maxWidth: 400,
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': { transform: 'translateX(100%)', opacity: 0 },
              '100%': { transform: 'translateX(0)', opacity: 1 }
            }
          }}
          action={
            <>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleConfirmDelete}
                sx={{ mr: 1 }}
              >
                Delete
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleCancelDelete}
              >
                Cancel
              </Button>
            </>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Delete match?
          </Typography>
          <Typography variant="body2">
            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
          </Typography>
        </Alert>
      )}

      {/* Delete Success Snackbar */}
      <Snackbar
        open={showDeleteSuccess}
        autoHideDuration={4000}
        onClose={() => setShowDeleteSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowDeleteSuccess(false)} 
          severity="success" 
          icon={<CheckIcon />}
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle2">
            Match deleted successfully!
          </Typography>
          <Typography variant="body2">
            "{deletedMatchName}" has been removed
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default MatchesTable;