import React from "react";

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

export default function Card({ rank, suit, image, faceDown = false }) {
  return (
    <div className="card">
      <img
        src={faceDown ? "/cards/demo-hearts/back.jpg" : image}
        className="card-img"
        alt={`${rank} of ${suit}`}
      />

      {!faceDown && (
        <>
          <div className="corner top-left">
            <div className="corner-rank">{rank}</div>
            <div className="corner-suit">{suitSymbols[suit]}</div>
          </div>

          <div className="corner bottom-right">
            <div className="corner-rank">{rank}</div>
            <div className="corner-suit">{suitSymbols[suit]}</div>
          </div>
        </>
      )}
    </div>
  );
}
