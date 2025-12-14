// Match formatter utility with memoization
const formatterCache = new Map();

// Memoized formatter function
export const formatMatchForBackend = (match) => {
  const cacheKey = `format_${JSON.stringify(match)}`;

  if (formatterCache.has(cacheKey)) {
    return formatterCache.get(cacheKey);
  }

  const result = {
    home_team: match.home_team?.trim() || "",
    away_team: match.away_team?.trim() || "",
    league: match.league?.trim() || "",
    head_to_head_summary: match.head_to_head_summary || "",
    home_form: Array.isArray(match.home_form) ? match.home_form : [],
    away_form: Array.isArray(match.away_form) ? match.away_form : [],
    odds: match.odds || {},
    // Add default values for missing fields
    match_date: match.match_date || new Date().toISOString().split("T")[0],
    created_at: match.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Remove empty fields for cleaner payload
  Object.keys(result).forEach((key) => {
    if (
      result[key] === "" ||
      result[key] === null ||
      result[key] === undefined
    ) {
      delete result[key];
    }
  });

  formatterCache.set(cacheKey, result);
  return result;
};

export const formatMatchFromBackend = (backendMatch) => {
  const cacheKey = `parse_${JSON.stringify(backendMatch)}`;

  if (formatterCache.has(cacheKey)) {
    return formatterCache.get(cacheKey);
  }

  const result = {
    id: backendMatch.id,
    home_team: backendMatch.home_team || "",
    away_team: backendMatch.away_team || "",
    league: backendMatch.league || "",
    head_to_head_summary: backendMatch.head_to_head_summary || "",
    home_form: backendMatch.home_form || [],
    away_form: backendMatch.away_form || [],
    odds: backendMatch.odds || {},
    match_date: backendMatch.match_date,
    created_at: backendMatch.created_at,
    updated_at: backendMatch.updated_at,
  };

  formatterCache.set(cacheKey, result);
  return result;
};

// Clear formatter cache if needed
export const clearFormatterCache = () => {
  formatterCache.clear();
};
