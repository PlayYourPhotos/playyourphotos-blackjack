import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CURRENT_DECK_STORAGE_KEY = "playYourPhotosCurrentDeck";
const LEGACY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";

const CURRENT_DECK_NAME = "Current Deck";

const starterDecks = [
  {
    name: "Valkyra",
    cards: 54,
    category: "Fantasy Warrior Art",
    status: "Demo Deck",
    games: ["Blackjack", "Memory Match"],
  },
  {
    name: CURRENT_DECK_NAME,
    cards: 0,
    category: "Card Ledgends Studio",
    status: "Upload Cards",
    games: ["Memory Match"],
  },
  {
    name: "Published Decks",
    cards: 0,
    category: "Card Ledgends Catalogue",
    status: "Coming Soon",
    games: ["Blackjack", "Solitaire", "Memory Match"],
  },
];

function createEmptyDeck() {
  return {
    cards: [],
    cardBack: null,
  };
}

function normaliseDeck(parsedDeck) {
  if (Array.isArray(parsedDeck)) {
    return {
      cards: parsedDeck,
      cardBack: null,
    };
  }

  return {
    cards: Array.isArray(parsedDeck?.cards) ? parsedDeck.cards : [],
    cardBack: parsedDeck?.cardBack || null,
  };
}

function loadCurrentDeck() {
  try {
    const currentSavedDeck = localStorage.getItem(CURRENT_DECK_STORAGE_KEY);

    if (currentSavedDeck) {
      return normaliseDeck(JSON.parse(currentSavedDeck));
    }

    const legacySavedDeck = localStorage.getItem(LEGACY_DECK_STORAGE_KEY);

    if (legacySavedDeck) {
      const migratedDeck = normaliseDeck(JSON.parse(legacySavedDeck));

      localStorage.setItem(
        CURRENT_DECK_STORAGE_KEY,
        JSON.stringify(migratedDeck)
      );

      return migratedDeck;
    }

    return createEmptyDeck();
  } catch (error) {
    console.error("Unable to load the current deck:", error);
    return createEmptyDeck();
  }
}

