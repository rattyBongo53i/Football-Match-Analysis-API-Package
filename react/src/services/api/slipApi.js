import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const slipApi = {
  // Get master slips (user's slips)
  getMasterSlips: async () => {
    try {
      const response = await axios.get(`${API_URL}/master-slips`);
      return response.data;
    } catch (error) {
      console.error("Error fetching master slips:", error);
      throw error;
    }
  },

  // Get single master slip details
  getMasterSlip: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/da-master-slips/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching master slip:", error);
      throw error;
    }
  },

  // Create a new slip
  createSlip: async (slipData) => {
    try {
      const response = await axios.post(`${API_URL}/slips/create`, slipData);
      return response.data;
    } catch (error) {
      console.error("Error creating slip:", error);
      throw error;
    }
  },

  // Update a slip
  updateSlip: async (id, slipData) => {
    try {
      const response = await axios.put(`${API_URL}/slips/${id}`, slipData);
      return response.data;
    } catch (error) {
      console.error("Error updating slip:", error);
      throw error;
    }
  },

  // Delete a slip
  deleteSlip: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/slips/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting slip:", error);
      throw error;
    }
  },

  // Get all matches from matches table
  getAllMatches: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/matches`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  // Get slip matches for a specific slip
  getSlipMatches: async (slipId) => {
    try {
      const response = await axios.get(`${API_URL}/slips/${slipId}/matches`);
      return response.data;
    } catch (error) {
      console.error("Error fetching slip matches:", error);
      throw error;
    }
  },

  // Get generated slips for a master slip
  getGeneratedSlips: async (slipId) => {
    try {
      const response = await axios.get(`${API_URL}/slips/${slipId}/generated`);
      return response.data;
    } catch (error) {
      console.error("Error fetching generated slips:", error);
      throw error;
    }
  },

  // Add a match to slip
  addMatchToSlip: async (slipId, matchData) => {
    try {
      const response = await axios.post(
        `${API_URL}/slips/${slipId}/add-match`,
        matchData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding match to slip:", error);
      throw error;
    }
  },

  // Remove a match from slip
  removeMatchFromSlip: async (slipId, matchId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/slips/${slipId}/remove-match/${matchId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing match from slip:", error);
      throw error;
    }
  },

  // Run ML analysis on slip
  runSlipAnalysis: async (slipId) => {
    try {
      const response = await axios.post(`${API_URL}/slips/${slipId}/analyze`);
      return response.data;
    } catch (error) {
      console.error("Error running slip analysis:", error);
      throw error;
    }
  },
};

export default slipApi;
