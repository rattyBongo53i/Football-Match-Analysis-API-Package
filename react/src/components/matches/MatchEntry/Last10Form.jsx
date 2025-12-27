import React, { useState, useCallback, memo, useMemo, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

// ============================================================================
// STATIC CONSTANTS - Prevent recreation on every render
// ============================================================================

const OUTCOME_OPTIONS = [
  { value: "W", label: "Win", color: "success. main" },
  { value: "D", label: "Draw", color: "warning.main" },
  { value: "L", label: "Loss", color: "error.main" },
];

const MAX_MATCHES = 10;
const EMPTY_ROW = { opponent: "", result: "", outcome: "" };

// Memoized outcome color lookup (prevents object creation)
const OUTCOME_COLOR_MAP = OUTCOME_OPTIONS.reduce((map, opt) => {
  map[opt.value] = opt.color;
  return map;
}, {});

// ============================================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================================

/**
 * Opponent Input Field - Memoized to prevent re-render on sibling updates
 */
const OpponentField = memo(({ value, onChange, disabled }) => (
  <TextField
    fullWidth
    size="small"
    label="Opponent"
    value={value}
    onChange={onChange}
    variant="outlined"
    disabled={disabled}
  />
));

OpponentField.displayName = "OpponentField";

/**
 * Result Input Field - Memoized to prevent re-render on sibling updates
 */
const ResultField = memo(({ value, onChange, disabled }) => (
  <TextField
    fullWidth
    size="small"
    label="Score"
    placeholder="e.g., 2-1"
    value={value}
    onChange={onChange}
    variant="outlined"
    disabled={disabled}
  />
));

ResultField.displayName = "ResultField";

/**
 * Outcome Select Field - Memoized to prevent re-render on sibling updates
 */
const OutcomeSelect = memo(({ value, onChange, disabled }) => {
  const outcomeColor = useMemo(
    () => OUTCOME_COLOR_MAP[value] || "inherit",
    [value]
  );

  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel>Outcome</InputLabel>
      <Select
        value={value}
        label="Outcome"
        onChange={onChange}
        sx={{
          "& .MuiSelect-select": { color: outcomeColor },
        }}
      >
        <MenuItem value="">
          <em>Select outcome</em>
        </MenuItem>
        {OUTCOME_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

OutcomeSelect.displayName = "OutcomeSelect";

/**
 * Delete Button - Memoized to prevent re-render
 */
const DeleteButton = memo(({ onClick, disabled }) => (
  <Tooltip title="Delete match">
    <span>
      <IconButton
        onClick={onClick}
        color="error"
        size="small"
        disabled={disabled}
      >
        <Delete />
      </IconButton>
    </span>
  </Tooltip>
));

DeleteButton.displayName = "DeleteButton";

/**
 * Empty State Component - Memoized
 */
const EmptyState = memo(() => (
  <Paper
    elevation={0}
    sx={{ p: 4, textAlign: "center", bgcolor: "background.default" }}
  >
    <Typography variant="body2" color="text.secondary">
      No matches added. Click "Add Match" to start.
    </Typography>
  </Paper>
));

EmptyState.displayName = "EmptyState";

/**
 * Header Component - Memoized
 */
const Header = memo(({ title, listLength, isFull, onAddClick, disabled }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
    }}
  >
    <Typography variant="h6" color="text.primary">
      {title}
    </Typography>
    <Button
      variant="contained"
      color="secondary"
      startIcon={<Add />}
      onClick={onAddClick}
      size="small"
      disabled={isFull || disabled}
    >
      Add Match ({listLength}/{MAX_MATCHES})
    </Button>
  </Box>
));

Header.displayName = "Header";

/**
 * Row component - Memoized to prevent re-render on list updates
 * Each row only updates when its own data changes
 */
const Row = memo(
  function Row({ item, index, updateRow, deleteRow, disabled }) {
    // Memoize callbacks to maintain stable references
    const handleOpponentChange = useCallback(
      (e) => updateRow(index, "opponent", e.target.value),
      [index, updateRow]
    );

    const handleResultChange = useCallback(
      (e) => updateRow(index, "result", e.target.value),
      [index, updateRow]
    );

    const handleOutcomeChange = useCallback(
      (e) => updateRow(index, "outcome", e.target.value),
      [index, updateRow]
    );

    const handleDelete = useCallback(
      () => deleteRow(index),
      [index, deleteRow]
    );

    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "background.paper" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <OpponentField
              value={item.opponent}
              onChange={handleOpponentChange}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <ResultField
              value={item.result}
              onChange={handleResultChange}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <OutcomeSelect
              value={item.outcome}
              onChange={handleOutcomeChange}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <DeleteButton onClick={handleDelete} disabled={disabled} />
          </Grid>
        </Grid>
      </Paper>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for Row memo
    // Only update if item object reference changed OR index changed
    return (
      prevProps.item === nextProps.item &&
      prevProps.index === nextProps.index &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

Row.displayName = "Last10Row";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Last10Form = memo(
  function Last10Form({ title, onChange, disabled = false }) {
    const [list, setList] = useState([]);

    // =========================================================================
    // MEMOIZED SELECTORS
    // =========================================================================

    const listLength = useMemo(() => list.length, [list]);
    const isFull = useMemo(() => listLength >= MAX_MATCHES, [listLength]);

    // =========================================================================
    // EFFECTS
    // =========================================================================

    // Single source of truth:  notify parent once when list changes
    useEffect(() => {
      if (typeof onChange === "function") {
        onChange(list);
      }
    }, [list, onChange]);

    // =========================================================================
    // MEMOIZED CALLBACKS
    // =========================================================================

    const addRow = useCallback(() => {
      if (isFull) return;

      setList((prev) => {
        const updated = [...prev, { ...EMPTY_ROW }];
        return updated;
      });
    }, [isFull]);

    const updateRow = useCallback((index, field, value) => {
      setList((prev) => {
        // Early exit if index is invalid
        if (index < 0 || index >= prev.length) return prev;

        const existing = prev[index];

        // Early exit if value hasn't changed (prevents unnecessary re-renders)
        if (existing[field] === value) return prev;

        // Only update the changed row
        const updated = [...prev];
        updated[index] = { ...existing, [field]: value };
        return updated;
      });
    }, []);

    const deleteRow = useCallback((index) => {
      setList((prev) => {
        // Early exit if index is invalid
        if (index < 0 || index >= prev.length) return prev;

        const updated = prev.filter((_, i) => i !== index);
        return updated;
      });
    }, []);

    const handleAddClick = useCallback(() => {
      addRow();
    }, [addRow]);

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
      <Box>
        <Header
          title={title}
          listLength={listLength}
          isFull={isFull}
          onAddClick={handleAddClick}
          disabled={disabled}
        />

        {listLength === 0 ? (
          <EmptyState />
        ) : (
          list.map((item, index) => (
            <Row
              key={`row-${index}`}
              item={item}
              index={index}
              updateRow={updateRow}
              deleteRow={deleteRow}
              disabled={disabled}
            />
          ))
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for Last10Form memo
    return (
      prevProps.title === nextProps.title &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

Last10Form.displayName = "Last10Form";

export default Last10Form;
