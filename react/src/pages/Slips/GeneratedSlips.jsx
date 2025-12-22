import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  styled,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  Refresh,
  TrendingUp,
  FilterList,
  Search,
  Download,
  Sort,
  BarChart,
  ViewList,
  AttachMoney,
  Warning,
  Sports,
} from "@mui/icons-material";

import slipService from "../../services/api/slipService";
import ConfidenceChart from "../../components/matches/ConfidenceChart";
import SlipCard from "../../components/matches/SlipCard";
import SlipDetailModal from "../../components/matches/SlipDetailModal";

// Styled Components
const ScrollableSlipsContainer = styled(Box)(({ theme }) => ({
  height: "calc(100vh - 400px)", // Adjust based on your header height
  overflowY: "auto",
  paddingRight: theme.spacing(1),

  // Custom scrollbar styling
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: alpha(theme.palette.grey[300], 0.3),
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: alpha(theme.palette.primary.main, 0.5),
    borderRadius: "4px",
    "&:hover": {
      background: alpha(theme.palette.primary.main, 0.7),
    },
  },
}));

const StickySidebar = styled(Paper)(({ theme }) => ({
  position: "sticky",
  top: theme.spacing(2),
  height: "calc(100vh - 400px)",
  overflowY: "auto",

  // Custom scrollbar for sidebar
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: alpha(theme.palette.grey[300], 0.2),
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: alpha(theme.palette.secondary.main, 0.4),
    borderRadius: "3px",
    "&:hover": {
      background: alpha(theme.palette.secondary.main, 0.6),
    },
  },
}));

const FilterSection = styled(Paper)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
}));

