// frontend/src/utils/matchFormatter.js

// Configuration
const CACHE_CONFIG = {
  MAX_SIZE: 100,
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Enhanced cache with size limits and TTL
class FormatterCache {
  constructor(maxSize = CACHE_CONFIG.MAX_SIZE, ttl = CACHE_CONFIG.TTL) {
    this.cache = new Map();
    this.expiryTimes = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.accessOrder = []; // For LRU eviction
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const expiry = this.expiryTimes.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    return entry;
  }

  set(key, value) {
    // Evict if cache is full (LRU)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      this.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.expiryTimes.set(key, Date.now() + this.ttl);
    this.updateAccessOrder(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.expiryTimes.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
  }

  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
    this.accessOrder = [];
  }

  updateAccessOrder(key) {
    // Remove existing key
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.expiryTimes.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }
}

// Singleton cache instance
const formatterCache = new FormatterCache();
setInterval(() => formatterCache.cleanup(), 60000); // Cleanup every minute

// Helper functions
const normalizeString = (str) => str?.toString().trim() || "";
const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;
const isEmptyValue = (value) =>
  value === "" ||
  value === null ||
  value === undefined ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" && Object.keys(value).length === 0);

const generateCacheKey = (prefix, data) => {
  // Simple but effective hash for cache keys
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${prefix}_${Math.abs(hash).toString(16)}`;
};

// Match field mappings and transformations
const MATCH_FIELD_MAPPINGS = {
  // Frontend → Backend field names
  toBackend: {
    homeTeam: "home_team",
    awayTeam: "away_team",
    headToHeadSummary: "head_to_head_summary",
    homeForm: "home_form",
    awayForm: "away_form",
    matchDate: "match_date",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },

  // Backend → Frontend field names
  toFrontend: {
    home_team: "homeTeam",
    away_team: "awayTeam",
    head_to_head_summary: "headToHeadSummary",
    home_form: "homeForm",
    away_form: "awayForm",
    match_date: "matchDate",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
};

// Default values for missing fields
const DEFAULT_VALUES = {
  home_team: "",
  away_team: "",
  league: "",
  head_to_head_summary: "",
  home_form: [],
  away_form: [],
  odds: {},
  match_date: new Date().toISOString().split("T")[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Formats a match object for backend API consumption
 * @param {Object} match - Frontend match object
 * @returns {Object} - Backend-ready match object
 */
export const formatMatchForBackend = (match) => {
  if (!match || typeof match !== "object") {
    return { ...DEFAULT_VALUES };
  }

  const cacheKey = generateCacheKey("toBackend", match);
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  // Start with defaults
  const result = { ...DEFAULT_VALUES };

  // Apply field mappings and transformations
  for (const [frontendKey, backendKey] of Object.entries(
    MATCH_FIELD_MAPPINGS.toBackend
  )) {
    const value = match[frontendKey] ?? match[backendKey];

    if (value !== undefined) {
      if (backendKey.includes("_team")) {
        result[backendKey] = normalizeString(value);
      } else if (backendKey.includes("_form")) {
        result[backendKey] = Array.isArray(value) ? value : [];
      } else if (backendKey === "odds") {
        result[backendKey] =
          typeof value === "object" && value !== null ? value : {};
      } else {
        result[backendKey] = value;
      }
    }
  }

  // Direct mappings for fields without transformations
  const directMappings = ["league", "head_to_head_summary", "match_date"];
  directMappings.forEach((key) => {
    if (match[key] !== undefined) {
      result[key] = normalizeString(match[key]);
    }
  });

  // Handle special case for odds
  if (match.odds && typeof match.odds === "object") {
    result.odds = { ...match.odds };
  }

  // Set timestamps
  result.updated_at = new Date().toISOString();
  if (!result.created_at && match.id) {
    result.created_at = DEFAULT_VALUES.created_at;
  }

  // Remove empty fields for cleaner payload
  Object.keys(result).forEach((key) => {
    if (isEmptyValue(result[key])) {
      delete result[key];
    }
  });

  // Add ID if present
  if (match.id) {
    result.id = match.id;
  }

  formatterCache.set(cacheKey, result);
  return result;
};

/**
 * Parses a match object from backend API to frontend format
 * @param {Object} backendMatch - Backend match object
 * @returns {Object} - Frontend-ready match object
 */
export const formatMatchFromBackend = (backendMatch) => {
  if (!backendMatch || typeof backendMatch !== "object") {
    return {
      id: null,
      homeTeam: "",
      awayTeam: "",
      league: "",
      headToHeadSummary: "",
      homeForm: [],
      awayForm: [],
      odds: {},
      matchDate: DEFAULT_VALUES.match_date,
      createdAt: DEFAULT_VALUES.created_at,
      updatedAt: DEFAULT_VALUES.updated_at,
    };
  }

  const cacheKey = generateCacheKey("fromBackend", backendMatch);
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  const result = {
    id: backendMatch.id || null,
  };

  // Apply field mappings from backend to frontend
  for (const [backendKey, frontendKey] of Object.entries(
    MATCH_FIELD_MAPPINGS.toFrontend
  )) {
    const value = backendMatch[backendKey];
    if (value !== undefined) {
      if (frontendKey.includes("Form")) {
        result[frontendKey] = isValidArray(value) ? [...value] : [];
      } else if (frontendKey === "odds") {
        result[frontendKey] =
          typeof value === "object" && value !== null ? { ...value } : {};
      } else {
        result[frontendKey] = value;
      }
    }
  }

  // Handle fields that might not have mappings
  const unmappedFields = ["league", "match_date", "created_at", "updated_at"];
  unmappedFields.forEach((field) => {
    if (backendMatch[field] !== undefined && !result[field]) {
      result[field] = backendMatch[field];
    }
  });

  // Ensure required fields exist
  const requiredFields = {
    homeTeam: "",
    awayTeam: "",
    league: "",
    headToHeadSummary: "",
    homeForm: [],
    awayForm: [],
    odds: {},
    matchDate: DEFAULT_VALUES.match_date,
    createdAt: DEFAULT_VALUES.created_at,
    updatedAt: DEFAULT_VALUES.updated_at,
  };

  // Merge with defaults to ensure all fields exist
  const finalResult = { ...requiredFields, ...result };

  formatterCache.set(cacheKey, finalResult);
  return finalResult;
};

/**
 * Batch format matches for backend
 * @param {Array} matches - Array of frontend match objects
 * @returns {Array} - Array of backend-ready match objects
 */
export const formatMatchesBatchForBackend = (matches) => {
  if (!Array.isArray(matches)) return [];

  return matches.map((match) => formatMatchForBackend(match));
};

/**
 * Batch parse matches from backend
 * @param {Array} backendMatches - Array of backend match objects
 * @returns {Array} - Array of frontend-ready match objects
 */
export const formatMatchesBatchFromBackend = (backendMatches) => {
  if (!Array.isArray(backendMatches)) return [];

  return backendMatches.map((match) => formatMatchFromBackend(match));
};

/**
 * Validate match object before sending to backend
 * @param {Object} match - Match object to validate
 * @returns {Object} - Validation result { isValid: boolean, errors: Array, data: Object }
 */
export const validateMatchForBackend = (match) => {
  const errors = [];
  const formatted = formatMatchForBackend(match);

  // Required field validations
  if (!formatted.home_team) errors.push("Home team is required");
  if (!formatted.away_team) errors.push("Away team is required");
  if (!formatted.league) errors.push("League is required");

  // Date validation
  if (formatted.match_date) {
    const date = new Date(formatted.match_date);
    if (isNaN(date.getTime())) {
      errors.push("Invalid match date");
    }
  }

  // Odds validation
  if (formatted.odds && typeof formatted.odds === "object") {
    const validOdds = ["home", "draw", "away"];
    validOdds.forEach((outcome) => {
      if (formatted.odds[outcome] !== undefined) {
        const oddsValue = parseFloat(formatted.odds[outcome]);
        if (isNaN(oddsValue) || oddsValue < 1) {
          errors.push(
            `Invalid odds for ${outcome}: ${formatted.odds[outcome]}`
          );
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: formatted,
  };
};

/**
 * Clear the formatter cache
 */
export const clearFormatterCache = () => {
  formatterCache.clear();
};

/**
 * Get cache statistics for debugging/monitoring
 * @returns {Object} - Cache statistics
 */
export const getCacheStats = () => ({
  size: formatterCache.cache.size,
  maxSize: formatterCache.maxSize,
  ttl: formatterCache.ttl,
  accessOrderLength: formatterCache.accessOrder.length,
});

// Export helper functions for testing
export const __testHelpers = {
  generateCacheKey,
  normalizeString,
  isEmptyValue,
  isValidArray,
};
