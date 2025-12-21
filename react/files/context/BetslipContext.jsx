import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { matchService } from "../services/api/matchService";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load betslip from localStorage on mount
  useEffect(() => {
    const savedBetslip = localStorage.getItem("betslip_matches");
    if (savedBetslip) {
      try {
        setBetslipMatches(JSON.parse(savedBetslip));
      } catch (err) {
        console.error("Error loading betslip from storage:", err);
      }
    }
  }, []);

  // Save betslip to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("betslip_matches", JSON.stringify(betslipMatches));
  }, [betslipMatches]);

  const addMatchToBetslip = useCallback(async (match) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure match is saved to database first
      let savedMatch;
      if (!match.id || match.id.toString().startsWith("match_")) {
        // This is a new match, save it first
        savedMatch = await matchService.createMatch(match);
      } else {
        // Match already exists in database
        savedMatch = match;
      }

      // Add to betslip if not already present
      setBetslipMatches((prev) => {
        const exists = prev.some((m) => m.id === savedMatch.id);
        if (exists) {
          return prev;
        }
        return [...prev, { ...savedMatch, addedAt: new Date().toISOString() }];
      });

      return savedMatch;
    } catch (err) {
      setError("Failed to add match to betslip");
      console.error("Error adding match to betslip:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMatchFromBetslip = useCallback((matchId) => {
    setBetslipMatches((prev) => prev.filter((match) => match.id !== matchId));
  }, []);

  const clearBetslip = useCallback(() => {
    setBetslipMatches([]);
  }, []);

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
    };
  }, [betslipMatches]);

  const value = {
    betslipMatches,
    addMatchToBetslip,
    removeMatchFromBetslip,
    clearBetslip,
    isMatchInBetslip,
    getBetslipSummary,
    loading,
    error,
  };

  return (
    <BetslipContext.Provider value={value}>{children}</BetslipContext.Provider>
  );
};
