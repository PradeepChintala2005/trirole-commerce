import React from 'react';
import './index.css';

function StatCard({ title, value, trend, isPositive }) {
  return (
    <div className="stat-card">
      <h3 className="stat-title">{title}</h3>
      <div className="stat-data">
        <p className="stat-value">{value}</p>
        <span className={`stat-trend ${isPositive ? 'trend-pos' : 'trend-neg'}`}>{trend}</span>
      </div>
    </div>
  );
}
export default StatCard;
