import React from "react";
import Card from "../Card";

function handTotal(hand) {
  let total = hand.reduce((sum, card) => {
    if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
    if (card.rank === "A") return sum + 11;
    return sum + Number(card.rank);
  }, 0);

  let aces = hand.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function outcomeLabel(outcome) {
  if (outcome === "win") return "WIN";
  if (outcome === "lose") return "LOSE";
  return "PUSH";
}

export default function PlayerHand({
  splitMode,
  playerHands,
  activePlayerHand,
  activeHandIndex,
  completedHands,
  splitResults,
  gameStarted,
  onOpenGallery,
}) {
  return (
    <section className="hand-section player-section">
      <h2>Player</h2>

      {!splitMode && (
        <div className="hand-row player-hand-row">
          {activePlayerHand.map((card, index) => (
            <Card
              key={`${card.rank}-${card.suit}-${index}`}
              rank={card.rank}
              suit={card.suit}
              image={card.image}
              onClick={() => onOpenGallery(activePlayerHand, index)}
            />
          ))}
        </div>
      )}

      {splitMode && (
        <div className="split-hands">
          {playerHands.map((hand, handIndex) => (
            <div
              key={handIndex}
              className={`split-hand ${
                handIndex === activeHandIndex && gameStarted ? "active" : ""
              }`}
            >
              <div className="split-label">
                Hand {handIndex + 1} — {handTotal(hand)}
                {completedHands[handIndex] && " ✓"}
              </div>

              <div className="hand-row split-row">
                {hand.map((card, cardIndex) => (
                  <Card
                    key={`${card.rank}-${card.suit}-${cardIndex}`}
                    rank={card.rank}
                    suit={card.suit}
                    image={card.image}
                    onClick={() => onOpenGallery(hand, cardIndex)}
                  />
                ))}
              </div>

              {splitResults[handIndex] && (
                <div className={`split-result ${splitResults[handIndex].outcome}`}>
                  {outcomeLabel(splitResults[handIndex].outcome)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
