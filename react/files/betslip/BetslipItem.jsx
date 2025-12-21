import React from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  SportsSoccer as SoccerIcon,
  TrendingUp as OddsIcon
} from '@mui/icons-material';
import { useBetslip } from '../../contexts/BetslipContext';
import './BetslipItem.css';

const BetslipItem = ({ match }) => {
  const { removeMatchFromBetslip } = useBetslip();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getFirstMarketOdds = () => {
    if (!match.markets || match.markets.length === 0) return 'N/A';
    
    const firstMarket = match.markets[0];
    if (firstMarket.name === '1X2') {
      return `${firstMarket.home_odds?.toFixed(2)}/${firstMarket.draw_odds?.toFixed(2)}/${firstMarket.away_odds?.toFixed(2)}`;
    }
    
    return firstMarket.odds?.toFixed(2) || 'N/A';
  };

  const marketCount = match.markets?.length || 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          {/* Match Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              {match.league} • {formatDate(match.match_date)}
            </Typography>
            <Chip
              label={`${marketCount} market${marketCount !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* Teams */}
          <Box mb={1}>
            <Typography variant="body1" fontWeight="bold">
              {match.home_team} vs {match.away_team}
            </Typography>
            {match.home_score !== null && match.away_score !== null && (
              <Typography variant="body2" color="text.secondary">
                Score: {match.home_score} - {match.away_score}
              </Typography>
            )}
          </Box>

          {/* Odds & Markets */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <OddsIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Odds:
              </Typography>
              <Chip
                label={getFirstMarketOdds()}
                size="small"
                color="primary"
              />
            </Box>
            
            {match.markets && match.markets.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {match.markets.slice(0, 3).map((market, index) => (
                  <Chip
                    key={index}
                    label={market.name}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {match.markets.length > 3 && (
                  <Chip
                    label={`+${match.markets.length - 3}`}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Remove Button */}
        <Tooltip title="Remove from betslip">
          <IconButton
            size="small"
            onClick={() => removeMatchFromBetslip(match.id)}
            color="error"
            sx={{ ml: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default BetslipItem;