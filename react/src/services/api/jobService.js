import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

export const jobService = {
  // Trigger ML analysis for betslip
  async triggerBetslipAnalysis(matchIds) {
    try {
      const response = await api.post('/jobs/analyze-betslip', {
        match_ids: matchIds,
        job_type: 'ml_analysis'
      });
      return response.data;
    } catch (error) {
      console.error('Error triggering analysis:', error);
      throw error;
    }
  },

  // Get job status
  async getJobStatus(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  },

  // Get analysis results
  async getAnalysisResults(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting analysis results:', error);
      throw error;
    }
  }
};