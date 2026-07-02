import React from "react";

export default function BettingPanel({
  balance,
  bet,
  roundBet,
  handBets,
  activeHandIndex,
  gameStarted,
  splitMode,
  insuranceAmount,
  showInsuranceOverlay,
  dealerAnimating,
  placeBet,
}) {
  return (
    <>
      <div className="bank-box">
        <div>Balance: {balance}</div>

        <div>
          Bet: {gameStarted ? handBets[activeHandIndex] || roundBet : bet}
        </div>

        {splitMode && <div>Active Hand: {activeHandIndex + 1}</div>}

        {showInsuranceOverlay && (
          <div>Insurance: {insuranceAmount}</div>
        )}
      </div>

      <div className="chip-row">
        {[25, 50, 100, 250].map((amount) => (
          <button
            key={amount}
            className="chip-button"
            onClick={() => placeBet(amount)}
            disabled={gameStarted || dealerAnimating}
          >
            {amount}
          </button>
        ))}
      </div>
    </>
  );
}
