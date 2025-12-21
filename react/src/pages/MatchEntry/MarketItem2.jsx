import React, { useState,  useEffect, useCallback, useMemo, memo } from 'react';


// Separate MarketItem component to fix hook issue
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
    const isCorrectScore = market.name === "Correct Score";
    const isAsianHandicap = market.name === "Asian Handicap";
    const isBothTeamsScore = market.name === "Both Teams to Score";
    const isOverUnder = market.name === "Over/Under";
    const isHalftime = market.name === "Halftime";
    const isCorners = market.name === "Corners";
    const isPlayers = market.name === "Player Markets";

    const handleOddsChange = useCallback(
      (field, value, outcomeIndex = null) => {
        const updated = { ...market };

        if (
          outcomeIndex !== null &&
          market.outcomes &&
          market.outcomes[outcomeIndex]
        ) {
          // Update specific outcome odds
          const updatedOutcomes = [...market.outcomes];
          updatedOutcomes[outcomeIndex] = {
            ...updatedOutcomes[outcomeIndex],
            odds: parseFloat(value) || 0,
          };
          updated.outcomes = updatedOutcomes;
        } else if (field === "odds") {
          updated.odds = parseFloat(value) || 0;
        } else if (field.startsWith("outcome_")) {
          // Handle outcomes for markets like Both Teams to Score
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

    // Get default outcomes based on market type
    const getDefaultOutcomes = () => {
      switch (market.name) {
        case "Correct Score":
          return [
            { score: "1-0", odds: "" },
            { score: "0-1", odds: "" },
            { score: "1-1", odds: "" },
            { score: "2-1", odds: "" },
            { score: "1-2", odds: "" },
            { score: "0-0", odds: "" },
            { score: "2-2", odds: "" },
            { score: "2-3", odds: "" },
            { score: "3-2", odds: "" },
            { score: "3-1", odds: "" },
            { score: "1-3", odds: "" },
            { score: "Any Other", odds: "" },
          ];
        case "Asian Handicap":
          return [
            { handicap: "Home +1", odds: "" },
            { handicap: "Home -1", odds: "" },
            { handicap: "Away +1", odds: "" },
            { handicap: "Away -1", odds: "" },
            { handicap: "Home +2", odds: "" },
            { handicap: "Home -2", odds: "" },
            { handicap: "Away +2", odds: "" },
            { handicap: "Away -2", odds: "" },
          ];
        case "Both Teams to Score":
          return [
            { outcome: "Yes", odds: "" },
            { outcome: "No", odds: "" },
          ];
        case "Over/Under":
          return [
            { line: "Over 2.5", odds: "" },
            { line: "Under 2.5", odds: "" },
            { line: "Over 3.5", odds: "" },
            { line: "Under 3.5", odds: "" },
          ];
        case "Halftime":
          return [
            { outcome: "Home", odds: "" },
            { outcome: "Draw", odds: "" },
            { outcome: "Away", odds: "" },
          ];
        case "Corners":
          return [
            { type: "Home Over 7.5", odds: "" },
            { type: "Home Under 7.5", odds: "" },
            { type: "Away Over 7.5", odds: "" },
            { type: "Away Under 7.5", odds: "" },
            { type: "Total Over 10.5", odds: "" },
            { type: "Total Under 10.5", odds: "" },
          ];
        case "Player Markets":
          return [
            { type: "Anytime Goalscorer", player: "", odds: "" },
            { type: "First Goalscorer", player: "", odds: "" },
            { type: "Assists Over 0.5", player: "", odds: "" },
            { type: "Cards Over 1.5", player: "", odds: "" },
          ];
        default:
          return [];
      }
    };

    // Initialize outcomes if not present
    useEffect(() => {
      if (
        (isCorrectScore ||
          isAsianHandicap ||
          isBothTeamsScore ||
          isOverUnder ||
          isHalftime ||
          isCorners ||
          isPlayers) &&
        (!market.outcomes || market.outcomes.length === 0)
      ) {
        const defaultOutcomes = getDefaultOutcomes();
        onMarketChange(index, { ...market, outcomes: defaultOutcomes });
      }
    }, [market.name, index, onMarketChange]);

    // Render correct score inputs
    const renderCorrectScore = () => (
      <Grid container spacing={2}>
        {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
          <Grid item xs={6} sm={4} key={idx}>
            <MemoizedTextField
              fullWidth
              label={`${outcome.score}`}
              type="number"
              step="0.01"
              min="1.01"
              value={outcome.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
              disabled={submitting}
            />
          </Grid>
        ))}
      </Grid>
    );

    // Render asian handicap inputs
    const renderAsianHandicap = () => (
      <Grid container spacing={2}>
        {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <MemoizedTextField
              fullWidth
              label={`${outcome.handicap}`}
              type="number"
              step="0.01"
              min="1.01"
              value={outcome.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
              disabled={submitting}
            />
          </Grid>
        ))}
      </Grid>
    );

    // Render both teams to score inputs
    const renderBothTeamsScore = () => (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <MemoizedTextField
            fullWidth
            label="Yes"
            type="number"
            step="0.01"
            min="1.01"
            value={
              market.outcomes?.find((o) => o.outcome === "Yes")?.odds || ""
            }
            onChange={(e) => handleOddsChange("outcome_Yes", e.target.value)}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={6}>
          <MemoizedTextField
            fullWidth
            label="No"
            type="number"
            step="0.01"
            min="1.01"
            value={market.outcomes?.find((o) => o.outcome === "No")?.odds || ""}
            onChange={(e) => handleOddsChange("outcome_No", e.target.value)}
            disabled={submitting}
          />
        </Grid>
      </Grid>
    );

    // Render over/under inputs
    const renderOverUnder = () => (
      <Grid container spacing={2}>
        {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <MemoizedTextField
              fullWidth
              label={`${outcome.line}`}
              type="number"
              step="0.01"
              min="1.01"
              value={outcome.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
              disabled={submitting}
            />
          </Grid>
        ))}
      </Grid>
    );

    // Render halftime inputs
    const renderHalftime = () => (
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <MemoizedTextField
            fullWidth
            label="Home"
            type="number"
            step="0.01"
            min="1.01"
            value={
              market.outcomes?.find((o) => o.outcome === "Home")?.odds || ""
            }
            onChange={(e) => handleOddsChange("outcome_Home", e.target.value)}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={4}>
          <MemoizedTextField
            fullWidth
            label="Draw"
            type="number"
            step="0.01"
            min="1.01"
            value={
              market.outcomes?.find((o) => o.outcome === "Draw")?.odds || ""
            }
            onChange={(e) => handleOddsChange("outcome_Draw", e.target.value)}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={4}>
          <MemoizedTextField
            fullWidth
            label="Away"
            type="number"
            step="0.01"
            min="1.01"
            value={
              market.outcomes?.find((o) => o.outcome === "Away")?.odds || ""
            }
            onChange={(e) => handleOddsChange("outcome_Away", e.target.value)}
            disabled={submitting}
          />
        </Grid>
      </Grid>
    );

    // Render corners inputs
    const renderCorners = () => (
      <Grid container spacing={2}>
        {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
          <Grid item xs={6} sm={4} key={idx}>
            <MemoizedTextField
              fullWidth
              label={`${outcome.type}`}
              type="number"
              step="0.01"
              min="1.01"
              value={outcome.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value, idx)}
              disabled={submitting}
            />
          </Grid>
        ))}
      </Grid>
    );

    // Render player markets inputs
    const renderPlayerMarkets = () => (
      <Grid container spacing={2}>
        {(market.outcomes || getDefaultOutcomes()).map((outcome, idx) => (
          <Grid item xs={12} key={idx}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={5}>
                <MemoizedTextField
                  fullWidth
                  label="Type"
                  value={outcome.type}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <MemoizedTextField
                  fullWidth
                  label="Player"
                  value={outcome.player || ""}
                  onChange={(e) => {
                    const updated = { ...market };
                    if (!updated.outcomes) updated.outcomes = [];
                    const updatedOutcomes = [...updated.outcomes];
                    updatedOutcomes[idx] = {
                      ...updatedOutcomes[idx],
                      player: e.target.value,
                    };
                    updated.outcomes = updatedOutcomes;
                    onMarketChange(index, updated);
                  }}
                  disabled={submitting}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <MemoizedTextField
                  fullWidth
                  label="Odds"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={outcome.odds || ""}
                  onChange={(e) =>
                    handleOddsChange("odds", e.target.value, idx)
                  }
                  disabled={submitting}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );

    return (
      <Grid item xs={12}>
        <MemoizedCard variant="outlined">
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {market.name} {market.required && "*"}
              </Typography>
              {!market.required && (
                <MemoizedIconButton
                  size="small"
                  onClick={() => onRemoveMarket(index)}
                  disabled={submitting}
                >
                  <DeleteIcon />
                </MemoizedIconButton>
              )}
            </Box>

            {/* Render appropriate market type */}
            {is1X2Market ? (
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Home"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={market.home_odds || ""}
                    onChange={(e) =>
                      handleOddsChange("home_odds", e.target.value)
                    }
                    error={!!marketErrors.home_odds}
                    helperText={marketErrors.home_odds}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Draw"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={market.draw_odds || ""}
                    onChange={(e) =>
                      handleOddsChange("draw_odds", e.target.value)
                    }
                    error={!!marketErrors.draw_odds}
                    helperText={marketErrors.draw_odds}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <MemoizedTextField
                    fullWidth
                    label="Away"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={market.away_odds || ""}
                    onChange={(e) =>
                      handleOddsChange("away_odds", e.target.value)
                    }
                    error={!!marketErrors.away_odds}
                    helperText={marketErrors.away_odds}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            ) : isCorrectScore ? (
              renderCorrectScore()
            ) : isAsianHandicap ? (
              renderAsianHandicap()
            ) : isBothTeamsScore ? (
              renderBothTeamsScore()
            ) : isOverUnder ? (
              renderOverUnder()
            ) : isHalftime ? (
              renderHalftime()
            ) : isCorners ? (
              renderCorners()
            ) : isPlayers ? (
              renderPlayerMarkets()
            ) : (
              <MemoizedTextField
                fullWidth
                label="Odds"
                type="number"
                step="0.01"
                min="1.01"
                value={market.odds || ""}
                onChange={(e) => handleOddsChange("odds", e.target.value)}
                disabled={submitting}
              />
            )}
          </CardContent>
        </MemoizedCard>
      </Grid>
    );
  }
);

MarketItem.displayName = "MarketItem";
