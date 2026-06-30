import React from "react";
import { Link } from "react-router-dom";

const starterDecks = [
  {
    name: "Valkyra",
    cards: 54,
    category: "Fantasy Warrior Art",
    status: "Demo Deck",
    games: ["Blackjack", "Memory Match"],
  },
  {
    name: "Family Photos",
    cards: 0,
    category: "Personal",
    status: "Coming Soon",
    games: ["Blackjack", "Memory Match"],
  },
  {
    name: "Creator Deck",
    cards: 0,
    category: "Marketplace",
    status: "Coming Soon",
    games: ["Blackjack", "Solitaire", "Match"],
  },
];

export default function Platform() {
  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">PlayYourPhotos.com</p>
          <h1>Memory Deck Platform</h1>
          <p>
            Create one deck of memories, artwork, or photos — then play it
            across multiple card games.
          </p>
        </div>

        <div className="platform-actions">
          <button className="platform-primary">Create Memory Deck</button>

          <Link to="/demo" className="platform-secondary">
            Play Valkyra Blackjack
          </Link>

          <Link to="/match" className="platform-secondary">
            Play Valkyra Match
          </Link>
        </div>
      </header>

      <section className="platform-section">
        <h2>My Memory Decks</h2>

        <div className="deck-grid">
          {starterDecks.map((deck) => (
            <div className="deck-card" key={deck.name}>
              <div className="deck-cover">
                <span>{deck.name.charAt(0)}</span>
              </div>

              <div className="deck-info">
                <h3>{deck.name}</h3>
                <p>{deck.category}</p>

                <div className="deck-meta">
                  <span>{deck.cards} Cards</span>
                  <span>{deck.status}</span>
                </div>

                <div className="deck-games">
                  {deck.games.map((game) => (
                    <span key={game}>{game}</span>
                  ))}
                </div>

                {deck.name === "Valkyra" ? (
                  <div className="deck-button-stack">
                    <Link to="/demo" className="deck-play-button">
                      Play Blackjack
                    </Link>

                    <Link
                      to="/match"
                      className="deck-play-button secondary-deck-button"
                    >
                      Play Match
                    </Link>
                  </div>
                ) : (
                  <button className="deck-disabled-button" disabled>
                    Build Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="platform-section">
        <h2>Platform Direction</h2>

        <div className="platform-feature-grid">
          <div>
            <h3>1. Create</h3>
            <p>Upload photos or artwork and turn them into a Memory Deck.</p>
          </div>

          <div>
            <h3>2. Play</h3>
            <p>Use the same deck in Blackjack, Match, Solitaire and more.</p>
          </div>

          <div>
            <h3>3. Share</h3>
            <p>Share privately, publish publicly, or prepare marketplace decks.</p>
          </div>

          <div>
            <h3>4. Earn</h3>
            <p>Creators can eventually sell decks or offer subscriptions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
