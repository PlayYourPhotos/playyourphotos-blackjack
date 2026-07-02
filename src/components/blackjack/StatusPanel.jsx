import React from "react";

export default function StatusPanel({
  message,
  playerTotal,
  dealerTotal,
}) {
  return (
    <div className="status-box">
      <strong>{message}</strong>

      <div>Player: {playerTotal}</div>

      <div>Dealer: {dealerTotal}</div>
    </div>
  );
}
