import React from "react";
import { normalizeOdds } from "../../services/normalization/marketNormalizer";

const MarketOddsInput = ({ market, onChange, errors = {} }) => {
  const handleOddsChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedMarket = {
      ...market,
      [field]: numericValue,
    };

    // Normalize odds for backend
    updatedMarket.odds = normalizeOdds({
      home: updatedMarket.home_odds,
      draw: updatedMarket.draw_odds,
      away: updatedMarket.away_odds,
    });

    onChange(updatedMarket);
  };

  const renderMarketInputs = () => {
    switch (market.name) {
      case "1X2":
      case "Match Result":
        return (
          <div className="market-odds-grid">
            <div className="odds-input-group">
              <label>Home Win</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={market.home_odds || ""}
                onChange={(e) => handleOddsChange("home_odds", e.target.value)}
                className={errors.home_odds ? "error" : ""}
              />
              {errors.home_odds && (
                <span className="error-message">{errors.home_odds}</span>
              )}
            </div>
            <div className="odds-input-group">
              <label>Draw</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={market.draw_odds || ""}
                onChange={(e) => handleOddsChange("draw_odds", e.target.value)}
                className={errors.draw_odds ? "error" : ""}
              />
              {errors.draw_odds && (
                <span className="error-message">{errors.draw_odds}</span>
              )}
            </div>
            <div className="odds-input-group">
              <label>Away Win</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={market.away_odds || ""}
                onChange={(e) => handleOddsChange("away_odds", e.target.value)}
                className={errors.away_odds ? "error" : ""}
              />
              {errors.away_odds && (
                <span className="error-message">{errors.away_odds}</span>
              )}
            </div>
          </div>
        );

      case "Over/Under 2.5":
        return (
          <div className="market-odds-single">
            <div className="odds-input-group">
              <label>Over 2.5</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={market.over_odds || ""}
                onChange={(e) => handleOddsChange("over_odds", e.target.value)}
                className={errors.over_odds ? "error" : ""}
              />
            </div>
            <div className="odds-input-group">
              <label>Under 2.5</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={market.under_odds || ""}
                onChange={(e) => handleOddsChange("under_odds", e.target.value)}
                className={errors.under_odds ? "error" : ""}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="market-odds-single">
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={market.odds || ""}
              onChange={(e) => handleOddsChange("odds", e.target.value)}
              placeholder="Odds"
              className={errors.odds ? "error" : ""}
            />
          </div>
        );
    }
  };

  return (
    <div className="market-odds-input">
      <div className="market-header">
        <h4>{market.name}</h4>
      </div>
      {renderMarketInputs()}
    </div>
  );
};

export default MarketOddsInput;
