import React from "react";
import { Link } from "react-router-dom";

export default function GameBackButton() {
  return (
    <div className="game-back-bar">
      <Link to="/platform" className="game-back-button">
        ← Back to My Memory Decks
      </Link>
    </div>
  );
}
