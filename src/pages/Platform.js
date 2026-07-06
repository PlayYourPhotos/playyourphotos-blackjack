import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FAMILY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";

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
    status: "Upload Photos",
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

function loadFamilyPhotos() {
  try {
    const saved = localStorage.getItem(FAMILY_DECK_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveFamilyPhotos(cards) {
  localStorage.setItem(FAMILY_DECK_STORAGE_KEY, JSON.stringify(cards));
}

function fileToCard(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        image: reader.result,
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Platform() {
  const [familyPhotos, setFamilyPhotos] = useState([]);

  useEffect(() => {
    setFamilyPhotos(loadFamilyPhotos());
  }, []);

  async function handleFamilyPhotoUpload(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newCards = await Promise.all(imageFiles.map(fileToCard));

    setFamilyPhotos((current) => {
      const nextCards = [...current, ...newCards];
      saveFamilyPhotos(nextCards);
      return nextCards;
    });

    event.target.value = "";
  }

  function clearFamilyPhotos() {
    setFamilyPhotos([]);
    saveFamilyPhotos([]);
  }

  function getDeckCardCount(deck) {
    if (deck.name === "Family Photos") {
      return familyPhotos.length;
    }

    return deck.cards;
  }

  function getDeckStatus(deck) {
    if (deck.name === "Family Photos") {
      return familyPhotos.length > 0 ? "Ready to Test" : "Upload Photos";
    }

    return deck.status;
  }

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
          <label className="platform-primary">
            Create Memory Deck
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFamilyPhotoUpload}
              hidden
            />
          </label>

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
          {starterDecks.map((deck) => {
            const cardCount = getDeckCardCount(deck);
            const deckStatus = getDeckStatus(deck);

            return (
              <div className="deck-card" key={deck.name}>
                <div className="deck-cover">
                  {deck.name === "Family Photos" && familyPhotos[0] ? (
                    <img
                      src={familyPhotos[0].image}
                      alt="Family Photos cover"
                      className="deck-cover-image"
                    />
                  ) : (
                    <span>{deck.name.charAt(0)}</span>
                  )}
                </div>

                <div className="deck-info">
                  <h3>{deck.name}</h3>
                  <p>{deck.category}</p>

                  <div className="deck-meta">
                    <span>{cardCount} Cards</span>
                    <span>{deckStatus}</span>
                  </div>

                  <div className="deck-games">
                    {deck.games.map((game) => (
                      <span key={game}>{game}</span>
                    ))}
                  </div>

                  {deck.name === "Valkyra" && (
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
                  )}

                  {deck.name === "Family Photos" && (
                    <div className="deck-button-stack">
                      <label className="deck-play-button">
                        Upload Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFamilyPhotoUpload}
                          hidden
                        />
                      </label>

                      <Link
                        to="/match"
                        className={`deck-play-button secondary-deck-button ${
                          familyPhotos.length === 0 ? "disabled-link" : ""
                        }`}
                      >
                        Test in Match
                      </Link>

                      {familyPhotos.length > 0 && (
                        <button
                          type="button"
                          className="deck-disabled-button"
                          onClick={clearFamilyPhotos}
                        >
                          Clear Photos
                        </button>
                      )}
                    </div>
                  )}

                  {deck.name === "Creator Deck" && (
                    <button className="deck-disabled-button" disabled>
                      Build Soon
                    </button>
                  )}

                  {deck.name === "Family Photos" && familyPhotos.length > 0 && (
                    <div className="family-photo-preview-row">
                      {familyPhotos.slice(0, 6).map((card) => (
                        <img
                          key={card.id}
                          src={card.image}
                          alt={card.name}
                          className="family-photo-thumb"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
