import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  DeleteSweep as ClearIcon,
  ShoppingCart as CartIcon,
  TrendingUp as AnalysisIcon
} from '@mui/icons-material';
import { useBetslip } from '../../contexts/BetslipContext';
import { useJob } from '../../contexts/JobContext';
import BetslipItem from './BetslipItem';
import './BetslipPanel.css';

const BetslipPanel = ({ open, onClose }) => {
  const {
    betslipMatches,
    clearBetslip,
    getBetslipSummary,
    loading: betslipLoading
  } = useBetslip();
  
  const {
    triggerAnalysis,
    activeJobs,
    getJobStatus
  } = useJob();
  
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  const summary = getBetslipSummary();
  
  const handleRunAnalysis = async () => {
    if (!summary.isAnalysisReady) return;
    
    setAnalysisLoading(true);
    try {
      await triggerAnalysis(summary.matchIds);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const calculateTotalOdds = () => {
    if (betslipMatches.length === 0) return 1.0;
    
    // Simple multiplication of first market odds for each match
    return betslipMatches.reduce((total, match) => {
      const firstMarket = match.markets?.[0];
      if (firstMarket) {
        const odds = firstMarket.odds || 
                   firstMarket.home_odds || 
                   1.0;
        return total * parseFloat(odds);
      }
      return total;
    }, 1.0).toFixed(2);
  };
  
  const hasActiveJob = Object.values(activeJobs).some(job => 
    job.status === 'running' || job.status === 'pending'
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: 400,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 400,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CartIcon /> Betslip
              <Badge
                badgeContent={betslipMatches.length}
                color="primary"
                sx={{ ml: 1 }}
              />
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Build your accumulator with 5-10 matches
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {betslipLoading && <LinearProgress />}
          
          {betslipMatches.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Your betslip is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add matches from the matches list
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Betslip Items */}
              <Box sx={{ mb: 3 }}>
                {betslipMatches.map((match) => (
                  <BetslipItem key={match.id} match={match} />
                ))}
              </Box>

              {/* Summary */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Betslip Summary
                </Typography>
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Matches:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {betslipMatches.length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Combined Odds:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {calculateTotalOdds()}x
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip
                    label={summary.isAnalysisReady ? 'Ready' : 'Need more matches'}
                    color={summary.isAnalysisReady ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                
                {!summary.isAnalysisReady && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Add {5 - betslipMatches.length} more matches to start analysis
                  </Alert>
                )}
              </Paper>

              {/* Job Status */}
              {hasActiveJob && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Analysis in progress...
                  </Typography>
                  <LinearProgress sx={{ mt: 1 }} />
                </Alert>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleRunAnalysis}
              disabled={!summary.isAnalysisReady || analysisLoading || hasActiveJob}
              sx={{ flex: 2 }}
            >
              {analysisLoading ? 'Running...' : 'Run ML Analysis'}
            </Button>
            
            <Tooltip title="Clear Betslip">
              <IconButton
                onClick={clearBetslip}
                disabled={betslipMatches.length === 0}
                color="error"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            {summary.isAnalysisReady 
              ? 'Ready to analyze 5-10 matches'
              : `Add ${5 - betslipMatches.length} more match${5 - betslipMatches.length === 1 ? '' : 'es'}`
            }
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BetslipPanel;