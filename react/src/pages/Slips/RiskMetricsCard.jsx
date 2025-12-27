// src/pages/MasterSlipAnalysis/components/RiskMetricsCard.jsx
import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Grid,
  Chip,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Security,
  Warning,
  TrendingDown,
  Timeline,
  ShowChart,
} from '@mui/icons-material';
import DARK_THEME from './ThemeProvider';

const RiskMetricsCard = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Helper function to get color based on risk level
  const getRiskColor = (value, metric) => {
    switch (metric) {
      case 'value_at_risk_95':
        // More negative is worse
        if (value < -50) return DARK_THEME.palette.status.lost;
        if (value < -20) return DARK_THEME.palette.status.pending;
        return DARK_THEME.palette.status.won;
      
      case 'maximum_drawdown':
        // Higher percentage is worse
        if (value > 50) return DARK_THEME.palette.status.lost;
        if (value > 20) return DARK_THEME.palette.status.pending;
        return DARK_THEME.palette.status.won;
      
      case 'volatility':
        // Higher volatility is worse
        if (value > 0.5) return DARK_THEME.palette.status.lost;
        if (value > 0.2) return DARK_THEME.palette.status.pending;
        return DARK_THEME.palette.status.won;
      
      default:
        return DARK_THEME.palette.text.primary;
    }
  };

  // Helper function to get icon based on metric
  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'value_at_risk_95':
        return <Warning sx={{ fontSize: 16, color: getRiskColor(data.value_at_risk_95, 'value_at_risk_95') }} />;
      case 'maximum_drawdown':
        return <TrendingDown sx={{ fontSize: 16, color: getRiskColor(data.maximum_drawdown, 'maximum_drawdown') }} />;
      case 'volatility':
        return <Timeline sx={{ fontSize: 16, color: getRiskColor(data.volatility, 'volatility') }} />;
      case 'conditional_var':
        return <Security sx={{ fontSize: 16, color: getRiskColor(data.conditional_var, 'value_at_risk_95') }} />;
      default:
        return <ShowChart sx={{ fontSize: 16, color: DARK_THEME.palette.text.primary }} />;
    }
  };

  // Format the metric name for display
  const formatMetricName = (metric) => {
    const names = {
      'value_at_risk_95': 'Value at Risk (95%)',
      'conditional_var': 'Conditional VaR',
      'maximum_drawdown': 'Max Drawdown',
      'volatility': 'Volatility',
      'odds_variance': 'Odds Variance',
    };
    return names[metric] || metric.replace(/_/g, ' ');
  };

  // Get description for each metric
  const getMetricDescription = (metric) => {
    const descriptions = {
      'value_at_risk_95': 'Maximum potential loss with 95% confidence',
      'conditional_var': 'Expected loss if VaR threshold is breached',
      'maximum_drawdown': 'Maximum observed loss from a peak',
      'volatility': 'Statistical measure of return dispersion',
      'odds_variance': 'Variance in odds across selections',
    };
    return descriptions[metric] || '';
  };

  // Format the value based on metric type
  const formatMetricValue = (metric, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metric) {
      case 'value_at_risk_95':
      case 'conditional_var':
        return `${value.toFixed(2)}`;
      
      case 'maximum_drawdown':
        return `${value.toFixed(2)}%`;
      
      case 'volatility':
      case 'odds_variance':
        return value.toFixed(3);
      
      default:
        return value.toFixed(2);
    }
  };

  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: DARK_THEME.shape.borderRadius.lg, 
      backgroundColor: DARK_THEME.palette.background.surface1,
      border: `1px solid ${alpha(DARK_THEME.palette.background.surface3, 0.5)}`,
      animation: `${DARK_THEME.animations.fadeIn} 0.5s ease-out`,
    }}>
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: DARK_THEME.shape.borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(DARK_THEME.palette.status.lost, 0.1),
              color: DARK_THEME.palette.status.lost,
            }}
          >
            <Security sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: DARK_THEME.palette.text.primary }}>
              Risk Metrics
            </Typography>
            <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.tertiary }}>
              Comprehensive risk analysis
            </Typography>
          </Box>
        </Stack>

        {/* Overall Risk Assessment */}
        {data.maximum_drawdown && (
          <Box
            sx={{
              p: 2,
              borderRadius: DARK_THEME.shape.borderRadius.md,
              backgroundColor: alpha(
                getRiskColor(data.maximum_drawdown, 'maximum_drawdown'),
                0.1
              ),
              border: `1px solid ${alpha(
                getRiskColor(data.maximum_drawdown, 'maximum_drawdown'),
                0.3
              )}`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.palette.text.primary, fontWeight: 600 }}>
                  Overall Risk Assessment
                </Typography>
                <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.secondary }}>
                  Based on maximum drawdown
                </Typography>
              </Box>
              <Chip
                label={
                  data.maximum_drawdown > 50 ? 'High Risk' :
                  data.maximum_drawdown > 20 ? 'Moderate Risk' : 'Low Risk'
                }
                size="small"
                sx={{
                  bgcolor: alpha(
                    getRiskColor(data.maximum_drawdown, 'maximum_drawdown'),
                    0.2
                  ),
                  color: getRiskColor(data.maximum_drawdown, 'maximum_drawdown'),
                  fontWeight: 700,
                  border: `1px solid ${alpha(
                    getRiskColor(data.maximum_drawdown, 'maximum_drawdown'),
                    0.4
                  )}`,
                }}
              />
            </Stack>
          </Box>
        )}

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          {Object.entries(data).map(([metric, value]) => {
            if (metric === 'metadata' || value === null) return null;
            
            return (
              <Grid item xs={12} sm={6} key={metric}>
                <Tooltip title={getMetricDescription(metric)} arrow placement="top">
                  <Paper
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: DARK_THEME.shape.borderRadius.md,
                      backgroundColor: DARK_THEME.palette.background.surface2,
                      border: `1px solid ${alpha(
                        getRiskColor(value, metric),
                        0.2
                      )}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: DARK_THEME.shadows.surface1,
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      {/* Metric Header */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getMetricIcon(metric)}
                        <Typography
                          variant="caption"
                          sx={{
                            color: DARK_THEME.palette.text.secondary,
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '0.7rem',
                          }}
                        >
                          {formatMetricName(metric)}
                        </Typography>
                      </Stack>

                      {/* Value */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: getRiskColor(value, metric),
                          lineHeight: 1,
                        }}
                      >
                        {formatMetricValue(metric, value)}
                      </Typography>

                      {/* Risk Indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: DARK_THEME.shape.borderRadius.pill,
                            backgroundColor: DARK_THEME.palette.background.surface3,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Risk level indicator - simplified for demonstration */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${Math.min(Math.abs(value) * 2, 100)}%`,
                              backgroundColor: getRiskColor(value, metric),
                              borderRadius: DARK_THEME.shape.borderRadius.pill,
                            }}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>

        {/* Risk Legend */}
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: alpha(DARK_THEME.palette.background.surface3, 0.3),
            borderRadius: DARK_THEME.shape.borderRadius.md,
          }}
        >
          <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 1 : 0} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: DARK_THEME.palette.status.won,
                }}
              />
              <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.secondary }}>
                Low Risk
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: DARK_THEME.palette.status.pending,
                }}
              />
              <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.secondary }}>
                Moderate Risk
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: DARK_THEME.palette.status.lost,
                }}
              />
              <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.secondary }}>
                High Risk
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Insights */}
        {(data.value_at_risk_95 < 0 || data.maximum_drawdown > 0) && (
          <Box
            sx={{
              p: 2,
              borderRadius: DARK_THEME.shape.borderRadius.md,
              backgroundColor: alpha(DARK_THEME.palette.accents.primary, 0.05),
              border: `1px solid ${alpha(DARK_THEME.palette.accents.primary, 0.2)}`,
            }}
          >
            <Typography variant="caption" sx={{ color: DARK_THEME.palette.text.secondary, fontWeight: 600 }}>
              Risk Insights
            </Typography>
            <Typography variant="body2" sx={{ color: DARK_THEME.palette.text.primary, mt: 0.5 }}>
              {data.value_at_risk_95 < -30 
                ? 'Significant downside risk detected. Consider reducing stake or diversifying selections.'
                : data.maximum_drawdown > 30
                ? 'High drawdown potential. Monitor positions closely and set stop-loss limits.'
                : 'Risk profile within acceptable range for this strategy.'}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default RiskMetricsCard;