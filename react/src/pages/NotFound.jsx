import React from "react";
import {
  Container,
  Typography,
  Button,
  Stack,
  Box,
  useTheme,
} from "@mui/material";
import { ArrowBack, Home } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const attemptedPath = location.pathname + location.search;

  // Cute cartoon illustration of a lost character with a map (royalty-free stock)
  const cartoonUrl =
    "https://thumbs.dreamstime.com/b/lost-character-map-searching-direction-whimsical-error-page-digital-illustration-setting-stands-holding-puzzled-384591245.jpg";

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 4,
      }}
    >
      <Stack spacing={4} alignItems="center">
        {/* Huge Cartoon Illustration */}
        <Box
          component="img"
          src={cartoonUrl}
          alt="Lost character looking at a map - 404 Not Found"
          sx={{
            width: "100%",
            maxWidth: 500,
            height: "auto",
            borderRadius: 4,
            boxShadow: 6,
            bgcolor: "background.paper",
          }}
        />

        {/* 404 Title */}
        <Typography
          variant="h1"
          fontWeight="bold"
          color={theme.palette.error.main}
          sx={{ fontSize: { xs: "4rem", md: "6rem" } }}
        >
          404
        </Typography>

        {/* Main Message */}
        <Typography variant="h4" gutterBottom color="text.primary">
          Oops! Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          The page you're looking for at{" "}
          <Typography component="span" fontWeight="bold" color="primary">
            {attemptedPath || "/unknown"}
          </Typography>{" "}
          doesn't exist. It might have been moved, deleted, or you may have
          mistyped the URL.
        </Typography>

        {/* Navigation Buttons */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate("/matches")}
            color="primary"
          >
            Back to Matches
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default NotFound;
