import fullDeck from "../data/fullDeck.js";
import Card from "../components/Card";

export default function Demo() {
  return (
    <div className="demo-page">
      <h1 className="demo-title">Valkyra Full Deck</h1>

      <div className="deck-grid">
        {fullDeck.map((card, index) => (
          <Card
            key={index}
            rank={card.rank}
            suit={card.suit}
            image={card.image}
          />
        ))}
      </div>
    </div>
  );
}
