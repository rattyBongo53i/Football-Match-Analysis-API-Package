import React, { useCallback, memo } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, Help as HelpIcon } from "@mui/icons-material";
import Last10FormRow from "./Last10FormRow";
import TeamFormStats from "./TeamFormStats";
import { useTeamFormCalculator } from "../../../hooks/useTeamFormCalculator";

const Last10Form = memo(
  ({ teamName, color = "primary", value = [], onChange, disabled = false }) => {
    // Calculate derived stats from raw form
    const derivedStats = useTeamFormCalculator(value);

    const handleAddMatch = useCallback(() => {
      if (value.length >= 10) {
        return;
      }

      const newMatch = {
        opponent: "",
        result: "",
        outcome: "",
      };

      onChange([newMatch, ...value]);
    }, [value, onChange]);

    const handleUpdateRow = useCallback(
      (index, updatedRow) => {
        const newForm = [...value];
        newForm[index] = updatedRow;
        onChange(newForm);
      },
      [value, onChange]
    );

    const handleDeleteRow = useCallback(
      (index) => {
        const newForm = value.filter((_, i) => i !== index);
        onChange(newForm);
      },
      [value, onChange]
    );

    const handleManualOverride = useCallback((enabled) => {
      // This would be used if we implement manual stat editing
      console.log("Manual override:", enabled);
    }, []);

    const formatExample = useCallback(() => {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Format:</strong> Enter the team's last 10 matches from most
            recent to oldest.
            <br />
            <strong>Example:</strong> If playing against Chelsea and won 2-1,
            enter: "Chelsea" in Opponent, "2-1" in Score, select "W" in Outcome.
            <br />
            <strong>Score:</strong> Always enter as {teamName}'s goals first
            (X-Y where X = {teamName}'s goals).
          </Typography>
        </Alert>
      );
    }, [teamName]);

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
          <Typography
            variant="h6"
            sx={{ color, display: "flex", alignItems: "center", gap: 1 }}
          >
            {teamName} – Last 10 Matches
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Add a match">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMatch}
                  disabled={disabled || value.length >= 10}
                  size="small"
                >
                  Add Match ({value.length}/10)
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {formatExample()}

        {/* Matches Form */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          {value.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No matches added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add Match" to start entering the team's recent form
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Most recent → Oldest
              </Typography>

              {value.map((row, index) => (
                <Last10FormRow
                  key={index}
                  row={row}
                  index={index}
                  onUpdate={handleUpdateRow}
                  onDelete={handleDeleteRow}
                  disabled={disabled}
                />
              ))}
            </Box>
          )}

          {value.length > 0 && value.length < 10 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMatch}
                disabled={disabled}
              >
                Add Another Match
              </Button>
            </Box>
          )}

          {value.length >= 10 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Maximum of 10 matches reached. For longer form analysis,
              prioritize most recent matches.
            </Alert>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Statistics Display */}
        <TeamFormStats
          stats={derivedStats}
          teamName={teamName}
          color={color}
          onStatsOverride={handleManualOverride}
        />
      </Box>
    );
  }
);

Last10Form.displayName = "Last10Form";

export default Last10Form;
