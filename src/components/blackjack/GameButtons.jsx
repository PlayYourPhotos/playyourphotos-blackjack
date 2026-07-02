import React from "react";

export default function GameButtons({
  gameStarted,
  dealerAnimating,
  dealerRevealed,
  showInsuranceOverlay,
  canDoubleDown,
  canSplit,
  newGame,
  resetBank,
  hit,
  stand,
  doubleDown,
  splitPair,
  showStats,
}) {
  return (
    <div className="button-grid">
      <button
        className="primary-button"
        onClick={newGame}
        disabled={gameStarted || dealerAnimating}
      >
        New Game
      </button>

      <button
        className="reset-button"
        onClick={resetBank}
        disabled={gameStarted || dealerAnimating}
      >
        Reset Bank
      </button>

      <button
        className="game-button"
        onClick={hit}
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
        onClick={stand}
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
        onClick={doubleDown}
        disabled={!canDoubleDown}
      >
        Double
      </button>

      <button
        className="split-button"
        onClick={splitPair}
        disabled={!canSplit}
      >
        Split
      </button>

      <button
        className="stats-button"
        onClick={showStats}
      >
        Stats
      </button>
    </div>
  );
}
