import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Divider,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  AttachMoney,
  Sports,
  ShowChart,
  Security,
  Timeline,
  BarChart,
  PieChart,
  History,
  Share,
  Download,
  Print,
  Refresh,
  Warning,
  Info,
  CalendarToday,
  AccountBalanceWallet,
  LocalOffer,
  Assessment,
  CompareArrows,
  Psychology,
  QueryStats,
  EmojiEvents,
} from "@mui/icons-material";
import slipApi from "../services/api/slipApi";

const MasterSlipAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced theme constants for better contrast and shadows
  const designTokens = {
    shadows: {
      card: "0px 4px 12px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.05)",
      elevated:
        "0px 8px 24px rgba(0, 0, 0, 0.12), 0px 4px 8px rgba(0, 0, 0, 0.08)",
      strong:
        "0px 12px 32px rgba(0, 0, 0, 0.15), 0px 6px 12px rgba(0, 0, 0, 0.1)",
    },
    colors: {
      text: {
        primary: "#1A2027", // Darker for better contrast
        secondary: "#5F6368", // Improved contrast ratio
        tertiary: "#80868B", // Still readable
      },
      backgrounds: {
        paper: "#FFFFFF",
        default: "#F8F9FA", // Lighter for better contrast
        subtle: "#F5F7FA",
      },
      gradients: {
        confidence: "linear-gradient(135deg, #4F6BED 0%, #3A56D4 100%)",
        odds: "linear-gradient(135deg, #E44D8C 0%, #C93B6D 100%)",
        returns: "linear-gradient(135deg, #38B2AC 0%, #2C9C96 100%)",
        risk: "linear-gradient(135deg, #10B981 0%, #0EA271 100%)",
      },
    },
  };

  useEffect(() => {
    fetchSlipData();
  }, [id]);

  const fetchSlipData = async () => {
    try {
      setLoading(true);
      const response = await slipApi.getSlipForDashboard(id);
      const data = response.data?.data || response.data;
      setSlip(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching slip analysis:", err);
      setError("Failed to load slip analysis");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSlipData();
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!slip) return null;

    const matches = slip.matches || [];
    const stake = slip.stake || 0;
    const totalOdds = slip.total_odds || 1;

    // Calculate statistics
    const possibleReturn = stake * totalOdds;
    const potentialProfit = possibleReturn - stake;
    const roi = stake > 0 ? (potentialProfit / stake) * 100 : 0;

    // Confidence analysis
    const confidenceScore = slip.confidence_score || 0;
    const riskLevel =
      slip.risk_level ||
      (confidenceScore >= 75
        ? "Low"
        : confidenceScore >= 50
          ? "Medium"
          : "High");

    // Match statistics
    const marketDistribution = {};
    matches.forEach((match) => {
      const market = match.market || "Unknown";
      marketDistribution[market] = (marketDistribution[market] || 0) + 1;
    });

    // League distribution
    const leagueDistribution = {};
    matches.forEach((match) => {
      const league = match.league || "Unknown";
      leagueDistribution[league] = (leagueDistribution[league] || 0) + 1;
    });

    // Odds analysis
    const averageOdds =
      matches.length > 0
        ? matches.reduce(
            (sum, match) => sum + (parseFloat(match.odds) || 1),
            0
          ) / matches.length
        : 1;

    // Risk assessment
    const getRiskAssessment = () => {
      if (matches.length >= 8) return "Very High Risk";
      if (matches.length >= 5) return "High Risk";
      if (matches.length >= 3) return "Medium Risk";
      return "Low Risk";
    };

    return {
      stake,
      totalOdds,
      possibleReturn,
      potentialProfit,
      roi,
      confidenceScore,
      riskLevel,
      matchesCount: matches.length,
      marketDistribution,
      leagueDistribution,
      averageOdds,
      riskAssessment: getRiskAssessment(),
      avgConfidence:
        matches.length > 0
          ? matches.reduce((sum, match) => sum + (match.confidence || 50), 0) /
            matches.length
          : 50,
    };
  }, [slip]);

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 8,
          textAlign: "center",
          bgcolor: designTokens.colors.backgrounds.default,
        }}
      >
        <CircularProgress size={60} />
        <Typography
          variant="h6"
          sx={{ mt: 3, color: designTokens.colors.text.primary }}
        >
          Loading Master Slip Analysis...
        </Typography>
      </Container>
    );
  }

  if (error || !slip) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 8,
          bgcolor: designTokens.colors.backgrounds.default,
        }}
      >
        <Alert
          severity="error"
          sx={{
            mb: 3,
            boxShadow: designTokens.shadows.card,
            border: "1px solid rgba(211, 47, 47, 0.1)",
          }}
        >
          {error || "Failed to load slip analysis"}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="contained"
          sx={{
            boxShadow: designTokens.shadows.card,
            "&:hover": { boxShadow: designTokens.shadows.elevated },
          }}
        >
          Back to Slips
        </Button>
      </Container>
    );
  }

  const TabPanel = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        bgcolor: designTokens.colors.backgrounds.default,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            color: designTokens.colors.text.secondary,
            fontWeight: 500,
          }}
        >
          Back to Slips
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            boxShadow: designTokens.shadows.card,
            bgcolor: designTokens.colors.backgrounds.paper,
            border: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight="800"
                  color={designTokens.colors.text.primary}
                >
                  {slip.name || "Master Slip Analysis"}
                </Typography>
                <Chip
                  label={`ID: ${id}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: designTokens.colors.text.secondary,
                  }}
                />
                {slip.status && (
                  <Chip
                    label={slip.status}
                    color={
                      slip.status === "Won"
                        ? "success"
                        : slip.status === "Lost"
                          ? "error"
                          : slip.status === "Pending"
                            ? "warning"
                            : "default"
                    }
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  />
                )}
              </Box>

              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <Chip
                  icon={<CalendarToday />}
                  label={`Created: ${new Date(slip.created_at).toLocaleDateString()}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: alpha(theme.palette.text.secondary, 0.2),
                    color: designTokens.colors.text.secondary,
                    fontWeight: 500,
                  }}
                />
                <Chip
                  icon={<Sports />}
                  label={`${analytics.matchesCount} Matches`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: alpha(theme.palette.text.secondary, 0.2),
                    color: designTokens.colors.text.secondary,
                    fontWeight: 500,
                  }}
                />
                <Chip
                  icon={<AttachMoney />}
                  label={`Stake: ${slip.currency || "USD"} ${analytics.stake.toFixed(2)}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: alpha(theme.palette.text.secondary, 0.2),
                    color: designTokens.colors.text.secondary,
                    fontWeight: 500,
                  }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Tooltip title="Refresh Analysis">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{
                      bgcolor: designTokens.colors.backgrounds.subtle,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share Analysis">
                  <IconButton
                    sx={{
                      bgcolor: designTokens.colors.backgrounds.subtle,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Share />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <IconButton
                    sx={{
                      bgcolor: designTokens.colors.backgrounds.subtle,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<EmojiEvents />}
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    boxShadow: designTokens.shadows.card,
                    "&:hover": { boxShadow: designTokens.shadows.elevated },
                  }}
                >
                  Place Bet
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: designTokens.colors.gradients.confidence,
              color: "white",
              borderRadius: 3,
              height: "100%",
              boxShadow: designTokens.shadows.elevated,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: designTokens.shadows.strong,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ShowChart sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  Confidence
                </Typography>
              </Box>
              <Typography variant="h2" fontWeight="800" sx={{ mb: 1 }}>
                {analytics.confidenceScore}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analytics.confidenceScore}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha("#fff", 0.3),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#fff",
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, mt: 2, fontWeight: 500 }}
              >
                {analytics.confidenceScore >= 75
                  ? "High confidence level"
                  : analytics.confidenceScore >= 50
                    ? "Moderate confidence"
                    : "Review recommended"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: designTokens.colors.gradients.odds,
              color: "white",
              borderRadius: 3,
              height: "100%",
              boxShadow: designTokens.shadows.elevated,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: designTokens.shadows.strong,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <TrendingUp sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  Total Odds
                </Typography>
              </Box>
              <Typography variant="h2" fontWeight="800" sx={{ mb: 1 }}>
                {analytics.totalOdds.toFixed(2)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, mt: 2, fontWeight: 500 }}
              >
                Average: {analytics.averageOdds.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: designTokens.colors.gradients.returns,
              color: "white",
              borderRadius: 3,
              height: "100%",
              boxShadow: designTokens.shadows.elevated,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: designTokens.shadows.strong,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <AccountBalanceWallet sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  Potential Return
                </Typography>
              </Box>
              <Typography variant="h2" fontWeight="800" sx={{ mb: 1 }}>
                {slip.currency || "USD"} {analytics.possibleReturn.toFixed(2)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, mt: 2, fontWeight: 500 }}
              >
                Profit: {analytics.potentialProfit.toFixed(2)} (
                {analytics.roi.toFixed(1)}% ROI)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: designTokens.colors.gradients.risk,
              color: "white",
              borderRadius: 3,
              height: "100%",
              boxShadow: designTokens.shadows.elevated,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: designTokens.shadows.strong,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Security sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  Risk Level
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label={analytics.riskLevel}
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    height: 44,
                    px: 2,
                    backgroundColor: alpha("#fff", 0.2),
                    color: "white",
                    border: "2px solid rgba(255,255,255,0.4)",
                    backdropFilter: "blur(8px)",
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, mt: 3, fontWeight: 500 }}
              >
                {analytics.riskAssessment}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: designTokens.shadows.card,
          bgcolor: designTokens.colors.backgrounds.paper,
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: designTokens.colors.backgrounds.paper,
            "& .MuiTab-root": {
              minHeight: 64,
              fontSize: "0.95rem",
              fontWeight: 600,
              color: designTokens.colors.text.secondary,
              "&.Mui-selected": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<Sports />} label="Match Details" />
          <Tab icon={<BarChart />} label="Analytics" />
          <Tab icon={<Timeline />} label="Performance" />
          <Tab icon={<Psychology />} label="AI Insights" />
          <Tab icon={<CompareArrows />} label="Alternatives" />
          <Tab icon={<History />} label="History" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* Tab 1: Overview */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    height: "100%",
                    boxShadow: designTokens.shadows.card,
                    bgcolor: designTokens.colors.backgrounds.paper,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 3,
                      color: designTokens.colors.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    <ShowChart /> Summary Analysis
                  </Typography>

                  <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 2,
                          border: "1px solid rgba(79, 107, 237, 0.1)",
                        }}
                      >
                        <Typography
                          variant="h4"
                          color="primary"
                          fontWeight="800"
                        >
                          {analytics.matchesCount}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={designTokens.colors.text.secondary}
                          fontWeight={500}
                          sx={{ mt: 0.5 }}
                        >
                          Total Matches
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2.5,
                          bgcolor: alpha(theme.palette.secondary.main, 0.08),
                          borderRadius: 2,
                          border: "1px solid rgba(228, 77, 140, 0.1)",
                        }}
                      >
                        <Typography
                          variant="h4"
                          color="secondary"
                          fontWeight="800"
                        >
                          {Object.keys(analytics.marketDistribution).length}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={designTokens.colors.text.secondary}
                          fontWeight={500}
                          sx={{ mt: 0.5 }}
                        >
                          Market Types
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2.5,
                          bgcolor: alpha(theme.palette.info.main, 0.08),
                          borderRadius: 2,
                          border: "1px solid rgba(56, 178, 172, 0.1)",
                        }}
                      >
                        <Typography
                          variant="h4"
                          color="info.main"
                          fontWeight="800"
                        >
                          {analytics.avgConfidence.toFixed(0)}%
                        </Typography>
                        <Typography
                          variant="body2"
                          color={designTokens.colors.text.secondary}
                          fontWeight={500}
                          sx={{ mt: 0.5 }}
                        >
                          Avg Confidence
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2.5,
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          borderRadius: 2,
                          border: "1px solid rgba(16, 185, 129, 0.1)",
                        }}
                      >
                        <Typography
                          variant="h4"
                          color="success.main"
                          fontWeight="800"
                        >
                          {analytics.roi.toFixed(1)}%
                        </Typography>
                        <Typography
                          variant="body2"
                          color={designTokens.colors.text.secondary}
                          fontWeight={500}
                          sx={{ mt: 0.5 }}
                        >
                          ROI
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  <Typography
                    variant="h6"
                    gutterBottom
                    color={designTokens.colors.text.primary}
                    fontWeight={700}
                    sx={{ mb: 3 }}
                  >
                    Risk Assessment
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Alert
                          severity={
                            analytics.confidenceScore >= 75
                              ? "success"
                              : analytics.confidenceScore >= 50
                                ? "warning"
                                : "error"
                          }
                          sx={{
                            boxShadow: designTokens.shadows.card,
                            border: "1px solid rgba(0, 0, 0, 0.06)",
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            Confidence Level:{" "}
                            {analytics.confidenceScore >= 75
                              ? "High"
                              : analytics.confidenceScore >= 50
                                ? "Medium"
                                : "Low"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              color: designTokens.colors.text.primary,
                            }}
                          >
                            {analytics.confidenceScore >= 75
                              ? "This slip shows strong confidence indicators based on historical data and AI analysis."
                              : analytics.confidenceScore >= 50
                                ? "Moderate confidence level. Consider reviewing individual match analysis."
                                : "Low confidence level. High risk detected. Review recommendations below."}
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Alert
                          severity={
                            analytics.riskLevel === "Low"
                              ? "success"
                              : analytics.riskLevel === "Medium"
                                ? "warning"
                                : "error"
                          }
                          sx={{
                            boxShadow: designTokens.shadows.card,
                            border: "1px solid rgba(0, 0, 0, 0.06)",
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            Risk Profile: {analytics.riskLevel}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              color: designTokens.colors.text.primary,
                            }}
                          >
                            Based on {analytics.matchesCount} matches with
                            combined odds of {analytics.totalOdds.toFixed(2)}
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    height: "100%",
                    boxShadow: designTokens.shadows.card,
                    bgcolor: designTokens.colors.backgrounds.paper,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 3,
                      color: designTokens.colors.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    <QueryStats /> Quick Actions
                  </Typography>

                  <Stack spacing={2.5}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      startIcon={<EmojiEvents />}
                      sx={{
                        fontWeight: 600,
                        py: 1.5,
                        boxShadow: designTokens.shadows.card,
                        "&:hover": { boxShadow: designTokens.shadows.elevated },
                      }}
                    >
                      Place This Bet
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<CompareArrows />}
                      sx={{
                        fontWeight: 500,
                        py: 1.25,
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        "&:hover": { borderColor: theme.palette.primary.main },
                      }}
                    >
                      Compare Alternatives
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      startIcon={<TrendingUp />}
                      sx={{
                        fontWeight: 500,
                        py: 1.25,
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        "&:hover": {
                          borderColor: theme.palette.secondary.main,
                        },
                      }}
                    >
                      Run Advanced Analysis
                    </Button>

                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<Psychology />}
                      sx={{
                        fontWeight: 500,
                        py: 1.25,
                        borderColor: alpha(theme.palette.warning.main, 0.3),
                        "&:hover": { borderColor: theme.palette.warning.main },
                      }}
                    >
                      Get AI Recommendations
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Typography
                      variant="subtitle2"
                      color={designTokens.colors.text.secondary}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontWeight: 500,
                      }}
                    >
                      <Info sx={{ verticalAlign: "middle", mr: 1 }} />
                      Last updated:{" "}
                      {new Date(
                        slip.updated_at || slip.created_at
                      ).toLocaleString()}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Match Details */}
          <TabPanel value={activeTab} index={1}>
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: designTokens.shadows.card,
                bgcolor: designTokens.colors.backgrounds.paper,
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 3,
                  color: designTokens.colors.text.primary,
                  fontWeight: 700,
                }}
              >
                <Sports /> Match Selections
              </Typography>

              {slip.matches?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: designTokens.colors.backgrounds.subtle,
                          "& th": {
                            fontWeight: 700,
                            color: designTokens.colors.text.primary,
                            borderBottom: "2px solid rgba(0, 0, 0, 0.1)",
                          },
                        }}
                      >
                        <TableCell>Match</TableCell>
                        <TableCell>League</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Market</TableCell>
                        <TableCell>Selection</TableCell>
                        <TableCell align="right">Odds</TableCell>
                        <TableCell align="center">Confidence</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {slip.matches.map((match, index) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            "&:hover": {
                              bgcolor: designTokens.colors.backgrounds.subtle,
                            },
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              fontWeight="600"
                              color={designTokens.colors.text.primary}
                            >
                              {match.home_team} vs {match.away_team}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.league}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(
                                  theme.palette.text.secondary,
                                  0.2
                                ),
                                color: designTokens.colors.text.secondary,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={designTokens.colors.text.primary}
                              fontWeight={500}
                            >
                              {match.match_date
                                ? new Date(
                                    match.match_date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={designTokens.colors.text.secondary}
                            >
                              {match.match_date
                                ? new Date(match.match_date).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )
                                : ""}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.market_name || match.market}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.selection || "N/A"}
                              size="small"
                              sx={{
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.12
                                ),
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="h6"
                              fontWeight="700"
                              color="secondary"
                            >
                              {parseFloat(match.odds || 1).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  position: "relative",
                                  display: "inline-flex",
                                  mr: 1,
                                }}
                              >
                                <CircularProgress
                                  variant="determinate"
                                  value={match.confidence || 50}
                                  size={40}
                                  thickness={4}
                                  sx={{
                                    color:
                                      match.confidence >= 75
                                        ? "success.main"
                                        : match.confidence >= 50
                                          ? "warning.main"
                                          : "error.main",
                                  }}
                                />
                                <Box
                                  sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: "absolute",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    component="div"
                                    fontWeight="700"
                                    color={designTokens.colors.text.primary}
                                  >
                                    {(match.confidence || 50).toFixed(0)}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={match.status || "Pending"}
                              size="small"
                              color={
                                match.status === "Won"
                                  ? "success"
                                  : match.status === "Lost"
                                    ? "error"
                                    : match.status === "Live"
                                      ? "warning"
                                      : "default"
                              }
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Sports
                    sx={{
                      fontSize: 64,
                      color: designTokens.colors.text.secondary,
                      opacity: 0.2,
                      mb: 3,
                    }}
                  />
                  <Typography
                    variant="h6"
                    color={designTokens.colors.text.primary}
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    No matches found in this slip
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    component={Link}
                    to={`/slips/${id}`}
                  >
                    Add Matches
                  </Button>
                </Box>
              )}
            </Paper>
          </TabPanel>

          {/* Tab 3: Analytics */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    height: "100%",
                    boxShadow: designTokens.shadows.card,
                    bgcolor: designTokens.colors.backgrounds.paper,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 3,
                      color: designTokens.colors.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    <BarChart /> Market Distribution
                  </Typography>
                  <Stack spacing={3}>
                    {Object.entries(analytics.marketDistribution).map(
                      ([market, count]) => (
                        <Box key={market}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color={designTokens.colors.text.primary}
                              fontWeight={500}
                            >
                              {market}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              color={designTokens.colors.text.primary}
                            >
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / analytics.matchesCount) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      )
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    height: "100%",
                    boxShadow: designTokens.shadows.card,
                    bgcolor: designTokens.colors.backgrounds.paper,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 3,
                      color: designTokens.colors.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    <PieChart /> League Distribution
                  </Typography>
                  <Stack spacing={3}>
                    {Object.entries(analytics.leagueDistribution).map(
                      ([league, count]) => (
                        <Box key={league}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color={designTokens.colors.text.primary}
                              fontWeight={500}
                            >
                              {league}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              color={designTokens.colors.text.primary}
                            >
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / analytics.matchesCount) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(
                                theme.palette.secondary.main,
                                0.1
                              ),
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: theme.palette.secondary.main,
                              },
                            }}
                          />
                        </Box>
                      )
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    boxShadow: designTokens.shadows.card,
                    bgcolor: designTokens.colors.backgrounds.paper,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 4,
                      color: designTokens.colors.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    <Timeline /> Odds Analysis
                  </Typography>
                  <Grid container spacing={3}>
                    {[
                      {
                        value: analytics.totalOdds.toFixed(2),
                        label: "Combined Odds",
                        color: "primary",
                      },
                      {
                        value: analytics.averageOdds.toFixed(2),
                        label: "Average Match Odds",
                        color: "secondary",
                      },
                      {
                        value: analytics.possibleReturn.toFixed(2),
                        label: "Potential Return",
                        color: "success",
                      },
                      {
                        value: `${analytics.roi.toFixed(1)}%`,
                        label: "ROI Percentage",
                        color: "warning",
                      },
                    ].map((metric, idx) => (
                      <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: alpha(
                              theme.palette[metric.color].main,
                              0.2
                            ),
                            bgcolor: alpha(
                              theme.palette[metric.color].main,
                              0.04
                            ),
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              borderColor: alpha(
                                theme.palette[metric.color].main,
                                0.4
                              ),
                            },
                          }}
                        >
                          <CardContent sx={{ textAlign: "center", p: 3 }}>
                            <Typography
                              variant="h3"
                              color={`${metric.color}.main`}
                              fontWeight="800"
                              sx={{ mb: 1 }}
                            >
                              {metric.value}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={designTokens.colors.text.secondary}
                              fontWeight={500}
                            >
                              {metric.label}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>

      {/* Footer Actions */}
      <Box
        sx={{
          mt: 5,
          pt: 4,
          borderTop: "1px solid rgba(0, 0, 0, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{
            color: designTokens.colors.text.secondary,
            borderColor: alpha(theme.palette.text.secondary, 0.3),
            fontWeight: 500,
            "&:hover": {
              borderColor: theme.palette.text.secondary,
            },
          }}
        >
          Back to Dashboard
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EmojiEvents />}
            size="large"
            sx={{
              fontWeight: 600,
              px: 4,
              py: 1.5,
              boxShadow: designTokens.shadows.card,
              "&:hover": { boxShadow: designTokens.shadows.elevated },
            }}
          >
            Place This Bet
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Download />}
            sx={{
              fontWeight: 500,
              borderColor: alpha(theme.palette.secondary.main, 0.3),
              "&:hover": { borderColor: theme.palette.secondary.main },
            }}
          >
            Export Analysis
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default MasterSlipAnalysisPage;
