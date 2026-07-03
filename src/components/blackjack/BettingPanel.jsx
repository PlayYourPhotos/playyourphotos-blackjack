import React from "react";

export default function BettingPanel({
  balance,
  bet,
  roundBet,
  gameStarted,
  handBets,
  activeHandIndex,
  splitMode,
  insuranceAmount,
  showInsuranceOverlay,
  dealerAnimating,
  onPlaceBet,
}) {
  const displayBet = gameStarted ? handBets[activeHandIndex] || roundBet : bet;

  return (
    <>
      <div className="bank-box">
        <div>Balance: {balance}</div>
        <div>Bet: {displayBet}</div>

        {splitMode && <div>Active Hand: {activeHandIndex + 1}</div>}

        {showInsuranceOverlay && <div>Insurance: {insuranceAmount}</div>}
      </div>

      <div className="chip-row">
        {[25, 50, 100, 250].map((amount) => (
          <button
            key={amount}
            className={`chip-button ${bet === amount ? "selected-chip" : ""}`}
            onClick={() => onPlaceBet(amount)}
            disabled={gameStarted || dealerAnimating}
          >
            {amount}
          </button>
        ))}
      </div>
    </>
  );
}
