import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  TrendingUp as TrendIcon,
  AttachMoney as MoneyIcon,
  BarChart as ChartIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';

const GeneratedSlipsList = ({ slips, loading, onRefresh }) => {
  const [expandedSlip, setExpandedSlip] = useState(null);
  const [detailDialog, setDetailDialog] = useState(null);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LinearProgress />
      </Paper>
    );
  }

  if (slips.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <TrendIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Generated Slips Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Run ML analysis on your slip to generate optimized betting alternatives.
        </Typography>
        <Button variant="outlined" onClick={onRefresh}>
          Check Again
        </Button>
      </Paper>
    );
  }

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Generated Slips ({slips.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={onRefresh}>
              Refresh
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          These are AI-generated betting alternatives based on your selected matches. 
          Each slip is optimized for different risk levels and confidence scores.
        </Alert>
      </Paper>

      <Grid container spacing={3}>
        {slips.map((slip) => (
          <Grid item xs={12} md={6} lg={4} key={slip.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendIcon fontSize="small" /> Slip #{slip.id.substring(0, 6)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generated {new Date(slip.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={slip.risk_level}
                    color={getRiskColor(slip.risk_level)}
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Quick Stats */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Stake</Typography>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MoneyIcon fontSize="small" /> ${slip.stake}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Odds</Typography>
                    <Typography variant="h6">{slip.total_odds.toFixed(2)}x</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Possible Return</Typography>
                    <Typography variant="h6" color="success.main">
                      ${slip.possible_return.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Confidence</Typography>
                    <Typography variant="h6" color="primary.main">
                      {(slip.confidence_score * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                </Grid>

                {/* Progress bar for confidence */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Confidence Level
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={slip.confidence_score * 100} 
                    color={
                      slip.confidence_score > 0.7 ? 'success' :
                      slip.confidence_score > 0.4 ? 'warning' : 'error'
                    }
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                {/* Expandable details */}
                {expandedSlip === slip.id && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Match Selections:
                    </Typography>
                    {slip.legs?.slice(0, 3).map((leg, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={`${leg.odds.toFixed(2)}x`} size="small" />
                        <Typography variant="caption">
                          {leg.selection} @ {leg.market}
                        </Typography>
                      </Box>
                    ))}
                    {slip.legs?.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{slip.legs.length - 3} more selections
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setDetailDialog(slip)}
                    fullWidth
                  >
                    View Details
                  </Button>
                  <Tooltip title={expandedSlip === slip.id ? "Collapse" : "Expand"}>
                    <IconButton
                      size="small"
                      onClick={() => setExpandedSlip(expandedSlip === slip.id ? null : slip.id)}
                    >
                      {expandedSlip === slip.id ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detail Dialog */}
      {detailDialog && (
        <GeneratedSlipDetail
          slip={detailDialog}
          open={!!detailDialog}
          onClose={() => setDetailDialog(null)}
        />
      )}
    </Box>
  );
};

// Detail Dialog Component
const GeneratedSlipDetail = ({ slip, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendIcon /> Slip Details
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Risk Level</Typography>
                  <Chip label={slip.risk_level} color={getRiskColor(slip.risk_level)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <Typography variant="h6" color="primary.main">
                    {(slip.confidence_score * 100).toFixed(0)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Stake</Typography>
                  <Typography variant="body1">${slip.stake}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Total Odds</Typography>
                  <Typography variant="body1">{slip.total_odds.toFixed(2)}x</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Possible Return</Typography>
                  <Typography variant="h5" color="success.main">
                    ${slip.possible_return.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Selections</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Market</TableCell>
                      <TableCell>Selection</TableCell>
                      <TableCell align="right">Odds</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slip.legs?.map((leg, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{leg.market}</TableCell>
                        <TableCell>{leg.selection}</TableCell>
                        <TableCell align="right">{leg.odds.toFixed(2)}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSlipsList;