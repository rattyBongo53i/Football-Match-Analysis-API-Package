import React, { createContext, useState, useContext, useCallback } from "react";
import { jobService } from "../services/api/jobService";

const JobContext = createContext();

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJob must be used within a JobProvider");
  }
  return context;
};

export const JobProvider = ({ children }) => {
  const [activeJobs, setActiveJobs] = useState({});
  const [jobResults, setJobResults] = useState({});

  const triggerAnalysis = useCallback(async (matchIds) => {
    const jobKey = `analysis_${Date.now()}`;

    setActiveJobs((prev) => ({
      ...prev,
      [jobKey]: {
        id: jobKey,
        matchIds,
        status: "pending",
        startedAt: new Date().toISOString(),
      },
    }));

    try {
      // Update status to running
      setActiveJobs((prev) => ({
        ...prev,
        [jobKey]: { ...prev[jobKey], status: "running" },
      }));

      // Trigger the analysis job
      const response = await jobService.triggerBetslipAnalysis(matchIds);

      // If backend returns a job ID, use it
      const backendJobId = response.job_id || jobKey;

      // Update with backend job ID if different
      if (backendJobId !== jobKey) {
        setActiveJobs((prev) => {
          const { [jobKey]: currentJob, ...others } = prev;
          return {
            ...others,
            [backendJobId]: {
              ...currentJob,
              id: backendJobId,
              backendJobId: backendJobId,
            },
          };
        });
      }

      // Poll for job completion
      await pollJobStatus(backendJobId);

      return backendJobId;
    } catch (error) {
      console.error("Error triggering analysis:", error);
      setActiveJobs((prev) => ({
        ...prev,
        [jobKey]: { ...prev[jobKey], status: "failed", error: error.message },
      }));
      throw error;
    }
  }, []);

  const pollJobStatus = useCallback(
    async (jobId, interval = 2000, maxAttempts = 30) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;

        try {
          const status = await jobService.getJobStatus(jobId);

          setActiveJobs((prev) => ({
            ...prev,
            [jobId]: { ...prev[jobId], status: status.status },
          }));

          if (status.status === "completed") {
            // Fetch results
            const results = await jobService.getAnalysisResults(jobId);
            setJobResults((prev) => ({
              ...prev,
              [jobId]: results,
            }));
            return true;
          } else if (status.status === "failed") {
            setActiveJobs((prev) => ({
              ...prev,
              [jobId]: { ...prev[jobId], error: status.error },
            }));
            return false;
          } else if (attempts >= maxAttempts) {
            setActiveJobs((prev) => ({
              ...prev,
              [jobId]: { ...prev[jobId], status: "timeout" },
            }));
            return false;
          } else {
            // Continue polling
            setTimeout(poll, interval);
          }
        } catch (error) {
          console.error("Error polling job status:", error);
          setActiveJobs((prev) => ({
            ...prev,
            [jobId]: { ...prev[jobId], status: "error", error: error.message },
          }));
          return false;
        }
      };

      await poll();
    },
    []
  );

  const getJobStatus = useCallback(
    (jobId) => {
      return activeJobs[jobId] || null;
    },
    [activeJobs]
  );

  const getJobResults = useCallback(
    (jobId) => {
      return jobResults[jobId] || null;
    },
    [jobResults]
  );

  const clearJob = useCallback((jobId) => {
    setActiveJobs((prev) => {
      const { [jobId]: _, ...others } = prev;
      return others;
    });

    setJobResults((prev) => {
      const { [jobId]: _, ...others } = prev;
      return others;
    });
  }, []);

  const clearAllJobs = useCallback(() => {
    setActiveJobs({});
    setJobResults({});
  }, []);

  const value = {
    activeJobs,
    jobResults,
    triggerAnalysis,
    getJobStatus,
    getJobResults,
    clearJob,
    clearAllJobs,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
