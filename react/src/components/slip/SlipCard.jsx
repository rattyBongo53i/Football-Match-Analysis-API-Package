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

  // Handler for the View button click
  const handleViewClick = (e) => {
    e.stopPropagation(); // Prevent card click event if any
    console.log("SlipCard view button clicked for slip:", slip.id);
    if (onView && typeof onView === "function") {
      onView();
    } else {
      console.error("onView is not a function or not provided");
    }
  };

  // Handler for the Delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click event if any
    if (onDelete && typeof onDelete === "function") {
      onDelete();
    }
  };

  // Optional: Handle clicking the entire card
  const handleCardClick = () => {
    if (onView && typeof onView === "function") {
      onView();
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        cursor: "pointer", // Makes it look clickable
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
      onClick={handleCardClick}
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
          onClick={handleViewClick}
          fullWidth
          sx={{
            borderRadius: 2,
            "&:hover": {
              backgroundColor: "primary.dark",
            },
          }}
        >
          View Details
        </Button>
        {onDelete && (
          <IconButton
            onClick={handleDeleteClick}
            color="error"
            sx={{ ml: 1 }}
            size="small"
            aria-label="delete slip"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default SlipCard;
