// frontend/src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
import {
  formatMatchForBackend,
  formatMatchFromBackend,
} from "../utils/matchFormatter";

// Create a cache with TTL (time-to-live)
const createCache = () => {
  const cache = new Map();
  const ttl = new Map();

  return {
    get: (key) => {
      const entry = cache.get(key);
      if (!entry) return null;

      const expireTime = ttl.get(key);
      if (expireTime && Date.now() > expireTime) {
        cache.delete(key);
        ttl.delete(key);
        return null;
      }

      return entry;
    },

    set: (key, value, ttlMs = 30000) => {
      cache.set(key, value);
      if (ttlMs) {
        ttl.set(key, Date.now() + ttlMs);
      }
    },

    delete: (key) => {
      cache.delete(key);
      ttl.delete(key);
    },

    clear: () => {
      cache.clear();
      ttl.clear();
    },

    cleanup: () => {
      const now = Date.now();
      for (const [key, expireTime] of ttl.entries()) {
        if (now > expireTime) {
          cache.delete(key);
          ttl.delete(key);
        }
      }
    },
  };
};

const cache = createCache();
setInterval(() => cache.cleanup(), 60000);

// Cancel token source for request cancellation
let cancelTokenSource = axios.CancelToken.source();

// API endpoints configuration - UPDATED FOR NEW BACKEND STRUCTURE
const API_ENDPOINTS = {
  // Core resources
  MATCHES: "/matches",
  TEAMS: "/teams",
  TEAM_FORMS: "/team-forms",
  HEAD_TO_HEAD: "/head-to-head",

  // Betting & generator endpoints
  SLIPS: "/slips",
  GENERATOR: "/generator",

  // Additional endpoints
  MARKETS: "/markets",
  PREDICTIONS: "/predictions",
  HEALTH: "/health",

  // Search endpoints
  SEARCH_TEAMS: "/teams/search",
  SEARCH_MATCHES: "/matches/search",
};

// Create axios instance with optimized defaults
const createBettingAPI = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    withCredentials: true,
  });

  // Request interceptor for caching and cancellation
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp to avoid browser caching
      if (config.method === "get" && !config.params?._t) {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }

      // Generate cache key
      if (config.method === "get") {
        const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`;
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse && !config.forceRefresh) {
          return {
            ...config,
            adapter: () =>
              Promise.resolve({
                data: cachedResponse,
                status: 200,
                statusText: "OK",
                headers: {},
                config,
                request: {},
              }),
          };
        }

        config.cacheKey = cacheKey;
      }

      // Add cancel token to all requests
      config.cancelToken = cancelTokenSource.token;

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for caching and error handling
  instance.interceptors.response.use(
    (response) => {
      if (response.config.method === "get" && response.config.cacheKey) {
        cache.set(response.config.cacheKey, response.data, 30000);
      }
      return response;
    },
    (error) => {
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
        return Promise.reject({ isCanceled: true, message: error.message });
      } else if (error.code === "ECONNABORTED") {
        console.log("Request timeout:", error.config.url);
        return Promise.reject({
          isTimeout: true,
          message: "Request timeout",
          url: error.config.url,
        });
      } else if (error.response) {
        console.log("API Error:", {
          status: error.response.status,
          url: error.config.url,
          data: error.response.data,
        });

        if (error.response.status === 401) {
          console.log("Unauthorized access");
        } else if (error.response.status === 404) {
          console.log("Endpoint not found:", error.config.url);
        } else if (error.response.status >= 500) {
          console.log("Server error");
        }
      } else if (error.request) {
        console.log("No response received:", error.config.url);
      } else {
        console.log("Request setup error:", error.message);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

let bettingAPI = createBettingAPI();

// Utility to cancel all pending requests
export const cancelAllRequests = (message = "Operation canceled by user") => {
  cancelTokenSource.cancel(message);
  cancelTokenSource = axios.CancelToken.source();
  bettingAPI = createBettingAPI();
};

// Retry logic for failed requests
const retryRequest = async (requestFn, maxRetries = 2, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (
        i === maxRetries - 1 ||
        error.code === "ECONNABORTED" ||
        error.response?.status === 404 ||
        error.isCanceled
      ) {
        throw error;
      }
      console.log(`Retry ${i + 1}/${maxRetries} for request`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Batch processing for multiple matches
const processBatch = async (items, processFn, batchSize = 5) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item) =>
      processFn(item).catch((error) => ({ error, item }))
    );

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value.error) {
          errors.push({ item: batch[index], error: result.value.error });
        } else {
          results.push(result.value);
        }
      } else {
        errors.push({ item: batch[index], error: result.reason });
      }
    });

    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { results, errors };
};

// Match API methods - UPDATED
export const matchAPI = {
  // Get all matches with caching and retry
  getMatches: async (params = {}, forceRefresh = false) => {
    try {
      const response = await retryRequest(() =>
        bettingAPI.get(API_ENDPOINTS.MATCHES, {
          forceRefresh,
          params: {
            ...params,
            _t: forceRefresh ? Date.now() : undefined,
          },
        })
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  // Get single match by ID with caching
  getMatch: (id, forceRefresh = false) =>
    retryRequest(() =>
      bettingAPI
        .get(`${API_ENDPOINTS.MATCHES}/${id}`, {
          forceRefresh,
          params: { _t: forceRefresh ? Date.now() : undefined },
        })
        .then((response) => {
          if (response.data && formatMatchFromBackend) {
            return {
              ...response,
              data: formatMatchFromBackend(response.data),
            };
          }
          return response;
        })
    ),

  // Save a new match with all related data (Team, TeamForm, HeadToHead)
  saveMatch: (matchData) => {
    cache.delete(API_ENDPOINTS.MATCHES);
    cache.delete(API_ENDPOINTS.TEAMS);

    const dataToSend = formatMatchForBackend
      ? formatMatchForBackend(matchData)
      : matchData;

    return retryRequest(() =>
      bettingAPI.post(API_ENDPOINTS.MATCHES, dataToSend).then((response) => {
        if (response.data && formatMatchFromBackend) {
          return {
            ...response,
            data: formatMatchFromBackend(response.data),
          };
        }
        return response;
      })
    );
  },

  // Update existing match with cache invalidation
  updateMatch: (id, matchData) => {
    cache.delete(`${API_ENDPOINTS.MATCHES}/${id}`);
    cache.delete(API_ENDPOINTS.MATCHES);

    return retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.MATCHES}/${id}`, matchData)
    );
  },

  // Delete match with cache invalidation
  deleteMatch: (id) => {
    cache.delete(`${API_ENDPOINTS.MATCHES}/${id}`);
    cache.delete(API_ENDPOINTS.MATCHES);

    return retryRequest(() =>
      bettingAPI.delete(`${API_ENDPOINTS.MATCHES}/${id}`)
    );
  },

  // Get matches ready for Python ML processing
  getMatchesForML: () =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.MATCHES}/for-ml`)),

  // Update match prediction results from Python
  updatePrediction: (id, predictionData) =>
    retryRequest(() =>
      bettingAPI.post(
        `${API_ENDPOINTS.MATCHES}/${id}/prediction`,
        predictionData
      )
    ),

  // Search matches
  searchMatches: (query) =>
    retryRequest(() =>
      bettingAPI.get(API_ENDPOINTS.SEARCH_MATCHES, { params: { q: query } })
    ),

  // Get match statistics
  getMatchStats: (id) =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.MATCHES}/${id}/stats`)),

  // Batch save matches
  saveMatchesBatch: (matches) => processBatch(matches, matchAPI.saveMatch, 3),

  // Utility methods
  cancelAllRequests,
  clearCache: () => cache.clear(),
  prefetchMatches: () => {
    if (!cache.get(API_ENDPOINTS.MATCHES)) {
      matchAPI.getMatches().catch(() => {});
    }
  },
};

