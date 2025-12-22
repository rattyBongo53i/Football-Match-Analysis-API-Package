import React, { useCallback, useEffect, memo, useMemo } from "react";
import {
  Typography,
  Box,
  Grid,
  CardContent,
  InputAdornment,
  Chip,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  TrendingUp as OddsIcon,
  LocalFireDepartment as HotIcon,
} from "@mui/icons-material";
import { MemoizedTextField, MemoizedIconButton } from "./MemoizedComponents";
import { MarketCard } from "./styledComponents";

const MarketItem = memo(
  ({
    market,
    index,
    marketErrors,
    submitting,
    onRemoveMarket,
    onMarketChange,
  }) => {
    const is1X2Market = market.name === "1X2";

    // Define market types that need special handling
    const marketTypes = useMemo(
      () => ({
        ASIAN_HANDICAP: "asian_handicap",
        OVER_UNDER: "over_under",
        BOTH_TEAMS_TO_SCORE: "both_teams_to_score",
        HALF_TIME: "half_time",
        DOUBLE_CHANCE: "double_chance",
        CORRECT_SCORE: "correct_score",
        HALF_TIME_FULL_TIME: "half_time_full_time",
      }),
      []
    );

    // Determine market category based on name or type
    const getMarketCategory = useCallback(() => {
      const marketName = (market.name || "").toLowerCase().trim();

      console.log("Market name:", marketName); // For debugging

      if (is1X2Market) return "1X2";
      if (marketName.includes("asian") || marketName.includes("handicap"))
        return marketTypes.ASIAN_HANDICAP;
      if (
        marketName.includes("over") ||
        marketName.includes("under") ||
        marketName.includes("total")
      )
        return marketTypes.OVER_UNDER;
      if (marketName.includes("both teams") || marketName.includes("btts"))
        return marketTypes.BOTH_TEAMS_TO_SCORE;
      if (
        (marketName.includes("half time") &&
          marketName.includes("full time")) ||
        marketName.includes("ht/ft")
      )
        return marketTypes.HALF_TIME_FULL_TIME;
      if (
        marketName.includes("half time") ||
        marketName.includes("halftime") ||
        marketName.includes("ht")
      )
        return marketTypes.HALF_TIME;
      if (marketName.includes("double chance") || marketName.includes("dc"))
        return marketTypes.DOUBLE_CHANCE;
      if (marketName.includes("correct score") || marketName.includes("cs"))
        return marketTypes.CORRECT_SCORE;

      return "generic";
    }, [market.name, is1X2Market, marketTypes]);

    const marketCategory = getMarketCategory();

    console.log("Market category detected:", marketCategory); // For debugging

    const handleOddsChange = useCallback(
      (field, value, outcomeIndex = null) => {
        const updated = { ...market };

        if (outcomeIndex !== null && market.outcomes?.[outcomeIndex]) {
          const updatedOutcomes = [...market.outcomes];
          updatedOutcomes[outcomeIndex] = {
            ...updatedOutcomes[outcomeIndex],
            odds: parseFloat(value) || 0,
          };
          updated.outcomes = updatedOutcomes;
        } else if (field === "odds") {
          updated.odds = parseFloat(value) || 0;
        } else if (field.startsWith("outcome_")) {
          const outcomeField = field.replace("outcome_", "");
          if (!updated.outcomes) updated.outcomes = [];
          const existingIndex = updated.outcomes.findIndex(
            (o) => o.outcome === outcomeField
          );
          if (existingIndex >= 0) {
            updated.outcomes[existingIndex] = {
              ...updated.outcomes[existingIndex],
              odds: parseFloat(value) || 0,
            };
          } else {
            updated.outcomes.push({
              outcome: outcomeField,
              odds: parseFloat(value) || 0,
            });
          }
        } else {
          updated[field] = parseFloat(value) || 0;
        }
        onMarketChange(index, updated);
      },
      [market, index, onMarketChange]
    );

    const handleSelectChange = useCallback(
      (field, value) => {
        const updated = { ...market };
        updated[field] = value;
        onMarketChange(index, updated);
      },
      [market, index, onMarketChange]
    );

    const oddsInputProps = {
      startAdornment: (
        <InputAdornment position="start">
          <Typography sx={{ fontSize: 12, opacity: 0.5 }}>×</Typography>
        </InputAdornment>
      ),
      style: { fontWeight: "600", fontFamily: "monospace" },
    };

    // Initialize market outcomes if they don't exist
    useEffect(() => {
      if (!market.outcomes || market.outcomes.length === 0) {
        let defaultOutcomes = [];

        console.log("Initializing market:", marketCategory); // For debugging

        switch (marketCategory) {
          case marketTypes.ASIAN_HANDICAP:
            defaultOutcomes = [
              { handicap: "-0.5", outcome: "Home", odds: "" },
              { handicap: "+0.5", outcome: "Away", odds: "" },
            ];
            break;
          case marketTypes.OVER_UNDER:
            defaultOutcomes = [
              { line: "2.5", outcome: "Over", odds: "" },
              { line: "2.5", outcome: "Under", odds: "" },
              { line: "3.5", outcome: "Over", odds: "" },
              { line: "3.5", outcome: "Under", odds: "" },
            ];
            break;
          case marketTypes.BOTH_TEAMS_TO_SCORE:
            defaultOutcomes = [
              { outcome: "Yes", odds: "" },
              { outcome: "No", odds: "" },
            ];
            break;
          case marketTypes.HALF_TIME:
            defaultOutcomes = [
              { outcome: "Home", odds: "" },
              { outcome: "Draw", odds: "" },
              { outcome: "Away", odds: "" },
            ];
            console.log("Half time outcomes initialized:", defaultOutcomes); // For debugging
            break;
          case marketTypes.DOUBLE_CHANCE:
            defaultOutcomes = [
              { outcome: "Home/Draw", odds: "" },
              { outcome: "Home/Away", odds: "" },
              { outcome: "Draw/Away", odds: "" },
            ];
            break;
          case marketTypes.CORRECT_SCORE:
            defaultOutcomes = [
              { score: "1-0", outcome: "Home", odds: "" },
              { score: "2-0", outcome: "Home", odds: "" },
              { score: "2-1", outcome: "Home", odds: "" },
              { score: "0-0", outcome: "Draw", odds: "" },
              { score: "1-1", outcome: "Draw", odds: "" },
              { score: "2-2", outcome: "Draw", odds: "" },
              { score: "0-1", outcome: "Away", odds: "" },
              { score: "0-2", outcome: "Away", odds: "" },
              { score: "1-2", outcome: "Away", odds: "" },
            ];
            break;
          case marketTypes.HALF_TIME_FULL_TIME:
            defaultOutcomes = [
              { outcome: "Home/Home", odds: "" },
              { outcome: "Home/Draw", odds: "" },
              { outcome: "Home/Away", odds: "" },
              { outcome: "Draw/Home", odds: "" },
              { outcome: "Draw/Draw", odds: "" },
              { outcome: "Draw/Away", odds: "" },
              { outcome: "Away/Home", odds: "" },
              { outcome: "Away/Draw", odds: "" },
              { outcome: "Away/Away", odds: "" },
            ];
            break;
          case "1X2":
            // 1X2 markets use direct fields, not outcomes array
            return;
          default:
            // For generic markets
            return;
        }

        if (
          defaultOutcomes.length > 0 &&
          (!market.outcomes || market.outcomes.length === 0)
        ) {
          const updated = { ...market, outcomes: defaultOutcomes };
          console.log("Updating market with outcomes:", updated); // For debugging
          onMarketChange(index, updated);
        }
      }
    }, [market, marketCategory, index, onMarketChange, marketTypes]);

    // Render different input fields based on market category
    const renderMarketInputs = () => {
      console.log(
        "Rendering market inputs for:",
        marketCategory,
        "outcomes:",
        market.outcomes
      ); // For debugging

      switch (marketCategory) {
        case "1X2":
          return ["home_odds", "draw_odds", "away_odds"].map((field) => (
            <Grid item xs={4} key={field}>
              <MemoizedTextField
                fullWidth
                label={field.replace("_odds", "").toUpperCase()}
                type="number"
                size="small"
                value={market[field] || ""}
                onChange={(e) => handleOddsChange(field, e.target.value)}
                error={!!marketErrors[field]}
                InputProps={oddsInputProps}
                disabled={submitting}
              />
            </Grid>
          ));

        case marketTypes.ASIAN_HANDICAP:
          return (
            <>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Handicap</InputLabel>
                  <Select
                    value={market.handicap || ""}
                    onChange={(e) =>
                      handleSelectChange("handicap", e.target.value)
                    }
                    label="Handicap"
                    disabled={submitting}
                  >
                    <MenuItem value="-0.5">-0.5</MenuItem>
                    <MenuItem value="+0.5">+0.5</MenuItem>
                    <MenuItem value="-1.0">-1.0</MenuItem>
                    <MenuItem value="+1.0">+1.0</MenuItem>
                    <MenuItem value="-1.5">-1.5</MenuItem>
                    <MenuItem value="+1.5">+1.5</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {(market.outcomes || []).map((outcome, idx) => (
                <Grid item xs={6} md={4.5} key={idx}>
                  <MemoizedTextField
                    fullWidth
                    label={`${outcome.outcome} ${outcome.handicap || ""}`}
                    type="number"
                    size="small"
                    value={outcome.odds || ""}
                    onChange={(e) =>
                      handleOddsChange("odds", e.target.value, idx)
                    }
                    InputProps={oddsInputProps}
                    disabled={submitting}
                  />
                </Grid>
              ))}
            </>
          );

        case marketTypes.OVER_UNDER:
          // Group outcomes by line
          const outcomesByLine = {};
          (market.outcomes || []).forEach((outcome) => {
            if (!outcomesByLine[outcome.line]) {
              outcomesByLine[outcome.line] = [];
            }
            outcomesByLine[outcome.line].push(outcome);
          });

          return Object.entries(outcomesByLine).map(([line, lineOutcomes]) => (
            <React.Fragment key={line}>
              <Grid item xs={12}>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, display: "block", mb: 0.5 }}
                >
                  {line} Goals
                </Typography>
              </Grid>
              {lineOutcomes.map((outcome, idx) => (
                <Grid item xs={6} key={`${line}-${outcome.outcome}`}>
                  <MemoizedTextField
                    fullWidth
                    label={`${outcome.outcome} ${line}`}
                    type="number"
                    size="small"
                    value={outcome.odds || ""}
                    onChange={(e) => {
                      const outcomeIndex = (market.outcomes || []).findIndex(
                        (o) => o.line === line && o.outcome === outcome.outcome
                      );
                      if (outcomeIndex >= 0) {
                        handleOddsChange("odds", e.target.value, outcomeIndex);
                      }
                    }}
                    InputProps={oddsInputProps}
                    disabled={submitting}
                  />
                </Grid>
              ))}
            </React.Fragment>
          ));

        case marketTypes.HALF_TIME:
          return (market.outcomes || []).map((outcome, idx) => (
            <Grid item xs={4} key={idx}>
              <MemoizedTextField
                fullWidth
                label={`HT ${outcome.outcome}`}
                type="number"
                size="small"
                value={outcome.odds || ""}
                onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
                InputProps={oddsInputProps}
                disabled={submitting}
              />
            </Grid>
          ));

        case marketTypes.BOTH_TEAMS_TO_SCORE:
        case marketTypes.DOUBLE_CHANCE:
        case marketTypes.HALF_TIME_FULL_TIME:
        case marketTypes.CORRECT_SCORE:
        default:
          // Generic outcomes rendering for other markets
          return (market.outcomes || []).map((outcome, idx) => (
            <Grid item xs={6} sm={4} key={idx}>
              <MemoizedTextField
                fullWidth
                label={
                  outcome.score ||
                  outcome.handicap ||
                  outcome.outcome ||
                  outcome.line ||
                  outcome.type ||
                  `Outcome ${idx + 1}`
                }
                type="number"
                size="small"
                value={outcome.odds || ""}
                onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
                InputProps={oddsInputProps}
                disabled={submitting}
              />
            </Grid>
          ));
      }
    };

    return (
      <Grid item xs={12} md={is1X2Market ? 12 : 6}>
        <Fade in timeout={400 + index * 50}>
          <MarketCard
            elevation={0}
            sx={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(156, 39, 176, 0.3)",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {market.required && (
                    <HotIcon color="error" sx={{ fontSize: 16 }} />
                  )}
                  <Typography
                    variant="subtitle2"
                    fontWeight="800"
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                  >
                    {market.name}
                  </Typography>
                  {market.required && (
                    <Chip
                      label="Required"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        bgcolor: "rgba(211, 47, 47, 0.1)",
                        color: "error.main",
                      }}
                    />
                  )}
                </Box>
                {!market.required && (
                  <MemoizedIconButton
                    size="small"
                    onClick={() => onRemoveMarket(index)}
                    disabled={submitting}
                    sx={{
                      color: "rgba(255,255,255,0.3)",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </MemoizedIconButton>
                )}
              </Box>

              <Grid container spacing={1.5}>
                {renderMarketInputs()}
              </Grid>
            </CardContent>
          </MarketCard>
        </Fade>
      </Grid>
    );
  }
);

export default MarketItem;
