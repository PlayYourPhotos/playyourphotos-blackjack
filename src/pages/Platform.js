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

function loadFamilyDeck() {
  try {
    const saved = localStorage.getItem(FAMILY_DECK_STORAGE_KEY);

    if (!saved) {
      return {
        cards: [],
        cardBack: null,
      };
    }

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      return {
        cards: parsed,
        cardBack: null,
      };
    }

    return {
      cards: parsed.cards || [],
      cardBack: parsed.cardBack || null,
    };
  } catch {
    return {
      cards: [],
      cardBack: null,
    };
  }
}

function saveFamilyDeck(deck) {
  localStorage.setItem(FAMILY_DECK_STORAGE_KEY, JSON.stringify(deck));
}

function fileToImage(file) {
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
  const [familyDeck, setFamilyDeck] = useState({
    cards: [],
    cardBack: null,
  });

  useEffect(() => {
    setFamilyDeck(loadFamilyDeck());
  }, []);

  async function handleFamilyPhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newCards = await Promise.all(imageFiles.map(fileToImage));

    setFamilyDeck((current) => {
      const nextDeck = {
        ...current,
        cards: [...current.cards, ...newCards],
      };

      saveFamilyDeck(nextDeck);
      return nextDeck;
    });

    event.target.value = "";
  }

  async function handleCardBackUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const uploadedBack = await fileToImage(file);

    setFamilyDeck((current) => {
      const nextDeck = {
        ...current,
        cardBack: uploadedBack,
      };

      saveFamilyDeck(nextDeck);
      return nextDeck;
    });

    event.target.value = "";
  }

  function clearFamilyPhotos() {
    setFamilyDeck((current) => {
      const nextDeck = {
        ...current,
        cards: [],
      };

      saveFamilyDeck(nextDeck);
      return nextDeck;
    });
  }

  function clearCardBack() {
    setFamilyDeck((current) => {
      const nextDeck = {
        ...current,
        cardBack: null,
      };

      saveFamilyDeck(nextDeck);
      return nextDeck;
    });
  }

  function getDeckCardCount(deck) {
    if (deck.name === "Family Photos") {
      return familyDeck.cards.length;
    }

    return deck.cards;
  }

  function getDeckStatus(deck) {
    if (deck.name === "Family Photos") {
      return familyDeck.cards.length > 0 ? "Ready to Test" : "Upload Photos";
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
                  {deck.name === "Family Photos" && familyDeck.cards[0] ? (
                    <img
                      src={familyDeck.cards[0].image}
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

                      <label className="deck-play-button secondary-deck-button">
                        Upload Card Back
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCardBackUpload}
                          hidden
                        />
                      </label>

                      <Link
                        to="/match"
                        className={`deck-play-button secondary-deck-button ${
                          familyDeck.cards.length === 0 ? "disabled-link" : ""
                        }`}
                      >
                        Test in Match
                      </Link>

                      {familyDeck.cards.length > 0 && (
                        <button
                          type="button"
                          className="deck-disabled-button"
                          onClick={clearFamilyPhotos}
                        >
                          Clear Photos
                        </button>
                      )}

                      {familyDeck.cardBack && (
                        <button
                          type="button"
                          className="deck-disabled-button"
                          onClick={clearCardBack}
                        >
                          Clear Card Back
                        </button>
                      )}
                    </div>
                  )}

                  {deck.name === "Creator Deck" && (
                    <button className="deck-disabled-button" disabled>
                      Build Soon
                    </button>
                  )}

                  {deck.name === "Family Photos" && familyDeck.cardBack && (
                    <div className="family-card-back-preview">
                      <p>Card Back</p>
                      <img
                        src={familyDeck.cardBack.image}
                        alt="Family Photos card back"
                        className="family-photo-thumb"
                      />
                    </div>
                  )}

                  {deck.name === "Family Photos" &&
                    familyDeck.cards.length > 0 && (
                      <div className="family-photo-preview-row">
                        {familyDeck.cards.slice(0, 6).map((card) => (
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
