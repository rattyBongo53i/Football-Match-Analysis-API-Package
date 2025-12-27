import React, { useMemo, useCallback, memo } from "react";
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
  Chip,
} from "@mui/material";
import {
  TrendingUp as FormIcon,
  CheckCircle as WinIcon,
  Remove as DrawIcon,
  Cancel as LossIcon,
} from "@mui/icons-material";
import "./TeamFormInput.css";

// ============================================================================
// STATIC CONSTANTS - Moved outside component to prevent recreation on renders
// ============================================================================

const DEFAULT_FORM = {
  last_5: ["", "", "", "", ""],
  position: "",
  points: "",
  goals_for: "",
  goals_against: "",
  form_strength: "average",
};

const FORM_STRENGTH_OPTIONS = [
  "excellent",
  "good",
  "average",
  "poor",
  "very_poor",
];

const RESULT_ICONS = {
  W: { icon: WinIcon, color: "success" },
  D: { icon: DrawIcon, color: "warning" },
  L: { icon: LossIcon, color: "error" },
};

// ============================================================================
// MEMOIZED SUB-COMPONENTS - Prevent unnecessary re-renders
// ============================================================================

/**
 * Last 5 Matches Input Component
 * Memoized to prevent re-render when parent updates unrelated fields
 */
const Last5InputField = memo(({ value, index, onChange, disabled }) => (
  <TextField
    key={`last5-${index}`}
    size="small"
    value={value}
    onChange={onChange}
    placeholder={String(index + 1)}
    inputProps={{
      maxLength: 1,
      style: {
        textAlign: "center",
        textTransform: "uppercase",
      },
    }}
    sx={{ width: 60 }}
    disabled={disabled}
  />
));

Last5InputField.displayName = "Last5InputField";

/**
 * Form Strength Select Component
 * Memoized to prevent re-render of both selects when one changes
 */
const FormStrengthSelect = memo(({ label, value, onChange, disabled }) => (
  <FormControl size="small" sx={{ minWidth: 200 }}>
    <InputLabel>{label}</InputLabel>
    <Select
      value={value || "average"}
      onChange={(e) => onChange(e.target.value)}
      label={label}
      disabled={disabled}
    >
      <MenuItem value="excellent">Excellent</MenuItem>
      <MenuItem value="good">Good</MenuItem>
      <MenuItem value="average">Average</MenuItem>
      <MenuItem value="poor">Poor</MenuItem>
      <MenuItem value="very_poor">Very Poor</MenuItem>
    </Select>
  </FormControl>
));

FormStrengthSelect.displayName = "FormStrengthSelect";

/**
 * Team Form Section Component
 * Encapsulates home/away team form UI
 */
const TeamFormSection = memo(
  ({
    team,
    label,
    labelColor,
    formData,
    onFieldChange,
    onLast5Change,
    disabled,
  }) => {
    const last5 = formData.last_5 || ["", "", "", "", ""];

    return (
      <Box mb={3}>
        <Typography
          variant="subtitle1"
          color={labelColor}
          gutterBottom
          fontWeight="bold"
        >
          {label}
        </Typography>

        {/* Last 5 Matches */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {label} Last 5 Matches
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            {last5.map((result, index) => (
              <Last5InputField
                key={index}
                value={result}
                index={index}
                onChange={(e) =>
                  onLast5Change(index, e.target.value.toUpperCase())
                }
                disabled={disabled}
              />
            ))}
          </Box>

          {/* Legend Chips - Memoized inline */}
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              icon={<WinIcon />}
              label="W:  Win"
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

        {/* Statistics Fields */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="League Position"
              type="number"
              value={formData.position || ""}
              onChange={(e) => onFieldChange("position", e.target.value)}
              disabled={disabled}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Points"
              type="number"
              value={formData.points || ""}
              onChange={(e) => onFieldChange("points", e.target.value)}
              disabled={disabled}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Goals For"
              type="number"
              value={formData.goals_for || ""}
              onChange={(e) => onFieldChange("goals_for", e.target.value)}
              disabled={disabled}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Goals Against"
              type="number"
              value={formData.goals_against || ""}
              onChange={(e) => onFieldChange("goals_against", e.target.value)}
              disabled={disabled}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
);

TeamFormSection.displayName = "TeamFormSection";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TeamFormInput = ({ homeForm, awayForm, onChange, disabled = false }) => {
  // =========================================================================
  // MEMOIZED STATE SELECTORS - Prevent unnecessary object recreation
  // =========================================================================

  const currentHomeForm = useMemo(() => homeForm || DEFAULT_FORM, [homeForm]);
  const currentAwayForm = useMemo(() => awayForm || DEFAULT_FORM, [awayForm]);

  // =========================================================================
  // MEMOIZED HANDLERS - Prevent handler identity changes
  // =========================================================================

  const handleHomeFormChange = useCallback(
    (field, value) => {
      const updated = { ...currentHomeForm, [field]: value };
      onChange(updated, currentAwayForm);
    },
    [currentHomeForm, currentAwayForm, onChange]
  );

  const handleAwayFormChange = useCallback(
    (field, value) => {
      const updated = { ...currentAwayForm, [field]: value };
      onChange(currentHomeForm, updated);
    },
    [currentHomeForm, currentAwayForm, onChange]
  );

  const handleHomeLast5Change = useCallback(
    (index, value) => {
      const last5 = [...(currentHomeForm.last_5 || ["", "", "", "", ""])];
      last5[index] = value;
      handleHomeFormChange("last_5", last5);
    },
    [currentHomeForm, handleHomeFormChange]
  );

  const handleAwayLast5Change = useCallback(
    (index, value) => {
      const last5 = [...(currentAwayForm.last_5 || ["", "", "", "", ""])];
      last5[index] = value;
      handleAwayFormChange("last_5", last5);
    },
    [currentAwayForm, handleAwayFormChange]
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <FormIcon /> Team Forms & Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Home Team Form Section */}
        <Grid item xs={12} md={6}>
          <TeamFormSection
            team="home"
            label="Home Team"
            labelColor="primary"
            formData={currentHomeForm}
            onFieldChange={handleHomeFormChange}
            onLast5Change={handleHomeLast5Change}
            disabled={disabled}
          />
        </Grid>

        {/* Away Team Form Section */}
        <Grid item xs={12} md={6}>
          <TeamFormSection
            team="away"
            label="Away Team"
            labelColor="error"
            formData={currentAwayForm}
            onFieldChange={handleAwayFormChange}
            onLast5Change={handleAwayLast5Change}
            disabled={disabled}
          />
        </Grid>

        {/* Form Strength Selects */}
        <Grid item xs={12}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <FormStrengthSelect
              label="Home Form Strength"
              value={currentHomeForm.form_strength}
              onChange={(value) => handleHomeFormChange("form_strength", value)}
              disabled={disabled}
            />

            <FormStrengthSelect
              label="Away Form Strength"
              value={currentAwayForm.form_strength}
              onChange={(value) => handleAwayFormChange("form_strength", value)}
              disabled={disabled}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// ============================================================================
// EXPORT - Memoized to prevent re-render if props haven't changed
// ============================================================================

export default memo(TeamFormInput);
