import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { matchService } from "../services/api/matchService";
import betslipService from "../services/api/betslipService";

const BetslipContext = createContext();

export const useBetslip = () => {
  const context = useContext(BetslipContext);
  if (!context) {
    throw new Error("useBetslip must be used within a BetslipProvider");
  }
  return context;
};

export const BetslipProvider = ({ children }) => {
  const [betslipMatches, setBetslipMatches] = useState([]);
  const [activeSlipId, setActiveSlipId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load active slip from backend on mount
  useEffect(() => {
    const loadActiveSlip = async () => {
      setLoading(true);
      try {
        const result = await betslipService.getActiveSlip();

        if (result.success && result.data) {
          setActiveSlipId(result.data.slip_id);

          // Load matches for this slip
          // You'll need to implement getSlipMatches in your backend
          // For now, fall back to localStorage
          const savedMatches = localStorage.getItem("betslip_matches");
          if (savedMatches) {
            setBetslipMatches(JSON.parse(savedMatches));
          }
        }
      } catch (err) {
        console.error("Error loading active slip:", err);
      } finally {
        setLoading(false);
      }
    };

    loadActiveSlip();
  }, []);

  /**
   * Create a new betslip in backend
   */
  const createSlip = useCallback(async (data = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await betslipService.createSlip(data);

      if (result.success) {
        setActiveSlipId(result.data.slip_id);
        localStorage.setItem("active_slip_id", result.data.slip_id);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError("Failed to create betslip");
      console.error("Error creating slip:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add match to current betslip
   */
  const addMatchToBetslip = useCallback(
    async (match) => {
      setLoading(true);
      setError(null);

      try {
        // Create slip if doesn't exist
        let slipId = activeSlipId;
        if (!slipId) {
          const slip = await createSlip({
            name: `Slip ${new Date().toLocaleDateString()}`,
          });
          slipId = slip.slip_id;
        }

        // Add match to backend
        const result = await betslipService.addMatchToSlip(slipId, match);

        if (result.success) {
          // Update frontend state
          setBetslipMatches((prev) => {
            const exists = prev.some((m) => m.id === match.id);
            if (exists) {
              return prev;
            }
            return [...prev, { ...match, addedAt: new Date().toISOString() }];
          });

          // Sync to localStorage for quick access
          localStorage.setItem(
            "betslip_matches",
            JSON.stringify([
              ...betslipMatches.filter((m) => m.id !== match.id),
              { ...match, addedAt: new Date().toISOString() },
            ])
          );

          return match;
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        setError("Failed to add match to betslip");
        console.error("Error adding match to betslip:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [activeSlipId, betslipMatches, createSlip]
  );

  /**
   * Remove match from betslip
   */
  const removeMatchFromBetslip = useCallback(
    async (matchId) => {
      if (!activeSlipId) return;

      setLoading(true);
      try {
        // Remove from backend
        const result = await betslipService.removeMatchFromSlip(
          activeSlipId,
          matchId
        );

        if (result.success) {
          // Update frontend state
          setBetslipMatches((prev) => {
            const updated = prev.filter((match) => match.id !== matchId);

            // Update localStorage
            localStorage.setItem("betslip_matches", JSON.stringify(updated));

            // Clear slip if empty
            if (updated.length === 0) {
              localStorage.removeItem("active_slip_id");
            }

            return updated;
          });
        }
      } catch (err) {
        console.error("Error removing match from betslip:", err);

        // Fallback: still remove from frontend
        setBetslipMatches((prev) =>
          prev.filter((match) => match.id !== matchId)
        );
        localStorage.setItem(
          "betslip_matches",
          JSON.stringify(betslipMatches.filter((m) => m.id !== matchId))
        );
      } finally {
        setLoading(false);
      }
    },
    [activeSlipId, betslipMatches]
  );

  /**
   * Clear entire betslip
   */
  const clearBetslip = useCallback(async () => {
    if (!activeSlipId) {
      setBetslipMatches([]);
      localStorage.removeItem("betslip_matches");
      return;
    }

    setLoading(true);
    try {
      // Remove all matches one by one (or implement batch remove)
      for (const match of betslipMatches) {
        await betslipService.removeMatchFromSlip(activeSlipId, match.id);
      }

      setBetslipMatches([]);
      localStorage.removeItem("betslip_matches");
      localStorage.removeItem("active_slip_id");
    } catch (err) {
      console.error("Error clearing betslip:", err);
    } finally {
      setLoading(false);
    }
  }, [activeSlipId, betslipMatches]);

  const isMatchInBetslip = useCallback(
    (matchId) => {
      return betslipMatches.some((match) => match.id === matchId);
    },
    [betslipMatches]
  );

  const getBetslipSummary = useCallback(() => {
    const totalMatches = betslipMatches.length;
    const isAnalysisReady = totalMatches >= 5 && totalMatches <= 10;
    const matchIds = betslipMatches.map((match) => match.id);

    return {
      totalMatches,
      isAnalysisReady,
      matchIds,
      canAddMore: totalMatches < 10,
      slipId: activeSlipId,
      hasActiveSlip: !!activeSlipId,
    };
  }, [betslipMatches, activeSlipId]);

  const value = {
    betslipMatches,
    activeSlipId,
    addMatchToBetslip,
    removeMatchFromBetslip,
    clearBetslip,
    createSlip,
    isMatchInBetslip,
    getBetslipSummary,
    loading,
    error,
  };

  return (
    <BetslipContext.Provider value={value}>{children}</BetslipContext.Provider>
  );
};
