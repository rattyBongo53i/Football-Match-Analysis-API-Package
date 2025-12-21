import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  LinearProgress,
    Divider,
  Grid,
} from "@mui/material";
import {
  ReceiptLong as SlipIcon,
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendIcon,
  Schedule as TimeIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
} from "@mui/icons-material";

const SlipCard = ({ slip, onView, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "processing":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CompleteIcon />;
      default:
        return <TimeIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const progress =
    slip.matches_count && slip.matches_count > 0
      ? Math.min((slip.matches_count / 10) * 100, 100)
      : 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SlipIcon fontSize="small" /> {slip.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created {formatDate(slip.created_at)}
            </Typography>
          </Box>

          <Chip
            icon={getStatusIcon(slip.status)}
            label={slip.status}
            color={getStatusColor(slip.status)}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Statistics */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SoccerIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="h6">{slip.matches_count || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Matches
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="h6">
                  {slip.generated_slips_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Generated
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            gutterBottom
          >
            Completion: {slip.matches_count || 0}/10 matches
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={progress >= 100 ? "success" : "primary"}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Quick Stats */}
        {slip.stake && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Stake:{" "}
              <Typography
                component="span"
                fontWeight="bold"
                color="primary.main"
              >
                ${slip.stake}
              </Typography>
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          startIcon={<ViewIcon />}
          onClick={onView}
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          View Details
        </Button>
        <IconButton
          onClick={onDelete}
          color="error"
          sx={{ ml: 1 }}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default SlipCard;
