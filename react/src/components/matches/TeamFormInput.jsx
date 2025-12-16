import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  TrendingUp as FormIcon,
  CheckCircle as WinIcon,
  Remove as DrawIcon,
  Cancel as LossIcon
} from '@mui/icons-material';
import './TeamFormInput.css';

const TeamFormInput = ({ homeForm, awayForm, onChange, disabled = false }) => {
  const defaultForm = {
    last_5: ['', '', '', '', ''],
    position: '',
    points: '',
    goals_for: '',
    goals_against: '',
    form_strength: 'average'
  };

  const currentHomeForm = homeForm || defaultForm;
  const currentAwayForm = awayForm || defaultForm;

  const handleHomeFormChange = (field, value) => {
    const updated = { ...currentHomeForm, [field]: value };
    onChange(updated, currentAwayForm);
  };

  const handleAwayFormChange = (field, value) => {
    const updated = { ...currentAwayForm, [field]: value };
    onChange(currentHomeForm, updated);
  };

  const handleLast5Change = (team, index, value) => {
    const form = team === 'home' ? currentHomeForm : currentAwayForm;
    const last5 = [...(form.last_5 || ['', '', '', '', ''])];
    last5[index] = value;
    
    if (team === 'home') {
      handleHomeFormChange('last_5', last5);
    } else {
      handleAwayFormChange('last_5', last5);
    }
  };

  const getResultIcon = (result) => {
    switch (result?.toUpperCase()) {
      case 'W': return <WinIcon color="success" fontSize="small" />;
      case 'D': return <DrawIcon color="warning" fontSize="small" />;
      case 'L': return <LossIcon color="error" fontSize="small" />;
      default: return <span style={{ color: '#999' }}>-</span>;
    }
  };

  const renderLast5Input = (team, label) => {
    const form = team === 'home' ? currentHomeForm : currentAwayForm;
    const last5 = form.last_5 || ['', '', '', '', ''];

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {label} Last 5 Matches
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          {last5.map((result, index) => (
            <TextField
              key={index}
              size="small"
              value={result}
              onChange={(e) => handleLast5Change(team, index, e.target.value.toUpperCase())}
              placeholder={index + 1}
              inputProps={{ 
                maxLength: 1,
                style: { 
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }
              }}
              sx={{ width: 60 }}
              disabled={disabled}
            />
          ))}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            icon={<WinIcon />} 
            label="W: Win" 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            icon={<DrawIcon />} 
            label="D: Draw" 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            icon={<LossIcon />} 
            label="L: Loss" 
            size="small" 
            variant="outlined" 
          />
        </Box>
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormIcon /> Team Forms & Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Home Team Form */}
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
              Home Team
            </Typography>
            
            {renderLast5Input('home', 'Home Team')}
            
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="League Position"
                  type="number"
                  value={currentHomeForm.position || ''}
                  onChange={(e) => handleHomeFormChange('position', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Points"
                  type="number"
                  value={currentHomeForm.points || ''}
                  onChange={(e) => handleHomeFormChange('points', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Goals For"
                  type="number"
                  value={currentHomeForm.goals_for || ''}
                  onChange={(e) => handleHomeFormChange('goals_for', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Goals Against"
                  type="number"
                  value={currentHomeForm.goals_against || ''}
                  onChange={(e) => handleHomeFormChange('goals_against', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Away Team Form */}
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography variant="subtitle1" color="error" gutterBottom fontWeight="bold">
              Away Team
            </Typography>
            
            {renderLast5Input('away', 'Away Team')}
            
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="League Position"
                  type="number"
                  value={currentAwayForm.position || ''}
                  onChange={(e) => handleAwayFormChange('position', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Points"
                  type="number"
                  value={currentAwayForm.points || ''}
                  onChange={(e) => handleAwayFormChange('points', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Goals For"
                  type="number"
                  value={currentAwayForm.goals_for || ''}
                  onChange={(e) => handleAwayFormChange('goals_for', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Goals Against"
                  type="number"
                  value={currentAwayForm.goals_against || ''}
                  onChange={(e) => handleAwayFormChange('goals_against', e.target.value)}
                  disabled={disabled}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Form Strength */}
        <Grid item xs={12}>
          <Box display="flex" gap={3}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Home Form Strength</InputLabel>
              <Select
                value={currentHomeForm.form_strength || 'average'}
                onChange={(e) => handleHomeFormChange('form_strength', e.target.value)}
                label="Home Form Strength"
                disabled={disabled}
              >
                <MenuItem value="excellent">Excellent</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="average">Average</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="very_poor">Very Poor</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Away Form Strength</InputLabel>
              <Select
                value={currentAwayForm.form_strength || 'average'}
                onChange={(e) => handleAwayFormChange('form_strength', e.target.value)}
                label="Away Form Strength"
                disabled={disabled}
              >
                <MenuItem value="excellent">Excellent</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="average">Average</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="very_poor">Very Poor</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TeamFormInput;