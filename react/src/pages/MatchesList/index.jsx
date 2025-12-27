import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { matchService } from '../../services/api/matchService';
import MatchesTable from './MatchesTable';
import './MatchesTable.css';

const MatchesList = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    loadMatches();
  }, [pagination.page]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await matchService.getAllMatches({
        page: pagination.page,
        per_page: pagination.perPage,
        search: searchTerm
      });
      
      setMatches(response.matches || []);
      setPagination(prev => ({
        ...prev,
        total: response.meta?.total || 0,
        totalPages: response.meta?.last_page || 1
      }));
    } catch (err) {
      setError('Failed to load matches. Please try again.');
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounced search could be implemented here
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMatches();
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm(`Are you sure you want to delete this match? ${matchId}`)) {
      return;
    }

    try {
      await matchService.deleteMatch(matchId);
      setMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (err) {
      alert('Failed to delete match');
      console.error('Error deleting match:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Football Matches
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage and analyze football matches
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/matches/new')}
              >
                Add New Match
              </Button>
            </Box>

            <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search matches by team or league..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button size="small" onClick={loadMatches} sx={{ ml: 2 }}>
                Retry
              </Button>
            </Alert>
          )}

          {loading && matches.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <MatchesTable
              matches={matches}
              onDelete={handleDeleteMatch}
              loading={loading}
            />
          )}

          {pagination.total > 0 && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={2}>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                Page {pagination.page} of {pagination.totalPages}
                {pagination.total > 0 && ` (${pagination.total} total)`}
              </Typography>
              
              <Button
                variant="outlined"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
              >
                Next
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default MatchesList;