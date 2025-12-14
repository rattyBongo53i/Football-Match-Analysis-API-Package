import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Typography,
  Box,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  SportsSoccer,
  Score,
  EmojiEvents,
  TrendingUp,
  FilterList,
  Casino,
  Shield,
  Timeline,
  FlashOn,
  Clear,
  CopyAll,
} from "@mui/icons-material";

// Market categories with icons
const MARKET_CATEGORIES = {
  result: { label: "Result", icon: <SportsSoccer />, color: "primary" },
  goals: { label: "Goals", icon: <Score />, color: "success" },
  handicap: { label: "Handicap", icon: <Timeline />, color: "warning" },
  halftime: { label: "Halftime", icon: <FlashOn />, color: "info" },
  double_chance: {
    label: "Double Chance",
    icon: <Shield />,
    color: "secondary",
  },
  correct_score: {
    label: "Correct Score",
    icon: <EmojiEvents />,
    color: "error",
  },
  goalscorer: { label: "Goalscorer", icon: <TrendingUp />, color: "primary" },
  cards: { label: "Cards", icon: <FilterList />, color: "warning" },
  corners: { label: "Corners", icon: <Casino />, color: "success" },
};

// All market configurations - REDUCED FOR DEMO (you can add more)
const MARKET_CONFIGS = {
  // Match Result
  home_win: {
    label: "Home Win",
    category: "result",
    type: "single",
    icon: "🏠",
  },
  draw: { label: "Draw", category: "result", type: "single", icon: "🤝" },
  away_win: {
    label: "Away Win",
    category: "result",
    type: "single",
    icon: "✈️",
  },

  // Goals Markets
  over_2_5: {
    label: "Over 2.5 Goals",
    category: "goals",
    type: "single",
    icon: "⬆️",
  },
  under_2_5: {
    label: "Under 2.5 Goals",
    category: "goals",
    type: "single",
    icon: "⬇️",
  },
  btts_yes: {
    label: "BTTS - Yes",
    category: "goals",
    type: "single",
    icon: "⚽",
  },
  btts_no: {
    label: "BTTS - No",
    category: "goals",
    type: "single",
    icon: "🚫",
  },

  // Double Chance Markets
  double_chance_1x: {
    label: "Double Chance 1X",
    category: "double_chance",
    type: "combo",
    icon: "🛡️",
  },
  double_chance_12: {
    label: "Double Chance 12",
    category: "double_chance",
    type: "combo",
    icon: "🛡️",
  },
  double_chance_x2: {
    label: "Double Chance X2",
    category: "double_chance",
    type: "combo",
    icon: "🛡️",
  },

  // Correct Score Markets
  correct_score_1_0: {
    label: "1-0",
    category: "correct_score",
    type: "score",
    icon: "🎯",
  },
  correct_score_2_0: {
    label: "2-0",
    category: "correct_score",
    type: "score",
    icon: "🎯",
  },
  correct_score_2_1: {
    label: "2-1",
    category: "correct_score",
    type: "score",
    icon: "🎯",
  },
  correct_score_0_0: {
    label: "0-0",
    category: "correct_score",
    type: "score",
    icon: "🎯",
  },
  correct_score_1_1: {
    label: "1-1",
    category: "correct_score",
    type: "score",
    icon: "🎯",
  },

  // Cards Markets
  total_cards_over_2_5: {
    label: "Cards Over 2.5",
    category: "cards",
    type: "single",
    icon: "🟨",
  },
  total_cards_under_2_5: {
    label: "Cards Under 2.5",
    category: "cards",
    type: "single",
    icon: "🟨",
  },

  // Corners Markets
  total_corners_over_8_5: {
    label: "Corners Over 8.5",
    category: "corners",
    type: "single",
    icon: "↩️",
  },
  total_corners_under_8_5: {
    label: "Corners Under 8.5",
    category: "corners",
    type: "single",
    icon: "↩️",
  },

  // Handicap Markets
  asian_handicap_minus_1: {
    label: "AH -1",
    category: "handicap",
    type: "single",
    icon: "➖",
  },
  asian_handicap_plus_1: {
    label: "AH +1",
    category: "handicap",
    type: "single",
    icon: "➕",
  },

  // Halftime Markets
  halftime_home: {
    label: "HT Home",
    category: "halftime",
    type: "single",
    icon: "⏱️",
  },
  halftime_draw: {
    label: "HT Draw",
    category: "halftime",
    type: "single",
    icon: "⏱️",
  },
  halftime_away: {
    label: "HT Away",
    category: "halftime",
    type: "single",
    icon: "⏱️",
  },

  // Goalscorer Markets
  first_goalscorer_home: {
    label: "1st Scorer Home",
    category: "goalscorer",
    type: "player",
    icon: "👤",
  },
  first_goalscorer_away: {
    label: "1st Scorer Away",
    category: "goalscorer",
    type: "player",
    icon: "👤",
  },
};

/**
 * Memoized row component to avoid re-render churn while typing.
 * Receives stable props and only re-renders when value or other props change.
 */
