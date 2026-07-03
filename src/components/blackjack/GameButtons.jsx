import React from "react";

export default function GameButtons({
  gameStarted,
  dealerAnimating,
  dealerRevealed,
  showInsuranceOverlay,
  canDoubleDown,
  canSplit,
  onNewGame,
  onResetBank,
  onHit,
  onStand,
  onDoubleDown,
  onSplitPair,
  onShowStats,
}) {
  return (
    <div className="button-grid">
      <button
        className="primary-button"
        onClick={onNewGame}
        disabled={gameStarted || dealerAnimating}
      >
        New Game
      </button>

      <button
        className="reset-button"
        onClick={onResetBank}
        disabled={gameStarted || dealerAnimating}
      >
        Reset Bank
      </button>

      <button
        className="game-button"
        onClick={onHit}
        disabled={
          !gameStarted ||
          dealerRevealed ||
          dealerAnimating ||
          showInsuranceOverlay
        }
      >
        Hit
      </button>

      <button
        className="game-button"
        onClick={onStand}
        disabled={
          !gameStarted ||
          dealerRevealed ||
          dealerAnimating ||
          showInsuranceOverlay
        }
      >
        Stand
      </button>

      <button
        className="double-button"
        onClick={onDoubleDown}
        disabled={!canDoubleDown}
      >
        Double
      </button>

      <button
        className="split-button"
        onClick={onSplitPair}
        disabled={!canSplit}
      >
        Split
      </button>

      <button className="stats-button" onClick={onShowStats}>
        Stats
      </button>
    </div>
  );
}
