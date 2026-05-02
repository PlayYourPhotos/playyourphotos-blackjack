import React from "react";
import Card from "../components/Card";
import { demoDeck } from "../data/demoDeck";
import "../styles.css";

export default function Demo() {
  return (
    <div className="demo-page">
      <h1 className="demo-title">Valkyra Hearts Deck</h1>

      <div className="card-grid">
        {demoDeck.map((card, index) => (
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
