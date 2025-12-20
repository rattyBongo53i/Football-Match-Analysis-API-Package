import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Chip,
  Typography,
  Button,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Delete,
  Visibility,
  TrendingUp,
  AttachMoney,
  Risk,
  Info,
  Sports,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const SlipCard = ({ slip, onDelete, onViewDetail }) => {
  const theme = useTheme();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Low Risk":
        return "success";
      case "Medium Risk":
        return "warning";
      case "High Risk":
        return "error";
      default:
        return "default";
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(false);
    onDelete(slip.slip_id);
  };

  const confidencePercentage = slip.confidence_score;

  return (
    <>
      <Card
        elevation={2}
        sx={{
          mb: 2,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          transition: "all 0.2s",
          "&:hover": {
            boxShadow: 4,
            transform: "translateY(-2px)",
          },
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box>
              <Typography variant="h6" component="div" gutterBottom>
                {slip.slip_id}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  icon={<TrendingUp />}
                  label={`Confidence: ${confidencePercentage.toFixed(1)}%`}
                  color="primary"
                  size="small"
                />
                <Chip
                  icon={<AttachMoney />}
                  label={`Stake: $${slip.stake}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<Risk />}
                  label={slip.risk_level}
                  color={getRiskColor(slip.risk_level)}
                  size="small"
                />
              </Stack>
            </Box>
            <Box textAlign="right">
              <Typography variant="h5" color="primary">
                ${slip.possible_return.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Odds: {slip.total_odds.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Confidence Level:
            </Typography>
            <LinearProgress
              variant="determinate"
              value={confidencePercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 1,
                backgroundColor: theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    confidencePercentage > 70
                      ? theme.palette.success.main
                      : confidencePercentage > 50
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
                },
              }}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Low
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Medium
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Sports fontSize="small" />
            Selections ({slip.legs.length}):
          </Typography>

          {expanded ? (
            <Stack spacing={1}>
              {slip.legs.map((leg, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    backgroundColor: theme.palette.grey[50],
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.grey[200]}`,
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {leg.match_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {leg.market} • {leg.selection}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${leg.odds.toFixed(2)}`}
                      color="secondary"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {slip.legs
                .map((leg) => `${leg.selection} (${leg.odds.toFixed(2)})`)
                .join(" • ")}
            </Typography>
          )}

          <Box textAlign="center" mt={1}>
            <Button
              size="small"
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "Show All Selections"}
            </Button>
          </Box>
        </CardContent>

        <Divider />

        <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
          <Box>
            <Tooltip title="View Detailed Analysis">
              <IconButton
                color="primary"
                onClick={() => onViewDetail(slip.slip_id)}
                size="small"
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Information">
              <IconButton
                color="info"
                onClick={() => {
                  /* Add detailed analysis modal */
                }}
                size="small"
              >
                <Info />
              </IconButton>
            </Tooltip>
          </Box>
          <Tooltip title="Delete Slip">
            <IconButton
              color="error"
              onClick={() => setDeleteConfirmOpen(true)}
              size="small"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Slip</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete slip <strong>{slip.slip_id}</strong>
            ?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The slip and all its analysis data
            will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SlipCard;
