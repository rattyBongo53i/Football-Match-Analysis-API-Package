/**
 * CONSTANTS - Analysis Studio Engine
 * Conformed to High-Fidelity UI/UX Refactor
 */

export const INITIAL_FORM_DATA = {
  home_team: "",
  away_team: "",
  league: "",
  match_date: new Date().toISOString().split("T")[0],
  match_time: "15:00",
  venue: "Home", // Defaulted for UX efficiency
  referee: "",
  weather: "Clear",
  status: "scheduled",
  home_score: null,
  away_score: null,
  notes: "",
};

// Expanded for more precise Python simulation modeling
export const WEATHER_OPTIONS = [
  "Clear",
  "Partly Cloudy",
  "Overcast",
  "Light Rain",
  "Heavy Rain",
  "Snow",
  "Windy",
  "Extreme Heat",
];

export const leagueOptions = [
  "Premier League",
  "Championship",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Eredivisie",
  "Primeira Liga",
  "Champions League",
  "Europa League",
  "Conference League",
  "FA Cup",
  "EFL Cup",
  "Copa del Rey",
  "International Friendly",
  "World Cup Qualifiers",
];

export const venueOptions = ["Home", "Away", "Neutral"];

export const EMPTY_H2H_MATCH = {
  date: "",
  home_team: "",
  away_team: "",
  score: "",
  result: "", // Normalized to 'H', 'D', 'A' during input
};

/**
 * Step Configuration for MatchEntryForm
 * Updated to support rich UI metadata
 */
export const steps = [
  "Match Details",
  "Team Forms",
  "Head-to-Head",
  "Markets",
  "Review",
];

// Helper descriptions for the UI
export const STEP_DESCRIPTIONS = [
  "Core matchup info and conditions",
  "Recent performance history",
  "Historical rivalry data",
  "Entry of market odds",
  "Final engine data verification",
];

/**
 * Market Definitions
 * Used for dynamic rendering in MarketItem.jsx
 */
export const MARKET_DEFINITIONS = {
  ONE_X_TWO: "1X2",
  CORRECT_SCORE: "Correct Score",
  ASIAN_HANDICAP: "Asian Handicap",
  BTTS: "Both Teams to Score",
  OVER_UNDER: "Over/Under",
  HALFTIME: "Halftime",
  CORNERS: "Corners",
  PLAYERS: "Player Markets",
  DOUBLE_CHANCE: "Double Chance",
  DRAW_NO_BET: "Draw No Bet",
  HT_FT: "Half Time/Full Time",
  TOTAL_GOALS: "Total Goals",
};
