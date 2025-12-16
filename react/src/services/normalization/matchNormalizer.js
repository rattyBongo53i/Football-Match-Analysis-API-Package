import {
  normalizeMarketsForBackend,
  normalizeMarketsForUI,
} from "./marketNormalizer";

export const normalizeMatchForBackend = (matchData) => {
  const normalized = {
    ...matchData,
    // Remove UI-only fields
    localId: undefined,
    saved: undefined,
    isEditing: undefined,
    uiFlags: undefined,

    // Ensure numeric values
    home_score: Number(matchData.home_score) || null,
    away_score: Number(matchData.away_score) || null,

    // Normalize markets if present
    markets: matchData.markets
      ? normalizeMarketsForBackend(matchData.markets)
      : [],
  };

  // Remove undefined fields
  return Object.fromEntries(
    Object.entries(normalized).filter(([_, v]) => v !== undefined)
  );
};

export const normalizeMatchForUI = (backendData) => {
  return {
    ...backendData,
    localId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    saved: true,
    isEditing: false,
    markets: backendData.markets
      ? normalizeMarketsForUI(backendData.markets)
      : [],
  };
};
