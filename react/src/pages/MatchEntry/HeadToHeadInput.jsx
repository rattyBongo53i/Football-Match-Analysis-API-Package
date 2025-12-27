import React, { useState, memo, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  Grid,
  Collapse,
  Button,
  Chip,
  Fade,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  History as HistoryIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";
import { MemoizedTextField } from "./MemoizedComponents";
import { EMPTY_H2H_MATCH } from "./constants";
import { StyledPaper } from "./styledComponents";

// ============================================================================
// STATIC CONSTANTS - Prevent recreation on every render
// ============================================================================

const MAX_H2H_MATCHES = 10;

const RESULT_COLORS = {
  H: { bg: "rgba(76, 175, 80, 0.1)", text: "#81c784" },
  A: { bg: "rgba(244, 67, 54, 0.1)", text: "#e57373" },
  D: { bg: "rgba(255, 152, 0, 0.1)", text: "#ffb74d" },
};

const DEFAULT_RESULT_COLOR = { bg: "rgba(255, 152, 0, 0.1)", text: "#ffb74d" };

// ============================================================================
// UTILITY FUNCTIONS - Pure functions for score parsing
// ============================================================================

/**
 * Calculate result (H, A, D) from score string
 * Pure function - no side effects
 */
const calculateResultFromScore = (score) => {
  if (!score || !score.includes("-")) {
    return null;
  }

  const [homeStr, awayStr] = score.split("-").map((n) => parseInt(n, 10));

  if (isNaN(homeStr) || isNaN(awayStr)) {
    return null;
  }

  if (homeStr > awayStr) return "H";
  if (homeStr < awayStr) return "A";
  return "D";
};

// ============================================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================================

/**
 * Header Component - Collapsible section header
 */
const H2HHeader = memo(({ matchCount, expanded, onToggle }) => (
  <Box
    onClick={onToggle}
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      p: 2,
      borderRadius: 3,
      cursor: "pointer",
      background:
        "linear-gradient(90deg, rgba(156, 39, 176, 0.08) 0%, transparent 100%)",
      border: "1px solid rgba(156, 39, 176, 0.15)",
      mb: 2,
      transition: "all 250ms ease",
      "&:hover": {
        borderColor: "rgba(156, 39, 176, 0.3)",
        background:
          "linear-gradient(90deg, rgba(156, 39, 176, 0.12) 0%, transparent 100%)",
      },
    }}
  >
    <Box display="flex" alignItems="center" gap={2}>
      <HistoryIcon color="primary" />
      <Typography variant="h6" fontWeight="700">
        Historical Meetings ({matchCount})
      </Typography>
    </Box>
    <IconButton size="small">
      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </IconButton>
  </Box>
));

H2HHeader.displayName = "H2HHeader";

/**
 * Date Input Field - Memoized
 */
const DateField = memo(({ value, onChange, disabled }) => (
  <MemoizedTextField
    type="date"
    fullWidth
    size="small"
    label="Date"
    value={value}
    onChange={onChange}
    InputLabelProps={{ shrink: true }}
    disabled={disabled}
  />
));

DateField.displayName = "DateField";

/**
 * Team Input Field - Memoized
 */
const TeamField = memo(({ label, value, onChange, disabled }) => (
  <MemoizedTextField
    fullWidth
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    disabled={disabled}
  />
));

TeamField.displayName = "TeamField";

/**
 * Score Input Field - Memoized
 */
const ScoreField = memo(({ value, onChange, disabled }) => (
  <MemoizedTextField
    fullWidth
    size="small"
    label="Score"
    placeholder="0-0"
    value={value}
    onChange={onChange}
    disabled={disabled}
    sx={{
      "& input": {
        textAlign: "center",
        letterSpacing: 2,
        fontWeight: "bold",
      },
    }}
  />
));

ScoreField.displayName = "ScoreField";

/**
 * Result Chip - Memoized
 */
const ResultChip = memo(({ result }) => {
  const colors = useMemo(
    () => RESULT_COLORS[result] || DEFAULT_RESULT_COLOR,
    [result]
  );

  return (
    <Chip
      label={result || "?"}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: "900",
        width: 40,
        transition: "all 150ms ease",
      }}
    />
  );
});

ResultChip.displayName = "ResultChip";

/**
 * Delete Button - Memoized
 */
const DeleteButton = memo(({ onClick, disabled }) => (
  <IconButton
    onClick={onClick}
    disabled={disabled}
    size="small"
    sx={{
      color: "rgba(255,255,255,0.2)",
      transition: "color 150ms ease",
      "&:hover: not(:disabled)": {
        color: "error.main",
      },
    }}
  >
    <DeleteIcon fontSize="small" />
  </IconButton>
));

DeleteButton.displayName = "DeleteButton";

/**
 * Match Row Component - Memoized with custom comparator
 * Only updates when match object reference changes or disabled state changes
 */
