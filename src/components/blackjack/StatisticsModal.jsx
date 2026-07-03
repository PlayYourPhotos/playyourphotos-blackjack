import React from "react";

export default function StatisticsModal({
  showStats,
  stats,
  onClose,
}) {
  if (!showStats) return null;

  const totalGames =
    (stats.wins || 0) +
    (stats.losses || 0) +
    (stats.pushes || 0);

  const winRate =
    totalGames > 0
      ? (((stats.wins || 0) / totalGames) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="stats-overlay">
      <div className="stats-box">

        <button
          className="stats-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="stats-title">
          Blackjack Statistics
        </div>

        <div className="stats-grid">

          <div className="stats-row">
            <span>Games Played</span>
            <strong>{totalGames}</strong>
          </div>

          <div className="stats-row">
            <span>Wins</span>
            <strong>{stats.wins || 0}</strong>
          </div>

          <div className="stats-row">
            <span>Losses</span>
            <strong>{stats.losses || 0}</strong>
          </div>

          <div className="stats-row">
            <span>Pushes</span>
            <strong>{stats.pushes || 0}</strong>
          </div>

          <div className="stats-row">
            <span>Blackjacks</span>
            <strong>{stats.blackjacks || 0}</strong>
          </div>

          <div className="stats-row">
            <span>Win Rate</span>
            <strong>{winRate}%</strong>
          </div>

          <div className="stats-row">
            <span>Highest Balance</span>
            <strong>{stats.highestBalance || 0}</strong>
          </div>

          <div className="stats-row">
            <span>Current Streak</span>
            <strong>{stats.streak || 0}</strong>
          </div>

        </div>

        <button
          className="stats-button"
          onClick={onClose}
        >
          Close
        </button>

      </div>
    </div>
  );
}
