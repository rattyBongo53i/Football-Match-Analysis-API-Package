// services/api/matchApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const matchApi = {
  // Get all matches
  getMatches: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/matches`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  // Get single match by ID
  getMatchById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/matches/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching match ${id}:`, error);
      throw error;
    }
  },

  // Delete a match
  deleteMatch: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/matches/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting match ${id}:`, error);
      throw error;
    }
  },
};

export default matchApi;