// Team API methods - NEW
export const teamAPI = {
  // Get all teams with filters
  getTeams: (params = {}) =>
    retryRequest(() => bettingAPI.get(API_ENDPOINTS.TEAMS, { params })),

  // Get single team by code
  getTeam: (code) =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.TEAMS}/${code}`)),

  // Create new team
  createTeam: (teamData) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.TEAMS, teamData)),

  // Update team
  updateTeam: (code, teamData) =>
    retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.TEAMS}/${code}`, teamData)
    ),

  // Get team statistics
  getTeamStats: (code) =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.TEAMS}/${code}/stats`)),

  // Search teams by name or code
  searchTeams: (query) =>
    retryRequest(() =>
      bettingAPI.get(API_ENDPOINTS.SEARCH_TEAMS, { params: { q: query } })
    ),

  // Get teams with best form
  getBestFormTeams: (limit = 10) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.TEAMS}/best-form`, { params: { limit } })
    ),

  // Update team statistics after match
  updateTeamMatchStats: (code, matchResult) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.TEAMS}/${code}/update-stats`, {
        match_result: matchResult,
      })
    ),

  // Bulk import teams
  bulkImportTeams: (teams) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.TEAMS}/bulk-import`, { teams })
    ),
};

// Team Form API methods - NEW
export const teamFormAPI = {
  // Get all team forms
  getTeamForms: (params = {}) =>
    retryRequest(() => bettingAPI.get(API_ENDPOINTS.TEAM_FORMS, { params })),

  // Get team form for specific match and team
  getTeamForm: (matchId, teamId, venue) =>
    retryRequest(() =>
      bettingAPI.get(API_ENDPOINTS.TEAM_FORMS, {
        params: { match_id: matchId, team_id: teamId, venue },
      })
    ),

  // Create team form
  createTeamForm: (formData) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.TEAM_FORMS, formData)),

  // Update team form
  updateTeamForm: (id, formData) =>
    retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.TEAM_FORMS}/${id}`, formData)
    ),

  // Calculate form statistics
  calculateFormStats: (formData) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.TEAM_FORMS}/calculate`, formData)
    ),
};

