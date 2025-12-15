export const normalizeMarketsForBackend = (marketsData) => {
  if (!marketsData || !Array.isArray(marketsData)) return [];
  
  return marketsData.map(market => ({
    // Map UI market names to backend expected names
    name: mapMarketName(market.name),
    odds: normalizeOdds(market.odds),
    market_type: market.market_type || 'standard',
    outcomes: normalizeMarketOutcomes(market)
  })).filter(market => market.odds !== null);
};

export const normalizeMarketOutcomes = (market) => {
  // For 1X2 markets
  if (market.name === '1X2' || market.name === 'Match Result') {
    return [
      { outcome: '1', odds: parseFloat(market.home_odds) || 0 },
      { outcome: 'X', odds: parseFloat(market.draw_odds) || 0 },
      { outcome: '2', odds: parseFloat(market.away_odds) || 0 }
    ];
  }
  
  // For Over/Under markets
  if (market.name.includes('Over') || market.name.includes('Under')) {
    const threshold = extractThreshold(market.name);
    return [
      { 
        outcome: market.name.includes('Over') ? `Over ${threshold}` : `Under ${threshold}`, 
        odds: parseFloat(market.odds) || 0 
      }
    ];
  }
  
  // Default single outcome
  return [{ outcome: 'win', odds: parseFloat(market.odds) || 0 }];
};

const mapMarketName = (uiName) => {
  const marketMap = {
    '1X2': 'match_result',
    'Match Result': 'match_result',
    'Over/Under 2.5': 'over_under_2_5',
    'Both Teams to Score': 'both_teams_score',
    'Double Chance': 'double_chance',
    'Correct Score': 'correct_score'
  };
  
  return marketMap[uiName] || uiName.toLowerCase().replace(/\s+/g, '_');
};

const normalizeOdds = (odds) => {
  if (typeof odds === 'object') {
    return Object.entries(odds).reduce((acc, [key, value]) => {
      acc[key] = parseFloat(value) || 0;
      return acc;
    }, {});
  }
  
  return parseFloat(odds) || 0;
};

const extractThreshold = (marketName) => {
  const match = marketName.match(/(\d+\.?\d*)/);
  return match ? match[1] : '2.5';
};

export const normalizeMarketsForUI = (backendMarkets) => {
  return backendMarkets.map(market => {
    const uiMarket = {
      id: market.id,
      name: mapBackendMarketNameToUI(market.name),
      market_type: market.market_type,
      outcomes: market.outcomes
    };
    
    // Format for UI display
    if (market.name === 'match_result' && market.outcomes) {
      uiMarket.home_odds = market.outcomes.find(o => o.outcome === '1')?.odds || 0;
      uiMarket.draw_odds = market.outcomes.find(o => o.outcome === 'X')?.odds || 0;
      uiMarket.away_odds = market.outcomes.find(o => o.outcome === '2')?.odds || 0;
    } else if (market.odds) {
      uiMarket.odds = market.odds;
    }
    
    return uiMarket;
  });
};

const mapBackendMarketNameToUI = (backendName) => {
  const reverseMap = {
    'match_result': '1X2',
    'over_under_2_5': 'Over/Under 2.5',
    'both_teams_score': 'Both Teams to Score',
    'double_chance': 'Double Chance',
    'correct_score': 'Correct Score'
  };
  
  return reverseMap[backendName] || backendName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};