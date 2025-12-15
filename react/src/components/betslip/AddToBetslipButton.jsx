import React, { useState } from "react";
import { useBetslip } from "../../contexts/BetslipContext";
import "./AddToBetslipButton.css";

const AddToBetslipButton = ({ match, size = "medium" }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { addMatchToBetslip, isMatchInBetslip, getBetslipSummary } =
    useBetslip();

  const handleAddToBetslip = async () => {
    if (isMatchInBetslip(match.id)) {
      return; // Already in betslip
    }

    const summary = getBetslipSummary();
    if (!summary.canAddMore) {
      alert("Betslip is full (max 10 matches)");
      return;
    }

    setIsAdding(true);
    try {
      await addMatchToBetslip(match);
    } catch (error) {
      console.error("Failed to add to betslip:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const isInBetslip = isMatchInBetslip(match.id);
  const summary = getBetslipSummary();

  if (isInBetslip) {
    return (
      <button
        className={`betslip-btn added size-${size}`}
        disabled
        title="Already in betslip"
      >
        ✓ Added
      </button>
    );
  }

  return (
    <button
      className={`betslip-btn add size-${size} ${!summary.canAddMore ? "disabled" : ""}`}
      onClick={handleAddToBetslip}
      disabled={isAdding || !summary.canAddMore}
      title={
        !summary.canAddMore
          ? "Betslip is full (max 10 matches)"
          : "Add to betslip"
      }
    >
      {isAdding ? "Adding..." : "+ Add to Betslip"}
    </button>
  );
};

export default AddToBetslipButton;
