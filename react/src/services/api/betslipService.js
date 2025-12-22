// services/api/betslipService.js
import { api } from "../api"; // Keep this, but use api.slips
import axios from "axios";

const betslipService = {
  async createSlip(data = {}) {
    const response = await api.betslips.createSlip(data);
    return { success: true, data: response.data.data };
  },

// async getActiveSlips() {
//   try {
//     const response = await axios.get('http://localhost:8000/api/slips/active-master-slips'); // Fixed relative URL

//     // Optional: Validate response structure
//     if (!response?.data) {
//       console.warn('getActiveSlips: Empty response data');
//       return {
//         success: false,
//         data: [],
//         error: 'Empty response from server',
//       };
//     }

//     return {
//       success: true,
//       data: response.data, // Assuming backend returns { success: true, data: [...] }
//     };
//   } catch (error) {
//     // Network error, timeout, or server down
//     if (error.code === 'ERR_NETWORK' || !error.response) {
//       console.error('Network error while fetching active slips:', error);
//       return {
//         success: false,
//         data: [],
//         error: 'Network error. Please check your connection.',
//       };
//     }

//     // HTTP error (4xx, 5xx)
//     const status = error.response?.status;
//     const message = error.response?.data?.message || error.message;

//     console.error(`Failed to fetch active slips (HTTP ${status}):`, message);

//     // Customize based on status code if needed
//     let userMessage = 'Failed to load active slips. Please try again later.';
//     if (status === 401) userMessage = 'Unauthorized. Please log in again.';
//     if (status === 404) userMessage = 'Active slips endpoint not found.';
//     if (status >= 500) userMessage = 'Server error. Please try again later.';

//     return {
//       success: false,
//       data: [],
//       error: userMessage,
//       // Optional: include details for debugging in development
//       ...(process.env.NODE_ENV === 'development' && { debug: message }),
//     };
//   }
// },

  async getActiveSlips() {
    try {
      // Log the exact URL being constructed
      const response = await api.betslips.getActiveSlips();
      return { success: true, data: response.data.data };

      // ... rest of your code
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        config: error.config,
        response: error.response,
        request: error.request,
      });
      
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      
      return this.handleError(error);
    }
  },
  
  async addMatchToSlip(slipId, match) {
    const response = await api.betslips.addMatchToSlip(slipId, {
      match_id: match.id,
      market: match.markets?.[0]?.name || "1X2",
      selection: match.markets?.[0]?.outcomes?.[0]?.outcome || "Home",
      odds: match.markets?.[0]?.outcomes?.[0]?.odds || 1.85,
    });
    return { success: true, data: response.data.data };
  },
  async removeMatchFromSlip(slipId, matchId) {
    const response = await api.delete(
      `/slips/${slipId}/remove-match/${matchId}`
    );
    return {
      success: true,
      data: response.data.data,
    };
  },
};

export default betslipService;