function saveCurrentDeck(deck) {
  try {
    const savedDeck = JSON.stringify(deck);

    localStorage.setItem(CURRENT_DECK_STORAGE_KEY, savedDeck);

    /*
     * Temporary compatibility copy.
     *
     * The current Match game still reads the original Family Photos key.
     * This can be removed after Match.js is converted to the shared deck
     * loader.
     */
    localStorage.setItem(LEGACY_DECK_STORAGE_KEY, savedDeck);
  } catch (error) {
    console.error("Unable to save the current deck:", error);
  }
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${crypto.randomUUID?.() || file.name}`,
        name: file.name,
        image: reader.result,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Unable to read image file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

export default function Platform() {
  const [currentDeck, setCurrentDeck] = useState(createEmptyDeck);

  useEffect(() => {
    setCurrentDeck(loadCurrentDeck());
  }, []);

  async function handleCardUpload(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      event.target.value = "";
      return;
    }

    try {
      const newCards = await Promise.all(imageFiles.map(fileToImage));

      setCurrentDeck((existingDeck) => {
        const nextDeck = {
          ...existingDeck,
          cards: [...existingDeck.cards, ...newCards],
        };

        saveCurrentDeck(nextDeck);
        return nextDeck;
      });
    } catch (error) {
      console.error("Unable to upload cards:", error);
    }

    event.target.value = "";
  }

  async function handleCardBackUpload(event) {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    try {
      const uploadedCardBack = await fileToImage(file);

      setCurrentDeck((existingDeck) => {
        const nextDeck = {
          ...existingDeck,
          cardBack: uploadedCardBack,
        };

        saveCurrentDeck(nextDeck);
        return nextDeck;
      });
    } catch (error) {
      console.error("Unable to upload the card back:", error);
    }

    event.target.value = "";
  }

  function clearCards() {
    setCurrentDeck((existingDeck) => {
      const nextDeck = {
        ...existingDeck,
        cards: [],
      };

      saveCurrentDeck(nextDeck);
      return nextDeck;
    });
  }

  function clearCardBack() {
    setCurrentDeck((existingDeck) => {
      const nextDeck = {
        ...existingDeck,
        cardBack: null,
      };

      saveCurrentDeck(nextDeck);
      return nextDeck;
    });
  }

  function getDeckCardCount(deck) {
    if (deck.name === CURRENT_DECK_NAME) {
      return currentDeck.cards.length;
    }

    return deck.cards;
  }

  function getDeckStatus(deck) {
    if (deck.name !== CURRENT_DECK_NAME) {
      return deck.status;
    }

    if (currentDeck.cards.length === 0) {
      return "Upload Cards";
    }

    if (!currentDeck.cardBack) {
      return "Card Back Required";
    }

    return "Ready to Test";
  }

  function getCurrentDeckCover() {
    return currentDeck.cards[0]?.image || null;
  }

  const currentDeckCanTest =
    currentDeck.cards.length > 0 && Boolean(currentDeck.cardBack);

  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">Card Ledgends</p>

          <h1>Deck Publishing Studio</h1>

          <p>
            Create a complete illustrated card deck, upload its card back,
            preview the artwork and test the same deck across multiple card
            games.
          </p>
        </div>

        <div className="platform-actions">
          <label className="platform-primary">
            Upload Cards
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleCardUpload}
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
        <h2>My Card Decks</h2>

        <div className="deck-grid">
          {starterDecks.map((deck) => {
            const cardCount = getDeckCardCount(deck);
            const deckStatus = getDeckStatus(deck);
            const isCurrentDeck = deck.name === CURRENT_DECK_NAME;
            const currentDeckCover = getCurrentDeckCover();

            return (
              <article className="deck-card" key={deck.name}>
                <div className="deck-cover">
                  {isCurrentDeck && currentDeckCover ? (
                    <img
                      src={currentDeckCover}
                      alt="Current deck cover"
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

                  {isCurrentDeck && (
                    <>
                      <div className="deck-button-stack">
                        <label className="deck-play-button">
                          Upload Cards
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleCardUpload}
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

                        {currentDeckCanTest ? (
                          <Link
                            to="/match?family=1"
                            className="deck-play-button secondary-deck-button"
                          >
                            Test in Match
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="deck-disabled-button"
                            disabled
                          >
                            Add Cards and Card Back to Test
                          </button>
                        )}

                        {currentDeck.cards.length > 0 && (
                          <button
                            type="button"
                            className="deck-disabled-button"
                            onClick={clearCards}
                          >
                            Clear Cards
                          </button>
                        )}

                        {currentDeck.cardBack && (
                          <button
                            type="button"
                            className="deck-disabled-button"
                            onClick={clearCardBack}
                          >
                            Clear Card Back
                          </button>
                        )}
                      </div>

                      {currentDeck.cardBack && (
                        <div className="family-card-back-preview">
                          <p>Card Back</p>

                          <img
                            src={currentDeck.cardBack.image}
                            alt="Current deck card back"
                            className="family-photo-thumb"
                          />
                        </div>
                      )}

                      {currentDeck.cards.length > 0 && (
                        <div className="family-photo-preview-row">
                          {currentDeck.cards.slice(0, 6).map((card) => (
                            <img
                              key={card.id}
                              src={card.image}
                              alt={card.name}
                              className="family-photo-thumb"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {deck.name === "Published Decks" && (
                    <button
                      type="button"
                      className="deck-disabled-button"
                      disabled
                    >
                      Multi-Deck Catalogue Coming Next
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="platform-section">
        <h2>Publishing Workflow</h2>

        <div className="platform-feature-grid">
          <div>
            <h3>1. Create</h3>
            <p>
              Upload your completed artwork and create a new Card Ledgends
              deck.
            </p>
          </div>

          <div>
            <h3>2. Preview</h3>
            <p>
              Review the deck artwork and confirm that the card back is ready.
            </p>
          </div>

          <div>
            <h3>3. Test</h3>
            <p>
              Test the deck in Match, Blackjack and future Card Ledgends games.
            </p>
          </div>

          <div>
            <h3>4. Publish</h3>
            <p>
              Add completed decks to the Card Ledgends subscriber catalogue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
