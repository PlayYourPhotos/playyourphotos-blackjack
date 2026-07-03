import React from "react";
import Card from "../Card";

export default function DealerHand({
  dealerHand,
  dealerRevealed,
  onOpenGallery,
}) {
  return (
    <section className="hand-section dealer-section">
      <h2>Dealer</h2>

      <div className="hand-row dealer-hand-row">
        {dealerHand.map((card, index) => (
          <Card
            key={`${card.rank}-${card.suit}-${index}`}
            rank={card.rank}
            suit={card.suit}
            image={card.image}
            faceDown={index === 1 && !dealerRevealed}
            onClick={() => onOpenGallery(dealerHand, index)}
          />
        ))}
      </div>
    </section>
  );
}
