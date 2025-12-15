import axios from "axios";
import {
  normalizeMatchForBackend,
  normalizeMatchForUI,
} from "../normalization/matchNormalizer";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

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
};
