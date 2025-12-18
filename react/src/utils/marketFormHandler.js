//src/utils/ marketFormHandler.js 
import { normalizeMarketsForBackend } from "../services/normalization/marketNormalizer";

export const createMarketFormHandler = () => {
  const defaultMarkets = [
    {
      id: "market_1",
      name: "1X2",
      market_type: "match_result",
      home_odds: 0,
      draw_odds: 0,
      away_odds: 0,
      required: true,
    },
    {
      id: "market_2",
      name: "Over/Under 2.5",
      market_type: "over_under",
      over_odds: 0,
      under_odds: 0,
      required: false,
    },
    {
      id: "market_3",
      name: "Both Teams to Score",
      market_type: "both_teams_score",
      odds: 0,
      required: false,
    },
  ];

  return {
    getDefaultMarkets: () => [...defaultMarkets],

    validateMarkets: (markets) => {
      const errors = {};
      const requiredMarkets = markets.filter((m) => m.required);

      requiredMarkets.forEach((market) => {
        if (market.name === "1X2") {
          if (!market.home_odds || market.home_odds < 1.01) {
            errors.home_odds = "Home odds must be at least 1.01";
          }
          if (!market.draw_odds || market.draw_odds < 1.01) {
            errors.draw_odds = "Draw odds must be at least 1.01";
          }
          if (!market.away_odds || market.away_odds < 1.01) {
            errors.away_odds = "Away odds must be at least 1.01";
          }
        }
      });

      return { isValid: Object.keys(errors).length === 0, errors };
    },

    prepareMarketsForBackend: (uiMarkets) => {
      return normalizeMarketsForBackend(uiMarkets);
    },

    calculateMarketSummary: (markets) => {
      const summary = {
        totalMarkets: markets.length,
        requiredMarkets: markets.filter((m) => m.required).length,
        hasValidOdds: markets.every((m) => {
          if (m.name === "1X2") {
            return (
              m.home_odds >= 1.01 && m.draw_odds >= 1.01 && m.away_odds >= 1.01
            );
          }
          return true;
        }),
      };

      return summary;
    },
  };
};
