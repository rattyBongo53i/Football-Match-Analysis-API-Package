import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const slipService = {
  // Get generated slips for a master slip
  getGeneratedSlips: async (masterSlipId) => {
    try {
      const response = await axios.get(
        `${API_URL}/master-slips/${masterSlipId}/generated-slips`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching generated slips:", error);
      throw error;
    }
  },

  // Get single slip detail
  getSlipDetail: async (slipId) => {
    try {
      const response = await axios.get(`${API_URL}/slips/${slipId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching slip detail:", error);
      throw error;
    }
  },

  // Delete a slip
  deleteSlip: async (slipId) => {
    try {
      const response = await axios.delete(`${API_URL}/slips/${slipId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting slip:", error);
      throw error;
    }
  },

  // Get slips statistics
  getSlipsStatistics: async (masterSlipId) => {
    try {
      const response = await axios.get(
        `${API_URL}/master-slips/${masterSlipId}/slips-stats`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching slips statistics:", error);
      throw error;
    }
  },

  // Export slips to CSV
  exportSlipsToCSV: async (masterSlipId) => {
    try {
      const response = await axios.get(
        `${API_URL}/master-slips/${masterSlipId}/export-slips`,
        { responseType: "blob" }
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting slips:", error);
      throw error;
    }
  },
};

export default slipService;
