import React, { memo } from "react";
import { Paper, Typography, Box, Tooltip, IconButton } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

const FormBlock = memo(function FormBlock({
  title,
  children,
  tooltip,
  elevation = 2,
  sx = {},
}) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip}>
            <IconButton size="small">
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box>{children}</Box>
    </Paper>
  );
});

export default FormBlock;
