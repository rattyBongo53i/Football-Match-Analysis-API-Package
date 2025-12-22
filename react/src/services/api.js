// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create a modern cache implementation with TTL
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const expireTime = this.ttl.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.delete(key);
      return null;
    }

    return entry;
  }

  set(key, value, ttlMs = 30000) {
    this.cache.set(key, value);
    if (ttlMs > 0) {
      this.ttl.set(key, Date.now() + ttlMs);
    }
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expireTime] of this.ttl.entries()) {
      if (now > expireTime) {
        this.delete(key);
      }
    }
  }
}

// Cache singleton with automatic cleanup
const apiCache = new ApiCache();
setInterval(() => apiCache.cleanup(), 60000);

// Request cancellation management
const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: (message) => source.cancel(message),
  };
};

// API endpoints - simplified and optimized
const ENDPOINTS = {
  MATCHES: '/matches',
  TEAMS: '/teams',
  SLIPS: '/slips',
  GENERATOR: '/generator',
  HEALTH: '/health',
};

// Create optimized axios instance
const createApiClient = (cancelToken) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Reduced from 15s to 10s
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
    cancelToken,
  });

  // Request interceptor
  client.interceptors.request.use((config) => {
    // Skip caching for non-GET requests
    if (config.method !== 'get') {
      return config;
    }

    // Generate cache key
    const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
    const cached = apiCache.get(cacheKey);

    if (cached && !config.forceRefresh) {
      // Return cached response
      config.adapter = () => Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config,
        request: {},
      });
    }

    // Store cache key for response interceptor
    config.meta = { ...config.meta, cacheKey };
    
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Cache GET responses
      if (response.config.method === 'get' && response.config.meta?.cacheKey) {
        apiCache.set(response.config.meta.cacheKey, response.data);
      }
      return response;
    },
    (error) => {
      if (axios.isCancel(error)) {
        return Promise.reject({ isCancelled: true, message: 'Request cancelled' });
      }

      const errorData = {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      };

      console.error('API Error:', errorData);

      if (error.response?.status === 401) {
        // Handle unauthorized - could trigger logout
        console.warn('Unauthorized access');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Retry logic with exponential backoff
const withRetry = async (fn, maxRetries = 2) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on certain errors
      if (error.isCancelled || error.response?.status === 404) {
        throw error;
      }

      // Last attempt
      if (i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Batch processing utility
const processInBatches = async (items, processor, batchSize = 5) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(item => 
      processor(item).catch(error => ({ error, item }))
    );

    const batchResults = await Promise.allSettled(promises);

    batchResults.forEach((result, index) => {
      const item = batch[index];
      
      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value.error) {
          errors.push({ item, error: value.error });
        } else {
          results.push(value);
        }
      } else {
        errors.push({ item, error: result.reason });
      }
    });

    // Small delay between batches to prevent overwhelming the server
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return { results, errors };
};

