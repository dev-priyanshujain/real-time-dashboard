import React from 'react';
import './VolatilityIndicator.css';

const VolatilityIndicator = ({ symbol, volatility }) => {
  const getRating = (vol) => {
    if (vol > 0.05) return { label: 'Extremely High', color: '#f43f5e' };
    if (vol > 0.02) return { label: 'High', color: '#fb923c' };
    if (vol > 0.01) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Low', color: '#10b981' };
  };

  const rating = getRating(volatility || 0);

  return (
    <div className="volatility-card">
      <div className="vol-header">
        <span className="label">24H Volatility</span>
        <span className="rating" style={{ color: rating.color }}>{rating.label}</span>
      </div>
      <div className="vol-value">
        {volatility !== null && volatility !== undefined && !isNaN(volatility) ? (
          <>
            <span className="val-text">{(parseFloat(volatility) * 100).toFixed(2)}%</span>
            <div className="vol-track">
              <div 
                className="vol-fill" 
                style={{ 
                  width: `${Math.min(volatility * 100 * 5, 100)}%`,
                  backgroundColor: rating.color,
                  boxShadow: `0 0 12px ${rating.color}40`
                }}
              />
            </div>
          </>
        ) : (
          <span className="val-text">--%</span>
        )}
      </div>
    </div>
  );
};

export default VolatilityIndicator;
