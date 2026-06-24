import React from "react";

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

export default function Card({
  rank,
  suit,
  image,
  faceDown = false,
  onClick,
}) {
  return (
    <div
      className={`card ${faceDown ? "face-down" : "face-up"}`}
      onClick={!faceDown ? onClick : undefined}
    >
      <div className="card-inner">
        <div className="card-front">
          <img
            src={image}
            className="card-img"
            alt={`${rank} of ${suit}`}
          />

          <div className="corner top-left">
            <div className="corner-rank">{rank}</div>
            <div className="corner-suit">{suitSymbols[suit]}</div>
          </div>

          <div className="corner bottom-right">
            <div className="corner-rank">{rank}</div>
            <div className="corner-suit">{suitSymbols[suit]}</div>
          </div>
        </div>

        <div className="card-back">
          <img
            src="/cards/valkyra-hearts/back.jpg"
            className="card-img"
            alt="Card back"
          />
        </div>
      </div>
    </div>
  );
}
