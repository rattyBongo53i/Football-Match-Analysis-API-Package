import { api } from "../api"; // Your existing axios instance

const betslipService = {
  /**
   * Create a new betslip in database
   */
  async createSlip(data = {}) {
    try {
      const response = await api.post("/slips/create", {
        name: data.name || "My Betslip",
        stake: data.stake || 100,
        currency: data.currency || "USD",
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Failed to create slip:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create betslip",
      };
    }
  },

  /**
   * Add match to existing betslip
   */
  async addMatchToSlip(slipId, match) {
    try {
      const response = await api.post(`/slips/${slipId}/add-match`, {
        match_id: match.id,
        market: match.markets?.[0]?.name || "1X2",
        selection: "home", // Default selection
        odds: match.markets?.[0]?.home_odds || 1.85,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Failed to add match to slip:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to add match to betslip",
      };
    }
  },

  /**
   * Remove match from betslip
   */
  async removeMatchFromSlip(slipId, matchId) {
    try {
      const response = await api.delete(
        `/slips/${slipId}/remove-match/${matchId}`
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Failed to remove match from slip:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Failed to remove match from betslip",
      };
    }
  },

  /**
   * Get current user's active slip
   */
  async getActiveSlip() {
    try {
      const response = await api.get("/slips/active");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      // Return null if no active slip exists
      return {
        success: false,
        data: null,
      };
    }
  },
};

export default betslipService;
