import React from "react";

export default function StatisticsModal({
  showStatsOverlay,
  stats,
  winRate,
  onClose,
  onReset,
}) {
  if (!showStatsOverlay) return null;

  return (
    <div className="stats-overlay">
      <div className="stats-box">
        <button className="stats-close" onClick={onClose}>
          ×
        </button>

        <div className="stats-label">PLAYER PROFILE</div>
        <div className="stats-title">Memory Deck Stats</div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Hands Played</span>
            <strong>{stats.gamesPlayed}</strong>
          </div>

          <div className="stat-card">
            <span>Win Rate</span>
            <strong>{winRate}%</strong>
          </div>

          <div className="stat-card win">
            <span>Wins</span>
            <strong>{stats.wins}</strong>
          </div>

          <div className="stat-card lose">
            <span>Losses</span>
            <strong>{stats.losses}</strong>
          </div>

          <div className="stat-card">
            <span>Pushes</span>
            <strong>{stats.pushes}</strong>
          </div>

          <div className="stat-card">
            <span>Blackjacks</span>
            <strong>{stats.blackjacks}</strong>
          </div>

          <div className="stat-card">
            <span>Splits</span>
            <strong>{stats.splits}</strong>
          </div>

          <div className="stat-card">
            <span>Double Downs</span>
            <strong>{stats.doubleDowns}</strong>
          </div>

          <div className="stat-card highlight">
            <span>Highest Balance</span>
            <strong>{stats.highestBalance}</strong>
          </div>
        </div>

        <button className="stats-reset" onClick={onReset}>
          Reset Statistics
        </button>
      </div>
    </div>
  );
}
