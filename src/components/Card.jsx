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
  const displayImage = faceDown ? "/cards/valkyra-hearts/back.jpg" : image;

  return (
    <div
      className={`card ${faceDown ? "face-down" : "face-up"}`}
      onClick={!faceDown ? onClick : undefined}
    >
      <img
        src={displayImage}
        className="card-img"
        alt={faceDown ? "Card back" : `${rank} of ${suit}`}
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
