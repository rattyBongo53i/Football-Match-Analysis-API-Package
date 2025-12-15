import React, { useState, useEffect } from "react";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import MatchesTable from "./MatchesTable";
import "./MatchesList.css";

const MatchesList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });
  const { addMatchToBetslip } = useBetslip();

  useEffect(() => {
    loadMatches();
  }, [pagination.page]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await matchService.getAllMatches({
        page: pagination.page,
        per_page: pagination.perPage,
      });

      setMatches(response.matches);
      setPagination((prev) => ({
        ...prev,
        total: response.meta?.total || 0,
        lastPage: response.meta?.last_page || 1,
      }));
    } catch (err) {
      setError("Failed to load matches. Please try again.");
      console.error("Error loading matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Are you sure you want to delete this match?")) {
      return;
    }

    try {
      await matchService.deleteMatch(matchId);
      setMatches((prev) => prev.filter((match) => match.id !== matchId));
      alert("Match deleted successfully");
    } catch (err) {
      alert("Failed to delete match");
      console.error("Error deleting match:", err);
    }
  };

  const handleAddToBetslip = async (match) => {
    try {
      await addMatchToBetslip(match);
      alert("Match added to betslip");
    } catch (err) {
      alert("Failed to add match to betslip");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="matches-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-list-container">
      <div className="page-header">
        <h1>Football Matches</h1>
        <div className="header-actions">
          <a href="/matches/new" className="btn-primary">
            + Add New Match
          </a>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          {error}
          <button onClick={loadMatches}>Retry</button>
        </div>
      )}

      <div className="matches-content">
        <MatchesTable
          matches={matches}
          onDelete={handleDeleteMatch}
          onAddToBetslip={handleAddToBetslip}
          loading={loading}
        />

        {pagination.total > pagination.perPage && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>

            <span className="page-info">
              Page {pagination.page} of {pagination.lastPage}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.lastPage}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesList;
