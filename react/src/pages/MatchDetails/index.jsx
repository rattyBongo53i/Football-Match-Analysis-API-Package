import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { matchService } from "../../services/api/matchService";
import { useBetslip } from "../../contexts/BetslipContext";
import AddToBetslipButton from "../../components/betslip/AddToBetslipButton";
import MarketOddsDisplay from "../../components/matches/MarketOddsDisplay";
import TeamFormDisplay from "../../components/matches/TeamFormDisplay";
import "./MatchDetails.css";

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const matchData = await matchService.getMatchById(id);
      setMatch(matchData);
    } catch (err) {
      setError("Failed to load match details");
      console.error("Error loading match:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this match?")) {
      return;
    }

    try {
      await matchService.deleteMatch(id);
      alert("Match deleted successfully");
      navigate("/matches");
    } catch (err) {
      alert("Failed to delete match");
      console.error("Error deleting match:", err);
    }
  };

  if (loading) {
    return (
      <div className="match-details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="match-details-container">
        <div className="error-state">
          <h3>Match Not Found</h3>
          <p>{error || "The match you are looking for does not exist."}</p>
          <button onClick={() => navigate("/matches")}>
            Back to Matches List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="match-details-container">
      <div className="match-header">
        <div className="header-main">
          <h1>
            {match.home_team} vs {match.away_team}
          </h1>
          <div className="match-meta">
            <span className="league">{match.league || "Unknown League"}</span>
            <span className="date">
              {new Date(match.match_date).toLocaleDateString()}
            </span>
            <span className="status">{match.status || "Scheduled"}</span>
          </div>
        </div>

        <div className="header-actions">
          <AddToBetslipButton match={match} size="large" />
          <button
            className="btn-edit"
            onClick={() => navigate(`/matches/${id}/edit`)}
          >
            Edit Match
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            Delete
          </button>
          <button className="btn-back" onClick={() => navigate("/matches")}>
            Back to List
          </button>
        </div>
      </div>

      <div className="match-content">
        <div className="score-section">
          <div className="team home-team">
            <h3>{match.home_team}</h3>
            {match.home_score !== null && (
              <div className="score">{match.home_score}</div>
            )}
          </div>

          <div className="vs">
            <span>VS</span>
            {match.match_time && (
              <span className="time">{match.match_time}</span>
            )}
          </div>

          <div className="team away-team">
            <h3>{match.away_team}</h3>
            {match.away_score !== null && (
              <div className="score">{match.away_score}</div>
            )}
          </div>
        </div>

        <div className="details-grid">
          <div className="details-column">
            <div className="details-card">
              <h3>📊 Team Forms</h3>
              <TeamFormDisplay
                homeForm={match.home_form}
                awayForm={match.away_form}
              />
            </div>

            <div className="details-card">
              <h3>🤝 Head to Head</h3>
              {match.head_to_head ? (
                <pre className="h2h-data">
                  {JSON.stringify(match.head_to_head, null, 2)}
                </pre>
              ) : (
                <p>No head-to-head data available</p>
              )}
            </div>
          </div>

          <div className="details-column">
            <div className="details-card">
              <h3>🎯 Market Odds</h3>
              <MarketOddsDisplay markets={match.markets || []} />
            </div>

            <div className="details-card">
              <h3>📝 Additional Info</h3>
              <div className="additional-info">
                <div className="info-item">
                  <strong>Venue:</strong>
                  <span>{match.venue || "Not specified"}</span>
                </div>
                <div className="info-item">
                  <strong>Referee:</strong>
                  <span>{match.referee || "Not specified"}</span>
                </div>
                <div className="info-item">
                  <strong>Weather:</strong>
                  <span>{match.weather || "Not specified"}</span>
                </div>
                <div className="info-item">
                  <strong>Created:</strong>
                  <span>{new Date(match.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
