import axios from "axios";
import {
  normalizeMatchForBackend,
  normalizeMatchForUI,
} from "../normalization/matchNormalizer";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const matchService = {
  // Create a new match
  async createMatch(matchData) {
    try {
      const normalizedData = normalizeMatchForBackend(matchData);
      const response = await api.post("/matches", normalizedData);
      return normalizeMatchForUI(response.data.data);
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  },

  // Get all matches
  async getAllMatches(params = {}) {
    try {
      const response = await api.get("/matches", { params });
      return {
        matches: response.data.data.map((match) => normalizeMatchForUI(match)),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  // Get single match
  async getMatchById(id) {
    try {
      const response = await api.get(`/matches/${id}`);
      return normalizeMatchForUI(response.data.data);
    } catch (error) {
      console.error("Error fetching match:", error);
      throw error;
    }
  },

  // Update match
  async updateMatch(id, matchData) {
    try {
      const normalizedData = normalizeMatchForBackend(matchData);
      const response = await api.put(`/matches/${id}`, normalizedData);
      return normalizeMatchForUI(response.data.data);
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  },

  // Delete match
  async deleteMatch(id) {
    try {
      await api.delete(`/matches/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting match:", error);
      throw error;
    }
  },

  // Get matches for betslip
  async getMatchesForBetslip(matchIds) {
    try {
      const response = await api.get("/matches/betslip", {
        params: { match_ids: matchIds.join(",") },
      });
      return response.data.data.map((match) => normalizeMatchForUI(match));
    } catch (error) {
      console.error("Error fetching betslip matches:", error);
      throw error;
    }
  },

  /**
   * Trigger backend prediction generation for a match.
   * Calls: POST /api/matches/{id}/generate-predictions (Laravel)
   *
   * Expected responses (today):
   *  - { success: true, message, match_id, status: "processing" }
   *  - 409 if already running/completed
   */
  async generatePredictions(matchId) {
    try {
      const response = await api.post(`/matches/${matchId}/generate-predictions`);
      return response.data;
    } catch (error) {
      console.error("Error generating predictions:", error);
      throw error;
    }
  },

  /**
   * Fetch prediction results for a match.
   * V1 target: GET /api/predictions/{match_id}
   *
   * This currently tries a couple of shapes/locations so the UI can be built
   * before the backend results endpoint is finalized.
   */
  async getPredictionResults(matchId) {
    // 1) Future canonical endpoint
    try {
      const res = await api.get(`/predictions/${matchId}`);
      return res.data;
    } catch (_) {
      // ignore, fall through
    }

    // 2) Fallback: match details might eventually embed predictions/slips
    try {
      const res = await api.get(`/matches/${matchId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching prediction results:", error);
      throw error;
    }
  },
};
