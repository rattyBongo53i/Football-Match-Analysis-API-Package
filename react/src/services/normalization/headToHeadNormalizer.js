/**
 * Normalize head-to-head data for backend storage
 * Ensures consistent structure and safe defaults
 */
export const normalizeHeadToHeadForBackend = (rawHeadToHead) => {
  if (!rawHeadToHead || typeof rawHeadToHead !== "object") {
    return {
      home_wins: 0,
      away_wins: 0,
      draws: 0,
      total_meetings: 0,
    };
  }

  const homeWins = Number(rawHeadToHead.home_wins) || 0;
  const awayWins = Number(rawHeadToHead.away_wins) || 0;
  const draws = Number(rawHeadToHead.draws) || 0;

  return {
    home_wins: homeWins,
    away_wins: awayWins,
    draws,
    total_meetings: homeWins + awayWins + draws,
  };
};
