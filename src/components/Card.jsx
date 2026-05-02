import React from "react";

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

const suitColors = {
  hearts: "#ff4d4d",
  diamonds: "#ff4d4d",
  spades: "#ffffff",
  clubs: "#ffffff",
};

export default function Card({
  rank,
  suit,
  image,
  faceDown = false,
}) {
  return (
    <div className="card">
      <img
        src={faceDown ? "/cards/demo-hearts/back.jpg" : image}
        className="card-img"
        alt={`${rank} of ${suit}`}
      />

      {!faceDown && (
        <>
          <div
            className="corner top-left"
            style={{ color: suitColors[suit] }}
          >
            {rank}
            <span>{suitSymbols[suit]}</span>
          </div>

          <div
            className="corner bottom-right"
            style={{ color: suitColors[suit] }}
          >
            {rank}
            <span>{suitSymbols[suit]}</span>
          </div>
        </>
      )}
    </div>
  );
}
