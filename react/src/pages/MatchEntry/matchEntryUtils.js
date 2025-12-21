// Helper function to get market type (for backward compatibility)
export const getMarketType = (marketName) => {
  const typeMap = {
    "1X2": "match_result",
    "Correct Score": "correct_score",
    "Asian Handicap": "asian_handicap",
    "Both Teams to Score": "both_teams_score",
    "Over/Under": "over_under",
    Halftime: "halftime",
    Corners: "corners",
    "Player Markets": "player_markets",
    "Double Chance": "double_chance",
    "Draw No Bet": "draw_no_bet",
    "Half Time/Full Time": "ht_ft",
    "Total Goals": "total_goals",
  };
  return typeMap[marketName] || "general";
};

// Normalize head-to-head data
export const normalizeHeadToHead = (headToHeadMatches) => {
  if (!headToHeadMatches.length) return null;
  return {
    home_wins: headToHeadMatches.filter((m) => m.result === "H").length,
    away_wins: headToHeadMatches.filter((m) => m.result === "A").length,
    draws: headToHeadMatches.filter((m) => m.result === "D").length,
    total_meetings: headToHeadMatches.length,
    last_meetings: headToHeadMatches,
  };
};

// Prepare markets for backend (using both handler and custom logic)
export const prepareMarketsForBackend = (
  uiMarkets,
  marketHandler,
  getMarketType
) => {
  // First try using the market handler
  const handlerMarkets = marketHandler.prepareMarketsForBackend(uiMarkets);

  // If handler doesn't handle all markets, fall back to custom logic
  const marketsData = uiMarkets.map((market) => {
    const marketData = {
      name: market.name,
      market_type: getMarketType(market.name),
      odds: market.odds || 0,
    };

    // Add outcomes based on market type
    if (market.name === "1X2") {
      marketData.outcomes = [
        { outcome: "home", odds: market.home_odds || 0 },
        { outcome: "draw", odds: market.draw_odds || 0 },
        { outcome: "away", odds: market.away_odds || 0 },
      ];
    } else if (market.outcomes && market.outcomes.length > 0) {
      marketData.outcomes = market.outcomes.map((outcome) => {
        if (market.name === "Correct Score") {
          return { outcome: `score_${outcome.score}`, odds: outcome.odds || 0 };
        } else if (market.name === "Asian Handicap") {
          return {
            outcome: `handicap_${outcome.handicap.replace(/\s+/g, "_")}`,
            odds: outcome.odds || 0,
          };
        } else if (market.name === "Both Teams to Score") {
          return {
            outcome: outcome.outcome.toLowerCase(),
            odds: outcome.odds || 0,
          };
        } else if (market.name === "Over/Under") {
          return {
            outcome: outcome.line.replace(/\s+/g, "_").toLowerCase(),
            odds: outcome.odds || 0,
          };
        } else if (market.name === "Halftime") {
          return {
            outcome: outcome.outcome.toLowerCase(),
            odds: outcome.odds || 0,
          };
        } else if (market.name === "Corners") {
          return {
            outcome: outcome.type.replace(/\s+/g, "_").toLowerCase(),
            odds: outcome.odds || 0,
          };
        } else if (market.name === "Player Markets") {
          return {
            outcome: `${outcome.type.replace(/\s+/g, "_").toLowerCase()}_${outcome.player || "player"}`,
            odds: outcome.odds || 0,
            player: outcome.player || "",
          };
        }
        return { outcome: "default", odds: outcome.odds || 0 };
      });
    }

    return marketData;
  });

  // Filter out empty markets
  const filteredMarkets = marketsData.filter((market) => {
    if (market.name === "1X2") {
      return market.outcomes.some((o) => o.odds > 0);
    } else if (market.outcomes) {
      return market.outcomes.some((o) => o.odds > 0);
    }
    return market.odds > 0;
  });

  return filteredMarkets.length > 0 ? filteredMarkets : handlerMarkets;
};
