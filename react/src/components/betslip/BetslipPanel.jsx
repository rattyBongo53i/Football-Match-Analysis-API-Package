import React from "react";
import { useBetslip } from "../../contexts/BetslipContext";
import BetslipItem from "./BetslipItem";
import "./BetslipPanel.css";

const BetslipPanel = ({ onRunAnalysis }) => {
  const {
    betslipMatches,
    removeMatchFromBetslip,
    clearBetslip,
    getBetslipSummary,
  } = useBetslip();

  const summary = getBetslipSummary();

  if (betslipMatches.length === 0) {
    return (
      <div className="betslip-panel empty">
        <h3>🎯 Betslip</h3>
        <div className="empty-state">
          <p>No matches in betslip</p>
          <small>Add matches to create accumulators</small>
        </div>
      </div>
    );
  }

  return (
    <div className="betslip-panel">
      <div className="betslip-header">
        <h3>🎯 Betslip ({betslipMatches.length}/10)</h3>
        <button className="btn-clear" onClick={clearBetslip} title="Clear all">
          Clear
        </button>
      </div>

      <div className="betslip-content">
        <div className="betslip-items">
          {betslipMatches.map((match) => (
            <BetslipItem
              key={match.id}
              match={match}
              onRemove={() => removeMatchFromBetslip(match.id)}
            />
          ))}
        </div>

        <div className="betslip-summary">
          <div className="summary-item">
            <span>Total Matches:</span>
            <strong>{summary.totalMatches}</strong>
          </div>
          <div className="summary-item">
            <span>Status:</span>
            <span
              className={`status-indicator ${summary.isAnalysisReady ? "ready" : "waiting"}`}
            >
              {summary.isAnalysisReady
                ? "Ready for Analysis"
                : "Need 5-10 matches"}
            </span>
          </div>
        </div>

        <div className="betslip-actions">
          <button
            className={`btn-run-analysis ${!summary.isAnalysisReady ? "disabled" : ""}`}
            onClick={() =>
              summary.isAnalysisReady && onRunAnalysis(summary.matchIds)
            }
            disabled={!summary.isAnalysisReady}
          >
            🚀 Run ML Analysis
          </button>
          <small className="analysis-note">
            {summary.isAnalysisReady
              ? "Ready to analyze 5-10 matches"
              : `Add ${5 - summary.totalMatches} more matches to start analysis`}
          </small>
        </div>
      </div>
    </div>
  );
};

export default BetslipPanel;