const GeneratedSlips = () => {
  const { masterSlipId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slips, setSlips] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // State for filters and sorting
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'chart'
  const [sortBy, setSortBy] = useState("confidence"); // 'confidence', 'odds', 'return', 'risk'
  const [filterRisk, setFilterRisk] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [searchTerm, setSearchTerm] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);

  // Fetch slips data
  const fetchSlips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate with the provided data
      const mockData = {
        master_slip_id: masterSlipId,
        generated_slips: [
          // Your slips data from the payload would go here
          // Using a subset for demonstration
          ...Array.from({ length: 10 }, (_, i) => ({
            slip_id: `SLIP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            stake: 0.5,
            total_odds: 4.59 + Math.random() * 10,
            possible_return: 2.29 + Math.random() * 5,
            risk_level: ["Low Risk", "Medium Risk", "High Risk"][
              Math.floor(Math.random() * 3)
            ],
            legs: [
              {
                match_id: "EPL-20240518-001",
                market: "1X2",
                selection: ["Home", "Draw", "Away"][
                  Math.floor(Math.random() * 3)
                ],
                odds: 1.35 + Math.random() * 3,
              },
              {
                match_id: "SERIEA-20240519-001",
                market: ["1X2", "BTTS", "Over/Under"][
                  Math.floor(Math.random() * 3)
                ],
                selection: [
                  "Home",
                  "Draw",
                  "Away",
                  "Yes",
                  "No",
                  "Over",
                  "Under",
                ][Math.floor(Math.random() * 7)],
                odds: 2.0 + Math.random() * 2,
              },
            ],
            confidence_score: 40 + Math.random() * 40,
          })),
        ],
      };

      setSlips(mockData.generated_slips);

      // Calculate statistics
      const stats = calculateStatistics(mockData.generated_slips);
      setStatistics(stats);
    } catch (err) {
      setError("Failed to load generated slips. Please try again.");
      console.error("Error fetching slips:", err);
    } finally {
      setLoading(false);
    }
  }, [masterSlipId]);

  // Calculate statistics
  const calculateStatistics = (slipsData) => {
    if (!slipsData.length) return null;

    const totalSlips = slipsData.length;
    const avgConfidence =
      slipsData.reduce((sum, slip) => sum + slip.confidence_score, 0) /
      totalSlips;
    const avgOdds =
      slipsData.reduce((sum, slip) => sum + slip.total_odds, 0) / totalSlips;
    const avgReturn =
      slipsData.reduce((sum, slip) => sum + slip.possible_return, 0) /
      totalSlips;

    const riskDistribution = slipsData.reduce((acc, slip) => {
      acc[slip.risk_level] = (acc[slip.risk_level] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSlips,
      avgConfidence: avgConfidence.toFixed(1),
      avgOdds: avgOdds.toFixed(2),
      avgReturn: avgReturn.toFixed(2),
      riskDistribution,
      highestConfidence: Math.max(
        ...slipsData.map((s) => s.confidence_score)
      ).toFixed(1),
      highestReturn: Math.max(
        ...slipsData.map((s) => s.possible_return)
      ).toFixed(2),
    };
  };

  // Filter and sort slips
  const filteredSlips = useMemo(() => {
    let filtered = [...slips];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (slip) =>
          slip.slip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slip.legs.some(
            (leg) =>
              leg.match_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              leg.selection.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply risk filter
    if (filterRisk !== "all") {
      filtered = filtered.filter((slip) =>
        slip.risk_level.toLowerCase().includes(filterRisk.toLowerCase())
      );
    }

    // Apply confidence filter
    filtered = filtered.filter(
      (slip) => slip.confidence_score >= minConfidence
    );

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "confidence":
          return b.confidence_score - a.confidence_score;
        case "odds":
          return b.total_odds - a.total_odds;
        case "return":
          return b.possible_return - a.possible_return;
        case "risk":
          const riskOrder = { "High Risk": 3, "Medium Risk": 2, "Low Risk": 1 };
          return riskOrder[b.risk_level] - riskOrder[a.risk_level];
        default:
          return 0;
      }
    });

    return filtered;
  }, [slips, searchTerm, filterRisk, minConfidence, sortBy]);

  // Handle slip deletion
  const handleDeleteSlip = async (slipId) => {
    try {
      // In a real app, this would be an API call
      // await slipService.deleteSlip(slipId);

      // For now, just remove from state
      const newSlips = slips.filter((slip) => slip.slip_id !== slipId);
      setSlips(newSlips);

      // Refresh statistics based on new slips
      const stats = calculateStatistics(newSlips);
      setStatistics(stats);
    } catch (err) {
      setError("Failed to delete slip");
      console.error("Error deleting slip:", err);
    }
  };

  // Handle slip detail view
  const handleViewDetail = (slipId) => {
    const slip = slips.find((s) => s.slip_id === slipId);
    setSelectedSlip(slip);
    setDetailModalOpen(true);
  };

  // Export slips to CSV
  const handleExportCSV = async () => {
    try {
      // In a real app:
      // const blob = await slipService.exportSlipsToCSV(masterSlipId);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `slips_${masterSlipId}.csv`;
      // a.click();

      // For now, simulate download
      alert("Export feature would download CSV file in production");
    } catch (err) {
      setError("Failed to export slips");
      console.error("Error exporting slips:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSlips();
  }, [fetchSlips]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight={700}
            >
              Generated Slips
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Master Slip ID: {masterSlipId} • {slips.length} slips generated
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<ArrowBack />}
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Button
              startIcon={<Refresh />}
              variant="outlined"
              onClick={fetchSlips}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<Download />}
              variant="contained"
              onClick={handleExportCSV}
              sx={{ borderRadius: 2 }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Total Slips
                </Typography>
                <Typography variant="h4" color="primary" fontWeight={700}>
                  {statistics.totalSlips}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Avg Confidence
                </Typography>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {statistics.avgConfidence}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Avg Potential Return
                </Typography>
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  ${statistics.avgReturn}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Highest Confidence
                </Typography>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {statistics.highestConfidence}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Filters and Controls */}
      <FilterSection sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search slips or matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="confidence">Confidence</MenuItem>
                <MenuItem value="odds">Total Odds</MenuItem>
                <MenuItem value="return">Potential Return</MenuItem>
                <MenuItem value="risk">Risk Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={filterRisk}
                label="Risk Level"
                onChange={(e) => setFilterRisk(e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="all">All Risks</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="medium">Medium Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min Confidence"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              exclusive
              value={viewMode}
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="cards" sx={{ borderRadius: 1 }}>
                <ViewList sx={{ mr: 1 }} />
                Cards
              </ToggleButton>
              <ToggleButton value="chart" sx={{ borderRadius: 1 }}>
                <BarChart sx={{ mr: 1 }} />
                Chart
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </FilterSection>

      {/* Results Summary */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Showing {filteredSlips.length} of {slips.length} slips
        </Typography>
        {filterRisk !== "all" && (
          <Chip
            label={`${filterRisk.toUpperCase()} RISK`}
            onDelete={() => setFilterRisk("all")}
            color={
              filterRisk === "low"
                ? "success"
                : filterRisk === "medium"
                  ? "warning"
                  : "error"
            }
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Content Area */}
      {viewMode === "chart" ? (
        <Paper sx={{ p: 3, mb: 3, height: 500, borderRadius: 2 }}>
          <ConfidenceChart slips={filteredSlips} />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Main Slips List - Now Scrollable */}
          <Grid item xs={12} lg={8}>
            {filteredSlips.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No slips found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters or search terms
                </Typography>
              </Paper>
            ) : (
              <ScrollableSlipsContainer>
                <Stack spacing={2}>
                  {filteredSlips.map((slip) => (
                    <SlipCard
                      key={slip.slip_id}
                      slip={slip}
                      onDelete={handleDeleteSlip}
                      onViewDetail={handleViewDetail}
                    />
                  ))}
                </Stack>
              </ScrollableSlipsContainer>
            )}
          </Grid>

          {/* Sidebar with Risk Distribution */}
          <Grid item xs={12} lg={4}>
            <StickySidebar sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Risk Distribution
              </Typography>
              {statistics?.riskDistribution && (
                <Stack spacing={2} mb={3}>
                  {Object.entries(statistics.riskDistribution).map(
                    ([risk, count]) => {
                      const percentageNum =
                        (count / statistics.totalSlips) * 100;
                      return (
                        <Box key={risk}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={0.5}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {risk}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {count} ({percentageNum.toFixed(1)}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentageNum}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(
                                theme.palette.grey[300],
                                0.3
                              ),
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  risk === "Low Risk"
                                    ? theme.palette.success.main
                                    : risk === "Medium Risk"
                                      ? theme.palette.warning.main
                                      : theme.palette.error.main,
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      );
                    }
                  )}
                </Stack>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => setSortBy("confidence")}
                  sx={{ borderRadius: 2, justifyContent: "flex-start" }}
                >
                  Sort by Highest Confidence
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => setSortBy("return")}
                  sx={{ borderRadius: 2, justifyContent: "flex-start" }}
                >
                  Sort by Highest Return
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Warning />}
                  onClick={() => setFilterRisk("low")}
                  sx={{ borderRadius: 2, justifyContent: "flex-start" }}
                >
                  Show Low Risk Only
                </Button>
              </Stack>

              {/* Quick Stats Summary */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Stats
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Filtered Slips:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {filteredSlips.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="success.main"
                  >
                    {statistics?.avgConfidence}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Avg Return:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="warning.main"
                  >
                    ${statistics?.avgReturn}
                  </Typography>
                </Box>
              </Stack>
            </StickySidebar>
          </Grid>
        </Grid>
      )}

      {/* Slip Detail Modal */}
      {selectedSlip && (
        <SlipDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          slip={selectedSlip}
        />
      )}
    </Container>
  );
};

export default GeneratedSlips;