const H2HMatchRow = memo(
  ({ match, index, onChangeField, onRemove, disabled }) => {
    // Memoized callbacks to maintain stable references
    const handleDateChange = useCallback(
      (e) => onChangeField(index, "date", e.target.value),
      [index, onChangeField]
    );

    const handleHomeTeamChange = useCallback(
      (e) => onChangeField(index, "home_team", e.target.value),
      [index, onChangeField]
    );

    const handleScoreChange = useCallback(
      (e) => {
        const value = e.target.value;
        onChangeField(index, "score", value);
      },
      [index, onChangeField]
    );

    const handleAwayTeamChange = useCallback(
      (e) => onChangeField(index, "away_team", e.target.value),
      [index, onChangeField]
    );

    const handleRemoveClick = useCallback(
      () => onRemove(index),
      [index, onRemove]
    );

    return (
      <Grid item xs={12} key={`h2h-row-${index}`}>
        <Fade in timeout={300 + index * 100}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {/* Match Index */}
            <Typography
              sx={{
                opacity: 0.3,
                fontSize: 12,
                fontWeight: "bold",
                minWidth: 20,
              }}
            >
              {index + 1}
            </Typography>

            {/* Match Data Grid */}
            <Grid container spacing={2} alignItems="center" sx={{ flex: 1 }}>
              <Grid item xs={12} sm={3}>
                <DateField
                  value={match.date}
                  onChange={handleDateChange}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={5} sm={3}>
                <TeamField
                  label="Home"
                  value={match.home_team}
                  onChange={handleHomeTeamChange}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={2} sm={2}>
                <ScoreField
                  value={match.score}
                  onChange={handleScoreChange}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={5} sm={3}>
                <TeamField
                  label="Away"
                  value={match.away_team}
                  onChange={handleAwayTeamChange}
                  disabled={disabled}
                />
              </Grid>
            </Grid>

            {/* Result Chip */}
            <ResultChip result={match.result} />

            {/* Delete Button */}
            <DeleteButton onClick={handleRemoveClick} disabled={disabled} />
          </Box>
        </Fade>
      </Grid>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only update if match reference changes or disabled state changes
    return (
      prevProps.match === nextProps.match &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

H2HMatchRow.displayName = "H2HMatchRow";

/**
 * Add Button Component - Memoized
 */
const AddButton = memo(({ onClick, disabled, matchCount }) => (
  <Button
    fullWidth
    startIcon={<AddIcon />}
    onClick={onClick}
    disabled={disabled || matchCount >= MAX_H2H_MATCHES}
    sx={{
      mt: 2,
      py: 1.5,
      borderRadius: 2,
      border: "1px dashed rgba(156, 39, 176, 0.3)",
      color: "primary.main",
      transition: "all 150ms ease",
      "&:hover: not(:disabled)": {
        borderColor: "rgba(156, 39, 176, 0.6)",
        background: "rgba(156, 39, 176, 0.05)",
      },
    }}
  >
    Add H2H Match
  </Button>
));

AddButton.displayName = "AddButton";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HeadToHeadInput = memo(({ matches = [], onChange, disabled = false }) => {
  const [expanded, setExpanded] = useState(true);

  // =========================================================================
  // MEMOIZED SELECTORS
  // =========================================================================

  const matchCount = useMemo(() => matches.length, [matches]);
  const canAddMore = useMemo(() => matchCount < MAX_H2H_MATCHES, [matchCount]);

  // =========================================================================
  // MEMOIZED CALLBACKS
  // =========================================================================

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleAdd = useCallback(() => {
    onChange([...matches, { ...EMPTY_H2H_MATCH }]);
  }, [matches, onChange]);

  const handleRemove = useCallback(
    (index) => {
      if (index < 0 || index >= matches.length) return;
      onChange(matches.filter((_, idx) => idx !== index));
    },
    [matches, onChange]
  );

  const handleChangeField = useCallback(
    (index, field, value) => {
      if (index < 0 || index >= matches.length) return;

      const updated = [...matches];
      const match = updated[index];

      // Early exit if value hasn't changed
      if (match[field] === value) return;

      updated[index] = { ...match, [field]: value };

      // Auto-calculate result from score
      if (field === "score") {
        const calculatedResult = calculateResultFromScore(value);
        if (calculatedResult) {
          updated[index].result = calculatedResult;
        }
      }

      onChange(updated);
    },
    [matches, onChange]
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Box mb={4}>
      <H2HHeader
        matchCount={matchCount}
        expanded={expanded}
        onToggle={toggleExpanded}
      />

      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {matches.map((match, index) => (
            <H2HMatchRow
              key={`h2h-${index}`}
              match={match}
              index={index}
              onChangeField={handleChangeField}
              onRemove={handleRemove}
              disabled={disabled}
            />
          ))}
        </Grid>

        <AddButton
          onClick={handleAdd}
          disabled={disabled}
          matchCount={matchCount}
        />
      </Collapse>
    </Box>
  );
});

HeadToHeadInput.displayName = "HeadToHeadInput";

export default HeadToHeadInput;
