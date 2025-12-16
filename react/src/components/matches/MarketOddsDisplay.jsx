import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp as OddsIcon,
  EmojiEvents as TrophyIcon,
  ShowChart as ChartIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import './MarketOddsDisplay.css';

const MarketOddsDisplay = ({ markets }) => {
  if (!markets || markets.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Alert severity="info">
          No market odds available for this match
        </Alert>
      </Paper>
    );
  }

  const formatMarketName = (name) => {
    if (!name) return 'Unknown Market';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMarketColor = (marketType) => {
    switch (marketType?.toLowerCase()) {
      case 'match_result':
      case '1x2':
        return '#1976d2';
      case 'over_under':
      case 'over/under':
        return '#2e7d32';
      case 'both_teams_score':
        return '#ed6c02';
      case 'double_chance':
        return '#9c27b0';
      case 'correct_score':
        return '#d32f2f';
      default:
        return '#666';
    }
  };

  const renderMarketOdds = (market) => {
    if (market.name === '1X2' || market.market_type === 'match_result') {
      return (
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Home
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {market.home_odds?.toFixed(2) || 'N/A'}
              </Typography>
              <Chip label="1" size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Draw
              </Typography>
              <Typography variant="h5" color="text.secondary" fontWeight="bold">
                {market.draw_odds?.toFixed(2) || 'N/A'}
              </Typography>
              <Chip label="X" size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Away
              </Typography>
              <Typography variant="h5" color="error" fontWeight="bold">
                {market.away_odds?.toFixed(2) || 'N/A'}
              </Typography>
              <Chip label="2" size="small" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        </Grid>
      );
    }

    if (market.name?.includes('Over/Under') || market.market_type === 'over_under') {
      const threshold = market.name?.match(/\d+\.?\d*/)?.[0] || '2.5';
      return (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Over {threshold}
              </Typography>
              <Typography variant="h5" color="success" fontWeight="bold">
                {market.over_odds?.toFixed(2) || market.odds?.toFixed(2) || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Under {threshold}
              </Typography>
              <Typography variant="h5" color="error" fontWeight="bold">
                {market.under_odds?.toFixed(2) || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      );
    }

    return (
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Odds
        </Typography>
        <Typography variant="h4" color="primary" fontWeight="bold">
          {market.odds?.toFixed(2) || 'N/A'}
        </Typography>
      </Paper>
    );
  };

  const renderMarketDetails = (market) => {
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Outcome</TableCell>
              <TableCell align="right">Odds</TableCell>
              <TableCell align="right">Probability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {market.outcomes?.map((outcome, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="body2">
                    {outcome.outcome}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={outcome.odds?.toFixed(2) || 'N/A'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {outcome.odds ? `${(1 / outcome.odds * 100).toFixed(1)}%` : 'N/A'}
                  </Typography>
                </TableCell>
              </TableRow>
            )) || (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No outcome data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MoneyIcon /> Market Odds
      </Typography>

      <Grid container spacing={3}>
        {markets.map((market, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                borderLeft: `4px solid ${getMarketColor(market.market_type || market.name)}`
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <OddsIcon sx={{ color: getMarketColor(market.market_type || market.name) }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {formatMarketName(market.name)}
                  </Typography>
                </Box>
                <Chip
                  label={market.market_type || 'standard'}
                  size="small"
                  sx={{
                    backgroundColor: getMarketColor(market.market_type || market.name),
                    color: 'white'
                  }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Market Odds Display */}
              <Box mb={3}>
                {renderMarketOdds(market)}
              </Box>

              {/* Market Details */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChartIcon fontSize="small" /> Market Details
                </Typography>
                {renderMarketDetails(market)}
              </Box>

              {/* Market Summary */}
              {market.notes && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    {market.notes}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Overall Market Summary */}
      {markets.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon fontSize="small" /> Market Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Total Markets
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {markets.length}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Avg. Odds
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {(
                    markets.reduce((sum, market) => {
                      const odds = market.odds || market.home_odds || 0;
                      return sum + parseFloat(odds);
                    }, 0) / markets.length
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Highest Odds
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success">
                  {Math.max(
                    ...markets.map(market => 
                      Math.max(
                        market.odds || 0,
                        market.home_odds || 0,
                        market.draw_odds || 0,
                        market.away_odds || 0
                      )
                    )
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Lowest Odds
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error">
                  {Math.min(
                    ...markets.map(market => 
                      Math.min(
                        market.odds || Infinity,
                        market.home_odds || Infinity,
                        market.draw_odds || Infinity,
                        market.away_odds || Infinity
                      )
                    ).filter(val => val > 0)
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default MarketOddsDisplay;