export const betslipAPI = {
  createSlip: (data) =>
    withRetry(() =>
      createApiClient(createCancelToken().token).post(
        `${ENDPOINTS.SLIPS}/create`,
        data
      )
    ),

  getActiveSlips: () =>
    withRetry(() =>
      createApiClient(createCancelToken().token).get(
        `${ENDPOINTS.SLIPS}/active-master-slips`
      )
    ),

  addMatchToSlip: (slipId, matchData) =>
    withRetry(() =>
      createApiClient(createCancelToken().token).post(
        `${ENDPOINTS.SLIPS}/${slipId}/add-match`,
        matchData
      )
    ),

  removeMatchFromSlip: (slipId, matchId) =>
    withRetry(() =>
      createApiClient(createCancelToken().token).delete(
        `${ENDPOINTS.SLIPS}/${slipId}/remove-match/${matchId}`
      )
    ),
};
// Core API methods - simplified and focused
export const matchAPI = {
  getMatches: (params = {}, forceRefresh = false) => 
    withRetry(() => createApiClient(createCancelToken().token).get(ENDPOINTS.MATCHES, {
      params: forceRefresh ? { ...params, _t: Date.now() } : params,
      forceRefresh,
    })),

  getMatch: (id, forceRefresh = false) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.MATCHES}/${id}`, {
      params: forceRefresh ? { _t: Date.now() } : undefined,
      forceRefresh,
    })),

  saveMatch: (matchData) => {
    // Invalidate relevant cache entries
    apiCache.delete(ENDPOINTS.MATCHES);
    return withRetry(() => createApiClient(createCancelToken().token).post(ENDPOINTS.MATCHES, matchData));
  },

  updateMatch: (id, matchData) => {
    apiCache.delete(ENDPOINTS.MATCHES);
    apiCache.delete(`${ENDPOINTS.MATCHES}/${id}`);
    return withRetry(() => createApiClient(createCancelToken().token).put(`${ENDPOINTS.MATCHES}/${id}`, matchData));
  },

  deleteMatch: (id) => {
    apiCache.delete(ENDPOINTS.MATCHES);
    apiCache.delete(`${ENDPOINTS.MATCHES}/${id}`);
    return withRetry(() => createApiClient(createCancelToken().token).delete(`${ENDPOINTS.MATCHES}/${id}`));
  },

  saveMatchesBatch: (matches) => processInBatches(matches, matchAPI.saveMatch, 3),
};

export const teamAPI = {
  getTeams: (params = {}) => 
    withRetry(() => createApiClient(createCancelToken().token).get(ENDPOINTS.TEAMS, { params })),

  getTeam: (code) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.TEAMS}/${code}`)),

  searchTeams: (query) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.TEAMS}/search`, { 
      params: { q: query } 
    })),
};

export const slipAPI = {
  getSlips: (params = {}) => 
    withRetry(() => createApiClient(createCancelToken().token).get(ENDPOINTS.SLIPS, { params })),

  getSlip: (id) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.SLIPS}/${id}`)),

  createSlip: (slipData) => 
    withRetry(() => createApiClient(createCancelToken().token).post(`${ENDPOINTS.SLIPS}/create`, slipData)),

  createMasterSlip: (slipData) => 
    withRetry(() => createApiClient(createCancelToken().token).post(`${ENDPOINTS.SLIPS}/master`, slipData)),

  deleteSlip: (id) => {
    apiCache.delete(ENDPOINTS.SLIPS);
    apiCache.delete(`${ENDPOINTS.SLIPS}/${id}`);
    return withRetry(() => createApiClient(createCancelToken().token).delete(`${ENDPOINTS.SLIPS}/${id}`));
  },
  
  getSlipStatus: (id) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.SLIPS}/${id}/status`)),

  getSlipResults: (id) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.SLIPS}/${id}/results`)),
  //get matches from get/matches
  getSlipMatches: (slipId) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.SLIPS}/${slipId}/matches`)),
  //get all matches in matches table
  getAllMatches: (params = {}) => 
    withRetry(() => createApiClient(createCancelToken().token).get(ENDPOINTS.MATCHES, { params })),
};

export const generatorAPI = {
  generateSlips: (data) => 
    withRetry(() => createApiClient(createCancelToken().token).post(ENDPOINTS.GENERATOR, data)),

  getJobStatus: (jobId) => 
    withRetry(() => createApiClient(createCancelToken().token).get(`${ENDPOINTS.GENERATOR}/status/${jobId}`)),
};
// Add polling function
const pollForResults = async (slipId, interval = 2000, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await slipAPI.getSlipStatus(slipId);
      if (response.data.status === "completed") {
        return await slipAPI.getSlipResults(slipId);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      if (error.isCancelled || error.response?.status === 404) {
        throw error;
      }
      // Continue polling on other errors
    }
  }
  throw new Error("Timeout waiting for results");
};
// Health check
export const checkHealth = () => 
  withRetry(() => createApiClient(createCancelToken().token).get(ENDPOINTS.HEALTH, { timeout: 3000 }));

// Utility functions
export const clearCache = () => apiCache.clear();

// Consolidated API object
export const api = {
  matches: matchAPI,
  teams: teamAPI,
  slips: slipAPI,
  betslips: betslipAPI, // Add thi
  generator: generatorAPI,
  health: { check: checkHealth },
  utils: { clearCache },
  pollForResults,
};

// Default export (matchAPI for backward compatibility)
export default matchAPI;