const MarketRow = memo(function MarketRow({
  marketKey,
  label,
  icon,
  type,
  value,
  onChangeValue,
  onClearValue,
}) {
  const handleChange = useCallback(
    (e) => {
      onChangeValue(e.target.value);
    },
    [onChangeValue]
  );

  const handleClear = useCallback(() => {
    onClearValue();
  }, [onClearValue]);

  const parsedValue = value ?? "";

  return (
    <TableRow
      key={marketKey}
      sx={{
        "&:hover": { backgroundColor: "action.hover" },
        backgroundColor: parsedValue
          ? "rgba(25, 118, 210, 0.08)"
          : "transparent",
      }}
    >
      <TableCell component="th" scope="row">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: "1.2em" }}>{icon}</span>
          {label}
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={type}
          size="small"
          variant="outlined"
          sx={{
            textTransform: "uppercase",
            fontSize: "0.7rem",
            fontWeight: "bold",
          }}
        />
      </TableCell>
      <TableCell align="right">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          <TextField
            size="small"
            type="number"
            value={parsedValue}
            onChange={handleChange}
            placeholder="Enter odds"
            InputProps={{
              inputProps: {
                min: 1.01,
                max: 1000,
                step: 0.01,
              },
            }}
            sx={{
              width: "120px",
              // Dark input background + white text for better visibility while typing
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#091223", // deep dark shade
                color: "#fff",
                // Outline colors
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.08)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.18)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.28)",
                },
                // Input text color and placeholder
                "& input": {
                  color: "#fff",
                  WebkitTextFillColor: "#fff", // fix for some browsers
                },
                "& textarea": {
                  color: "#fff",
                },
                "& ::placeholder": {
                  color: "rgba(255,255,255,0.6)",
                  opacity: 1,
                },
              },
            }}
          />

          {parsedValue && parseFloat(parsedValue) > 0 && (
            <>
              <Chip
                label={`${((1 / parseFloat(parsedValue)) * 100).toFixed(1)}%`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ minWidth: "60px" }}
              />

              <IconButton size="small" onClick={handleClear} sx={{ ml: 1 }}>
                <Clear fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
});
MarketRow.displayName = "MarketRow";

