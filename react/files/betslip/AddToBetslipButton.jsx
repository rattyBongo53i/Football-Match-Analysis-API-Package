import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  PlaylistAdd as AddIcon,
  PlaylistAddCheck as AddedIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useBetslip } from '../../contexts/BetslipContext';
import './AddToBetslipButton.css';

const AddToBetslipButton = ({ match, size = 'medium', variant = 'outlined' }) => {
  const [adding, setAdding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const {
    addMatchToBetslip,
    isMatchInBetslip,
    getBetslipSummary
  } = useBetslip();

  const handleAddToBetslip = async () => {
    if (isInBetslip) return;
    
    const summary = getBetslipSummary();
    if (!summary.canAddMore) {
      setSnackbar({
        open: true,
        message: 'Betslip is full (maximum 10 matches)',
        severity: 'warning'
      });
      return;
    }
    
    setAdding(true);
    try {
      await addMatchToBetslip(match);
      setSnackbar({
        open: true,
        message: 'Match added to betslip!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to add to betslip:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add match to betslip',
        severity: 'error'
      });
    } finally {
      setAdding(false);
    }
  };

  const isInBetslip = isMatchInBetslip(match.id);
  const summary = getBetslipSummary();

  const getButtonProps = () => {
    const baseProps = {
      size,
      variant,
      onClick: handleAddToBetslip,
      disabled: adding || isInBetslip || !summary.canAddMore,
      startIcon: adding ? <CircularProgress size={16} /> : 
                 isInBetslip ? <AddedIcon /> : 
                 <AddIcon />
    };

    if (isInBetslip) {
      return {
        ...baseProps,
        color: 'success',
        children: 'In Betslip'
      };
    }

    if (!summary.canAddMore) {
      return {
        ...baseProps,
        color: 'warning',
        children: 'Betslip Full',
        startIcon: <ErrorIcon />
      };
    }

    return {
      ...baseProps,
      color: 'primary',
      children: adding ? 'Adding...' : 'Add to Betslip'
    };
  };

  const buttonProps = getButtonProps();
  const tooltipTitle = isInBetslip 
    ? 'Already in betslip' 
    : !summary.canAddMore 
      ? 'Betslip is full (max 10 matches)' 
      : 'Add to betslip';

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <span>
          <Button {...buttonProps} />
        </span>
      </Tooltip>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddToBetslipButton;