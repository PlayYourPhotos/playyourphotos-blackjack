import React from "react";

export default function LauncherOverlay({
  showLauncher,
  launcherText,
  launcherStep,
}) {
  if (!showLauncher) return null;

  return (
    <div className="launcher-overlay">
      <div className="launcher-box">
        <div className="launcher-kicker">MEMORY DECK</div>

        <h2>Valkyra Blackjack</h2>

        <p>{launcherText}</p>

        <div className="launcher-progress">
          <div
            className="launcher-progress-fill"
            style={{ width: `${launcherStep * 25}%` }}
          />
        </div>

        <div className="launcher-symbols">♠ ♥ ♦ ♣</div>
      </div>
    </div>
  );
}
