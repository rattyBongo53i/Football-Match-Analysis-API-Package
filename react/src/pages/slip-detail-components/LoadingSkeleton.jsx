import React from "react";
import { Box, Skeleton } from "@mui/material";

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="text" width={120} height={40} sx={{ mb: 3 }} />
    <Skeleton
      variant="rectangular"
      height={200}
      sx={{ borderRadius: 3, mb: 3 }}
    />
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
  </Box>
);

export default LoadingSkeleton;
