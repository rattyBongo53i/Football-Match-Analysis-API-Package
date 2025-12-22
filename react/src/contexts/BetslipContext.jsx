// contexts/BetslipContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import betslipService from "../services/api/betslipService";

const BetslipContext = createContext();

export const BetslipProvider = ({ children }) => {
  const [activeSlips, setActiveSlips] = useState([]);
  const [currentSlipId, setCurrentSlipId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveSlips = async () => {
      setLoading(true);
      try {
        const response = await betslipService.getActiveSlips();
        if (response.success) {
          const slips = response.data || [];
          setActiveSlips(slips);

          // Auto-select first slip if none selected
          if (slips.length > 0 && !currentSlipId) {
            setCurrentSlipId(slips[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load active slips:", err);
      } finally {
        setLoading(false);
      }
    };

    loadActiveSlips();
  }, []);

  // Compute current slip's matches
  const currentSlip = useMemo(() => {
    return activeSlips.find((slip) => slip.id === currentSlipId) || null;
  }, [activeSlips, currentSlipId]);

  // This is what BetslipButton needs
  const betslipMatches = useMemo(() => {
    return currentSlip?.matches || [];
  }, [currentSlip]);

  const refreshSlips = async () => {
    try {
      const response = await betslipService.getActiveSlips();
      if (response.success) {
        setActiveSlips(response.data || []);
      }
    } catch (err) {
      console.error("Failed to refresh slips:", err);
    }
  };

  const createNewSlip = async (data = {}) => {
    try {
      const response = await betslipService.createSlip(data);
      if (response.success) {
        const newSlip = response.data;
        setActiveSlips((prev) => [...prev, newSlip]);
        setCurrentSlipId(newSlip.id);
        await refreshSlips();
        return { success: true, slip: newSlip };
      }
    } catch (err) {
      console.error("Failed to create slip:", err);
      return { success: false, error: err.message };
    }
  };

  const addMatchToBetslip = async (match, slipId = null) => {
    const targetId = slipId || currentSlipId;
    if (!targetId) {
      const result = await createNewSlip({ name: "My Betslip" });
      if (!result.success) throw new Error("Failed to create slip");
      return addMatchToBetslip(match, result.slip.id);
    }

    try {
      const response = await betslipService.addMatchToSlip(targetId, match);
      if (response.success) {
        await refreshSlips();
        return { success: true };
      }
    } catch (err) {
      console.error("Failed to add match:", err);
      return { success: false, error: err.message };
    }
  };

  const isMatchInBetslip = (matchId) => {
    return betslipMatches.some((m) => m.id === matchId);
  };

  const value = {
    activeSlips,
    currentSlipId,
    currentSlip,
    betslipMatches, // ← This is what fixes your button
    loading,
    createNewSlip,
    addMatchToBetslip,
    isMatchInBetslip,
    getActiveSlips: () => activeSlips,
    getCurrentSlipId: () => currentSlipId,
    setCurrentSlipId,
    refreshSlips,
  };

  return (
    <BetslipContext.Provider value={value}>{children}</BetslipContext.Provider>
  );
};

export const useBetslip = () => {
  const context = useContext(BetslipContext);
  if (!context) {
    throw new Error("useBetslip must be used within BetslipProvider");
  }
  return context;
};
