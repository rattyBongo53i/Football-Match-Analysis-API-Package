// src/pages/MasterSlipAnalysis/utils/analyticsCalculator.js
export const calculateAnalytics = (slip) => {
  if (!slip) return null;

  const matches = slip.matches || [];
  const stake = slip.stake || 0;
  const totalOdds = slip.total_odds || 1;

  const possibleReturn = slip.estimated_payout || stake * totalOdds;
  const potentialProfit = possibleReturn - stake;
  const roi = stake > 0 ? (potentialProfit / stake) * 100 : 0;

  // Calculate average odds and confidence
  const averageOdds = matches.length > 0
    ? matches.reduce((sum, match) => sum + (parseFloat(match.odds) || 1), 0) / matches.length
    : 1;

  // Calculate risk metrics
  const avgOdds = averageOdds;
  const oddsVariance = matches.length > 1
    ? matches.reduce((sum, match) => {
        const diff = (match.odds || 1) - avgOdds;
        return sum + diff * diff;
      }, 0) / matches.length
    : 0;

  const marketDistribution = {};
  const leagueDistribution = {};

  matches.forEach((match) => {
    const market = match.market || "Unknown";
    const league = match.league || "Unknown";
    marketDistribution[market] = (marketDistribution[market] || 0) + 1;
    leagueDistribution[league] = (leagueDistribution[league] || 0) + 1;
  });

  return {
    stake,
    totalOdds,
    possibleReturn,
    potentialProfit,
    roi,
    matchesCount: slip.matches_count || matches.length,
    marketDistribution,
    leagueDistribution,
    averageOdds,
    oddsVariance: Math.sqrt(oddsVariance).toFixed(2),
    expectedValue: potentialProfit * 0.65,
    status: slip.status,
    currency: slip.currency || "USD",
    createdAt: slip.created_at,
  };
};