const OddsInputTable = ({ title, onChange, initialData = {} }) => {
  // Initialize odds state
  const [odds, setOdds] = useState(() => {
    const initialOdds = {};
    Object.keys(MARKET_CONFIGS).forEach((key) => {
      initialOdds[key] = initialData[key] ?? "";
    });
    return initialOdds;
  });

  // refs for fast access and debounced parent notification
  const oddsRef = useRef(odds);
  const notifyTimeout = useRef(null);

  // keep oddsRef in sync
  useEffect(() => {
    oddsRef.current = odds;
  }, [odds]);

  // Debounced parent notifier to avoid heavy synchronous parent updates while typing
  const scheduleNotifyParent = useCallback(
    (currentOdds) => {
      if (notifyTimeout.current) clearTimeout(notifyTimeout.current);
      if (typeof onChange === "function") {
        notifyTimeout.current = setTimeout(() => {
          onChange({ ...currentOdds });
          notifyTimeout.current = null;
        }, 200); // 200ms debounce - improves typing responsiveness
      }
    },
    [onChange]
  );

  useEffect(() => {
    return () => {
      if (notifyTimeout.current) clearTimeout(notifyTimeout.current);
    };
  }, []);

  // Filter state
  const [filterCategory, setFilterCategory] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Stable handlers
  const handleOddsChange = useCallback(
    (field, newValue) => {
      // normalize to string
      const value =
        newValue === null || newValue === undefined ? "" : String(newValue);
      setOdds((prev) => {
        if (prev[field] === value) return prev; // short-circuit no-op
        const next = { ...prev, [field]: value };
        oddsRef.current = next;
        scheduleNotifyParent(next);
        return next;
      });
    },
    [scheduleNotifyParent]
  );

  const handleClearAll = useCallback(() => {
    const clearedOdds = {};
    Object.keys(MARKET_CONFIGS).forEach((key) => {
      clearedOdds[key] = "";
    });
    setOdds(clearedOdds);
    oddsRef.current = clearedOdds;
    scheduleNotifyParent(clearedOdds);
  }, [scheduleNotifyParent]);

  const handleCopyToAll = useCallback(
    (value) => {
      if (!value || isNaN(parseFloat(value))) return;
      const copiedOdds = {};
      Object.keys(MARKET_CONFIGS).forEach((key) => {
        copiedOdds[key] = value;
      });
      setOdds(copiedOdds);
      oddsRef.current = copiedOdds;
      scheduleNotifyParent(copiedOdds);
    },
    [scheduleNotifyParent]
  );

  const applyPreset = useCallback(
    (presetValue) => {
      const newOdds = {};
      Object.keys(MARKET_CONFIGS).forEach((key) => {
        newOdds[key] = presetValue;
      });
      setOdds(newOdds);
      oddsRef.current = newOdds;
      scheduleNotifyParent(newOdds);
    },
    [scheduleNotifyParent]
  );

  // Memoized filtered keys and grouped markets
  const filteredMarketKeys = useMemo(() => {
    if (filterCategory === "all") {
      return Object.keys(MARKET_CONFIGS);
    }
    return Object.keys(MARKET_CONFIGS).filter(
      (key) => MARKET_CONFIGS[key].category === filterCategory
    );
  }, [filterCategory]);

  const groupedMarkets = useMemo(() => {
    const groups = {};
    filteredMarketKeys.forEach((key) => {
      const config = MARKET_CONFIGS[key];
      const groupKey = config.category;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({
        key,
        label: config.label,
        icon: config.icon,
        type: config.type,
        value: odds[key] ?? "",
      });
    });
    return groups;
  }, [filteredMarketKeys, odds]);

  const activeMarketCount = useMemo(() => {
    return Object.values(odds).filter((v) => v && parseFloat(v) > 0).length;
  }, [odds]);

  const categoryToggleButtons = useMemo(() => {
    return Object.entries(MARKET_CATEGORIES).map(([key, category]) => (
      <ToggleButton key={key} value={key} sx={{ gap: 0.5 }}>
        {category.icon} {category.label}
      </ToggleButton>
    ));
  }, []);

  // helpers for toggles
  const handleFilterCategoryChange = useCallback((e, value) => {
    setFilterCategory(value || "all");
  }, []);

  const toggleShowActiveOnly = useCallback(() => {
    setShowActiveOnly((s) => !s);
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SportsSoccer /> {title}
        </Typography>

        {/* Control Bar */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
            alignItems: "center",
          }}
        >
          <Chip
            label={`${activeMarketCount} active`}
            color={activeMarketCount > 0 ? "success" : "default"}
            variant="outlined"
          />

          <ToggleButtonGroup
            value={filterCategory}
            exclusive
            onChange={handleFilterCategoryChange}
            size="small"
          >
            <ToggleButton value="all">All Markets</ToggleButton>
            {categoryToggleButtons}
          </ToggleButtonGroup>

          <Button
            size="small"
            variant="outlined"
            onClick={toggleShowActiveOnly}
            startIcon={showActiveOnly ? <FilterList /> : null}
          >
            {showActiveOnly ? "Showing Active Only" : "Show All"}
          </Button>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          <Typography variant="body2" sx={{ mr: 1, alignSelf: "center" }}>
            Quick Actions:
          </Typography>

          {["1.50", "2.00", "3.00"].map((preset) => (
            <Button
              key={preset}
              size="small"
              variant="outlined"
              onClick={() => applyPreset(preset)}
            >
              Set All to {preset}
            </Button>
          ))}

          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleClearAll}
            startIcon={<Clear />}
          >
            Clear All
          </Button>

          <Tooltip title="Copy first non-empty odds to all">
            <Button
              size="small"
              variant="outlined"
              color="info"
              onClick={() => {
                const firstValue = Object.values(odds).find(
                  (v) => v && parseFloat(v) > 0
                );
                if (firstValue) handleCopyToAll(firstValue);
              }}
              startIcon={<CopyAll />}
            >
              Copy to All
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Markets Table */}
      {Object.entries(groupedMarkets).map(([category, markets]) => {
        const displayMarkets = showActiveOnly
          ? markets.filter((m) => m.value && parseFloat(m.value) > 0)
          : markets;

        if (displayMarkets.length === 0) return null;

        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: MARKET_CATEGORIES[category]?.color || "text.primary",
              }}
            >
              {MARKET_CATEGORIES[category]?.icon || "📊"}
              {MARKET_CATEGORIES[category]?.label || category}
              <Chip
                label={displayMarkets.length}
                size="small"
                variant="outlined"
              />
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell width="40%">Market</TableCell>
                    <TableCell width="20%">Type</TableCell>
                    <TableCell width="40%" align="right">
                      Odds
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayMarkets.map((market) => (
                    <MarketRow
                      key={market.key}
                      marketKey={market.key}
                      label={market.label}
                      icon={market.icon}
                      type={market.type}
                      value={market.value}
                      onChangeValue={(val) => handleOddsChange(market.key, val)}
                      onClearValue={() => handleOddsChange(market.key, "")}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}

      {/* Summary */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total Markets: {Object.keys(MARKET_CONFIGS).length} | Active:{" "}
          {activeMarketCount} | Empty:{" "}
          {Object.keys(MARKET_CONFIGS).length - activeMarketCount}
        </Typography>

        <Button
          size="small"
          variant="contained"
          onClick={() => {
            const formattedData = {};
            Object.entries(odds).forEach(([key, value]) => {
              if (value && parseFloat(value) > 0) {
                formattedData[key] = parseFloat(value);
              }
            });
            console.log("Submitting odds:", formattedData);
            alert(
              `Submitting ${Object.keys(formattedData).length} market odds`
            );
          }}
        >
          Save All Odds
        </Button>
      </Box>
    </Paper>
  );
};

export default OddsInputTable;