// Head-to-Head API methods - NEW
export const headToHeadAPI = {
  // Get head-to-head data
  getHeadToHead: (matchId) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.HEAD_TO_HEAD}/${matchId}`)
    ),

  // Create head-to-head data
  createHeadToHead: (data) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.HEAD_TO_HEAD, data)),

  // Update head-to-head data
  updateHeadToHead: (matchId, data) =>
    retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.HEAD_TO_HEAD}/${matchId}`, data)
    ),

  // Calculate head-to-head statistics
  calculateStats: (homeTeamId, awayTeamId) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.HEAD_TO_HEAD}/calculate`, {
        params: { home_team: homeTeamId, away_team: awayTeamId },
      })
    ),
};

// Slip API methods
export const slipAPI = {
  getSlips: (params = {}) =>
    retryRequest(() => bettingAPI.get(API_ENDPOINTS.SLIPS, { params })),

  getSlip: (id) =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.SLIPS}/${id}`)),

  createSlip: (slipData) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.SLIPS, slipData)),

  createMasterSlip: (slipData) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.SLIPS}/master`, slipData)
    ),

  updateSlip: (id, slipData) =>
    retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.SLIPS}/${id}`, slipData)
    ),

  deleteSlip: (id) =>
    retryRequest(() => bettingAPI.delete(`${API_ENDPOINTS.SLIPS}/${id}`)),

  addMatchToSlip: (slipId, matchData) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.SLIPS}/${slipId}/matches`, matchData)
    ),
};

// Generator API methods
export const generatorAPI = {
  generateSlips: (data) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.GENERATOR, data)),

  getJobStatus: (jobId) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.GENERATOR}/status/${jobId}`)
    ),

  listJobs: (params = {}) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.GENERATOR}/jobs`, { params })
    ),

  cancelJob: (jobId) =>
    retryRequest(() =>
      bettingAPI.post(`${API_ENDPOINTS.GENERATOR}/${jobId}/cancel`)
    ),
};

// Market API methods
export const marketAPI = {
  getMarkets: (params = {}) =>
    retryRequest(() => bettingAPI.get(API_ENDPOINTS.MARKETS, { params })),

  getMarket: (id) =>
    retryRequest(() => bettingAPI.get(`${API_ENDPOINTS.MARKETS}/${id}`)),

  createMarket: (marketData) =>
    retryRequest(() => bettingAPI.post(API_ENDPOINTS.MARKETS, marketData)),

  updateMarket: (id, marketData) =>
    retryRequest(() =>
      bettingAPI.put(`${API_ENDPOINTS.MARKETS}/${id}`, marketData)
    ),

  deleteMarket: (id) =>
    retryRequest(() => bettingAPI.delete(`${API_ENDPOINTS.MARKETS}/${id}`)),

  getMarketOutcomes: (marketId) =>
    retryRequest(() =>
      bettingAPI.get(`${API_ENDPOINTS.MARKETS}/${marketId}/outcomes`)
    ),
};

// Health check and connection testing
export const checkHealth = async () => {
  try {
    const response = await bettingAPI.get(API_ENDPOINTS.HEALTH, {
      timeout: 3000,
    });
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

export const testAPI = async () => {
  try {
    const response = await bettingAPI.get("/");
    console.log("API Test Response:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("API Test Failed:", error);
    return { success: false, error: error.message };
  }
};

export const checkEndpoints = async () => {
  const endpoints = [
    { name: "Health", url: API_ENDPOINTS.HEALTH },
    { name: "Matches", url: API_ENDPOINTS.MATCHES },
    { name: "Teams", url: API_ENDPOINTS.TEAMS },
    { name: "Team Forms", url: API_ENDPOINTS.TEAM_FORMS },
    { name: "Head-to-Head", url: API_ENDPOINTS.HEAD_TO_HEAD },
    { name: "Slips", url: API_ENDPOINTS.SLIPS },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await bettingAPI.get(endpoint.url, { timeout: 5000 });
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: "OK",
        statusCode: response.status,
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: "ERROR",
        error: error.message,
        statusCode: error.response?.status,
      });
    }
  }

  return results;
};

// Utility methods
export const utils = {
  cancelAllRequests,
  clearCache: () => cache.clear(),
  refreshAll: () => {
    cache.clear();
    cancelAllRequests();
  },
};

// Main API object for organized exports
export const api = {
  matches: matchAPI,
  teams: teamAPI,
  teamForms: teamFormAPI,
  headToHead: headToHeadAPI,
  slips: slipAPI,
  generator: generatorAPI,
  markets: marketAPI,
  testAPI,
  checkHealth,
  checkEndpoints,
  utils,
};

// For backward compatibility - default export is matchAPI
export default matchAPI;

// Export the bettingAPI instance if needed
export { bettingAPI };
