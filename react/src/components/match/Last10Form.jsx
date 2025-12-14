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

const outcomeOptions = [
  { value: "W", label: "Win", color: "success.main" },
  { value: "D", label: "Draw", color: "warning.main" },
  { value: "L", label: "Loss", color: "error.main" },
];

/**
 * Row component moved out of the parent to avoid re-creation on every render.
 * It receives stable callbacks (updateRow, deleteRow) and the item object.
 */
const Row = memo(function Row({ item, index, updateRow, deleteRow }) {
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

  const handleDelete = useCallback(() => deleteRow(index), [index, deleteRow]);

  const outcomeColor =
    outcomeOptions.find((opt) => opt.value === item.outcome)?.color || "inherit";

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "background.paper" }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Opponent"
            value={item.opponent}
            onChange={handleOpponentChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Score"
            placeholder="e.g., 2-1"
            value={item.result}
            onChange={handleResultChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Outcome</InputLabel>
            <Select
              value={item.outcome}
              label="Outcome"
              onChange={handleOutcomeChange}
              sx={{
                "& .MuiSelect-select": { color: outcomeColor },
              }}
            >
              <MenuItem value="">
                <em>Select outcome</em>
              </MenuItem>
              {outcomeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Tooltip title="Delete match">
            <IconButton onClick={handleDelete} color="error" size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
});

Row.displayName = "Last10Row";

/**
 * Last10Form
 * - Keeps original layout and API
 * - Optimizations:
 *   - Row moved outside and memoized so it won't be recreated each render
 *   - Handlers memoized with useCallback
 *   - onChange called once via useEffect when the list changes (avoids duplicate calls)
 *   - Minimal shallow checks to avoid unnecessary state updates
 */
const Last10Form = memo(function Last10Form({ title, onChange }) {
  const [list, setList] = useState([]);

  // Derived values
  const listLength = list.length;
  const isFull = useMemo(() => listLength >= 10, [listLength]);

  // Notify parent once whenever list changes (single source of truth)
  useEffect(() => {
    if (typeof onChange === "function") {
      onChange(list);
    }
  }, [list, onChange]);

  const addRow = useCallback(() => {
    if (isFull) return;
    setList((prev) => {
      const updated = [...prev, { opponent: "", result: "", outcome: "" }];
      return updated;
    });
  }, [isFull]);

  const updateRow = useCallback((index, field, value) => {
    setList((prev) => {
      const existing = prev[index];
      // if index invalid or value unchanged, return prev
      if (!existing || existing[field] === value) return prev;
      const updated = [...prev];
      updated[index] = { ...existing, [field]: value };
      return updated;
    });
  }, []);

  const deleteRow = useCallback((index) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  }, []);

  return (
    <Box>
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
          onClick={addRow}
          size="small"
          disabled={isFull}
        >
          Add Match ({listLength}/10)
        </Button>
      </Box>

      {listLength === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", bgcolor: "background.default" }}
        >
          <Typography variant="body2" color="text.secondary">
            No matches added. Click "Add Match" to start.
          </Typography>
        </Paper>
      ) : (
        list.map((item, index) => (
          <Row
            key={index}
            item={item}
            index={index}
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        ))
      )}
    </Box>
  );
});

Last10Form.displayName = "Last10Form";

export default Last10Form;