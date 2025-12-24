export const MARKET_TYPES = {
  MATCH_RESULT: "MATCH_RESULT",
  CORRECT_SCORE: "CORRECT_SCORE",
  ASIAN_HANDICAP: "ASIAN_HANDICAP",
  OVER_UNDER: "OVER_UNDER",
  BOTH_TEAMS_TO_SCORE: "BOTH_TEAMS_TO_SCORE",
  DOUBLE_CHANCE: "DOUBLE_CHANCE",
  HALF_TIME_FULL_TIME: "HALF_TIME_FULL_TIME",
  HALF_TIME: "HALF_TIME",
};

export const MARKET_DISPLAY_NAMES = {
  [MARKET_TYPES.MATCH_RESULT]: "Match Result (1X2)",
  [MARKET_TYPES.CORRECT_SCORE]: "Correct Score",
  [MARKET_TYPES.ASIAN_HANDICAP]: "Asian Handicap",
  [MARKET_TYPES.OVER_UNDER]: "Over/Under",
  [MARKET_TYPES.BOTH_TEAMS_TO_SCORE]: "Both Teams to Score",
  [MARKET_TYPES.DOUBLE_CHANCE]: "Double Chance",
  [MARKET_TYPES.HALF_TIME_FULL_TIME]: "Half Time/Full Time",
  [MARKET_TYPES.HALF_TIME]: "Half Time Result",
};

export const getMarketOptions = (match) => {
  if (!match?.match_markets) return [];

  return match.match_markets
    .filter((market) => market.is_active && market.market?.code)
    .map((market) => ({
      code: market.market.code,
      name: MARKET_DISPLAY_NAMES[market.market.code] || market.market.name,
      odds: market.odds,
      marketData: market.market_data,
    }));
};

export const getMarketOutcomes = (marketType, match, marketData) => {
  if (!marketType || !match) return [];

  const defaultOdds = marketData?.odds || "0.000";
  const odds = parseFloat(defaultOdds) || 1.85;

  switch (marketType) {
    case MARKET_TYPES.MATCH_RESULT:
      return [
        {
          value: "home",
          label: `Home - ${match.home_team}`,
          odds: odds * 0.95,
        },
        { value: "draw", label: "Draw", odds: odds * 1.1 },
        {
          value: "away",
          label: `Away - ${match.away_team}`,
          odds: odds * 1.05,
        },
      ];

    case MARKET_TYPES.ASIAN_HANDICAP:
      return [
        {
          value: "home_-0.5",
          label: "Home -0.5",
          odds: odds * 0.92,
          handicap: "-0.5",
        },
        {
          value: "away_+0.5",
          label: "Away +0.5",
          odds: odds * 0.93,
          handicap: "+0.5",
        },
        {
          value: "home_-1.0",
          label: "Home -1.0",
          odds: odds * 1.25,
          handicap: "-1.0",
        },
        {
          value: "away_+1.0",
          label: "Away +1.0",
          odds: odds * 1.15,
          handicap: "+1.0",
        },
      ];

    case MARKET_TYPES.OVER_UNDER:
      return [
        {
          value: "over_2.5",
          label: "Over 2.5 Goals",
          odds: odds * 0.89,
          line: "2.5",
        },
        {
          value: "under_2.5",
          label: "Under 2.5 Goals",
          odds: odds * 0.92,
          line: "2.5",
        },
        {
          value: "over_3.5",
          label: "Over 3.5 Goals",
          odds: odds * 1.35,
          line: "3.5",
        },
        {
          value: "under_3.5",
          label: "Under 3.5 Goals",
          odds: odds * 1.15,
          line: "3.5",
        },
      ];

    case MARKET_TYPES.BOTH_TEAMS_TO_SCORE:
      return [
        { value: "yes", label: "Yes", odds: odds * 0.85 },
        { value: "no", label: "No", odds: odds * 1.2 },
      ];

    case MARKET_TYPES.HALF_TIME:
      return [
        { value: "home", label: "Home", odds: odds * 1.5 },
        { value: "draw", label: "Draw", odds: odds * 2.0 },
        { value: "away", label: "Away", odds: odds * 1.8 },
      ];

    case MARKET_TYPES.DOUBLE_CHANCE:
      return [
        { value: "home_draw", label: "Home/Draw", odds: odds * 0.75 },
        { value: "home_away", label: "Home/Away", odds: odds * 0.65 },
        { value: "draw_away", label: "Draw/Away", odds: odds * 0.8 },
      ];

    case MARKET_TYPES.CORRECT_SCORE:
      return [
        { value: "1-0", label: "1-0", odds: odds * 7.5, score: "1-0" },
        { value: "2-0", label: "2-0", odds: odds * 9.0, score: "2-0" },
        { value: "2-1", label: "2-1", odds: odds * 8.5, score: "2-1" },
        { value: "0-0", label: "0-0", odds: odds * 10.0, score: "0-0" },
        { value: "1-1", label: "1-1", odds: odds * 6.5, score: "1-1" },
        { value: "2-2", label: "2-2", odds: odds * 12.0, score: "2-2" },
        { value: "0-1", label: "0-1", odds: odds * 8.0, score: "0-1" },
        { value: "0-2", label: "0-2", odds: odds * 11.0, score: "0-2" },
        { value: "1-2", label: "1-2", odds: odds * 9.5, score: "1-2" },
      ];

    case MARKET_TYPES.HALF_TIME_FULL_TIME:
      return [
        { value: "home_home", label: "Home/Home", odds: odds * 4.5 },
        { value: "home_draw", label: "Home/Draw", odds: odds * 15.0 },
        { value: "home_away", label: "Home/Away", odds: odds * 34.0 },
        { value: "draw_home", label: "Draw/Home", odds: odds * 5.5 },
        { value: "draw_draw", label: "Draw/Draw", odds: odds * 6.5 },
        { value: "draw_away", label: "Draw/Away", odds: odds * 7.5 },
        { value: "away_home", label: "Away/Home", odds: odds * 40.0 },
        { value: "away_draw", label: "Away/Draw", odds: odds * 18.0 },
        { value: "away_away", label: "Away/Away", odds: odds * 5.0 },
      ];

    default:
      return [
        { value: "home", label: "Home", odds: 1.85 },
        { value: "draw", label: "Draw", odds: 3.5 },
        { value: "away", label: "Away", odds: 4.0 },
      ];
  }
};

export const getMarketOptionsFromMatch = (matchId, availableMatches) => {
  const match = availableMatches.find((m) => m.id === matchId);
  const markets = getMarketOptions(match);
  return markets.map((m) => m.code);
};

export const getSelectionOptionsFromMarket = (
  matchId,
  marketCode,
  availableMatches
) => {
  const match = availableMatches.find((m) => m.id === matchId);
  if (!match) return [];

  const marketData = match.match_markets?.find(
    (m) => m.market?.code === marketCode
  );
  const outcomes = getMarketOutcomes(marketCode, match, marketData);
  return outcomes.map((outcome) => ({
    value: outcome.value,
    label: `${outcome.label} @ ${outcome.odds.toFixed(2)}`,
  }));
};



