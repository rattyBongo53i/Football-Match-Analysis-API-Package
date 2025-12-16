import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  SportsSoccer as SoccerIcon,
  PlaylistAdd as AddToBetslipIcon
} from '@mui/icons-material';
import { useBetslip } from '../../contexts/BetslipContext';
import AddToBetslipButton from '../../components/betslip/AddToBetslipButton';
import './MatchesTable.css';

const MatchesTable = ({ matches, onDelete, loading }) => {
  const navigate = useNavigate();
  const { isMatchInBetslip } = useBetslip();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'ongoing': return 'warning';
      case 'scheduled': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (matches.length === 0 && !loading) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <SoccerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No matches found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add your first match to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      {loading && <LinearProgress />}
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Match</TableCell>
              <TableCell>League</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Markets</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => {
              const inBetslip = isMatchInBetslip(match.id);
              
              return (
                <TableRow
                  key={match.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      {match.home_score !== null && match.away_score !== null && (
                        <Typography variant="body2" color="text.secondary">
                          {match.home_score} - {match.away_score}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={match.league || 'Unknown'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {formatDate(match.match_date)}
                      </Typography>
                      {match.match_time && (
                        <Typography variant="caption" color="text.secondary">
                          {match.match_time}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={match.status || 'Scheduled'}
                      color={getStatusColor(match.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {(match.markets?.length || 0)} markets
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/matches/${match.id}`)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <AddToBetslipButton match={match} />
                      
                      <Tooltip title="Delete Match">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(match.id);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default MatchesTable;