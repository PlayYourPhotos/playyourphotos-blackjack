import React from "react";

export default function ResultPopup({
  showResultOverlay,
  activeResultType,
  message,
  splitMode,
  splitResults,
  playerTotal,
  dealerTotal,
  roundBet,
  balance,
  onClose,
  onDealAgain,
}) {
  if (!showResultOverlay) return null;

  function outcomeLabel(outcome) {
    if (outcome === "win") return "WIN";
    if (outcome === "lose") return "LOSE";
    return "PUSH";
  }

  return (
    <div className={`result-overlay ${activeResultType}`}>
      <div className="result-box">
        <button className="result-close" onClick={onClose}>
          ×
        </button>

        <div className="result-label">
          {activeResultType === "win"
            ? "VICTORY"
            : activeResultType === "lose"
            ? "DEFEAT"
            : "DRAW"}
        </div>

        <div className="result-message">{message}</div>

        <div className="result-scores">
          {!splitMode && (
            <>
              <div>Player: {playerTotal}</div>
              <div>Dealer: {dealerTotal}</div>
              <div>Bet: {roundBet}</div>
              <div>Balance: {balance}</div>
            </>
          )}

          {splitMode && splitResults.length > 0 && (
            <>
              <div>Dealer: {dealerTotal}</div>

              {splitResults.map((result) => (
                <div key={result.handIndex}>
                  Hand {result.handIndex + 1}: {outcomeLabel(result.outcome)} —
                  Bet {result.bet}
                </div>
              ))}

              <div>Balance: {balance}</div>
            </>
          )}
        </div>

        <button className="result-button" onClick={onDealAgain}>
          Deal Again
        </button>
      </div>
    </div>
  );
}
