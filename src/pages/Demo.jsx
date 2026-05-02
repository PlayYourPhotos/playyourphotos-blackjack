import React from "react";
import Card from "../components/Card";
import { demoDeck } from "../data/demoDeck";

export default function Demo() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Demo Deck</h1>

      <div style={styles.grid}>
        {demoDeck.map((card, index) => (
          <Card
            key={index}
            rank={card.rank}
            suit={card.suit as any}
            image={card.image}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "white",
  },
  title: {
    marginBottom: "20px",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
  },
};
