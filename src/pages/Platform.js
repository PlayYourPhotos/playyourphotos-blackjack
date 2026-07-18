import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CURRENT_DECK_STORAGE_KEY = "playYourPhotosCurrentDeck";
const LEGACY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";

const DEFAULT_DECK = {
  id: "current-deck",
  name: "Untitled Deck",
  category: "Fantasy",
  description: "",
  status: "Draft",
  cards: [],
  cardBack: null,
  updatedAt: null,
};

const STATUS_OPTIONS = [
  "Draft",
  "Ready to Test",
  "Published",
  "Archived",
];

function createDefaultDeck() {
  return {
    ...DEFAULT_DECK,
    cards: [],
    cardBack: null,
  };
}

function normaliseDeck(savedDeck) {
  if (Array.isArray(savedDeck)) {
    return {
      ...createDefaultDeck(),
      cards: savedDeck,
    };
  }

  return {
    ...createDefaultDeck(),
    ...savedDeck,
    cards: Array.isArray(savedDeck?.cards) ? savedDeck.cards : [],
    cardBack: savedDeck?.cardBack || null,
  };
}

function loadCurrentDeck() {
  try {
    const currentSavedDeck = localStorage.getItem(
      CURRENT_DECK_STORAGE_KEY
    );

    if (currentSavedDeck) {
      return normaliseDeck(JSON.parse(currentSavedDeck));
    }

    const legacySavedDeck = localStorage.getItem(
      LEGACY_DECK_STORAGE_KEY
    );

    if (legacySavedDeck) {
      const migratedDeck = normaliseDeck(
        JSON.parse(legacySavedDeck)
      );

      localStorage.setItem(
        CURRENT_DECK_STORAGE_KEY,
        JSON.stringify(migratedDeck)
      );

      return migratedDeck;
    }

    return createDefaultDeck();
  } catch (error) {
    console.error("Unable to load the current deck:", error);
    return createDefaultDeck();
  }
}

function saveCurrentDeck(deck) {
  try {
    const deckToSave = {
      ...deck,
      updatedAt: new Date().toISOString(),
    };

    const savedDeck = JSON.stringify(deckToSave);

    localStorage.setItem(CURRENT_DECK_STORAGE_KEY, savedDeck);

    /*
     * Temporary Match compatibility.
     *
     * Match.js currently reads the original Family Photos storage key.
     * Keeping this copy means the uploaded cards and card back continue
     * to work until Match.js is converted to the shared deck loader.
     */
    localStorage.setItem(LEGACY_DECK_STORAGE_KEY, savedDeck);

    return deckToSave;
  } catch (error) {
    console.error("Unable to save the current deck:", error);
    return deck;
  }
}

function createImageId(fileName) {
  const uniquePart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${uniquePart}-${fileName}`;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: createImageId(file.name),
        name: file.name,
        image: reader.result,
      });
    };

    reader.onerror = () => {
      reject(
        new Error(`Unable to read image file: ${file.name}`)
      );
    };

    reader.readAsDataURL(file);
  });
}

function formatUpdatedDate(updatedAt) {
  if (!updatedAt) {
    return "Not saved yet";
  }

  const updatedDate = new Date(updatedAt);

  if (Number.isNaN(updatedDate.getTime())) {
    return "Saved";
  }

  return updatedDate.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Platform() {
  const [currentDeck, setCurrentDeck] = useState(
    createDefaultDeck
  );

  useEffect(() => {
    setCurrentDeck(loadCurrentDeck());
  }, []);

  function updateCurrentDeck(changes) {
    setCurrentDeck((existingDeck) => {
      const nextDeck = {
        ...existingDeck,
        ...changes,
      };

      return saveCurrentDeck(nextDeck);
    });
  }

  function handleDeckFieldChange(event) {
    const { name, value } = event.target;

    updateCurrentDeck({
      [name]: value,
    });
  }

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
      const newCards = await Promise.all(
        imageFiles.map(fileToImage)
      );

      setCurrentDeck((existingDeck) => {
        const nextDeck = {
          ...existingDeck,
          cards: [...existingDeck.cards, ...newCards],
        };

        return saveCurrentDeck(nextDeck);
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

      updateCurrentDeck({
        cardBack: uploadedCardBack,
      });
    } catch (error) {
      console.error(
        "Unable to upload the card back:",
        error
      );
    }

    event.target.value = "";
  }

  function clearCards() {
    updateCurrentDeck({
      cards: [],
    });
  }

  function clearCardBack() {
    updateCurrentDeck({
      cardBack: null,
    });
  }

  function getReadinessMessage() {
    if (currentDeck.cards.length === 0) {
      return "Upload Cards";
    }

    if (!currentDeck.cardBack) {
      return "Card Back Required";
    }

    return "Ready to Test";
  }

  const currentDeckCover =
    currentDeck.cards[0]?.image || null;

  const currentDeckCanTest =
    currentDeck.cards.length > 0 &&
    Boolean(currentDeck.cardBack);

  const currentDeckDisplayName =
    currentDeck.name.trim() || "Untitled Deck";

  const currentDeckCategory =
    currentDeck.category.trim() || "Uncategorised";

  const deckReadiness = getReadinessMessage();

  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">
            Card Ledgends
          </p>

          <h1>Deck Publishing Studio</h1>

          <p>
            Create a complete illustrated card deck, upload its
            card back, preview the artwork and test the same deck
            across multiple card games.
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

          <Link
            to="/demo"
            className="platform-secondary"
          >
            Play Valkyra Blackjack
          </Link>

          <Link
            to="/match"
            className="platform-secondary"
          >
            Play Valkyra Match
          </Link>
        </div>
      </header>

      <section className="platform-section">
        <h2>My Card Decks</h2>

        <div className="deck-grid">
          <article className="deck-card">
            <div className="deck-cover">
              <span>V</span>
            </div>

            <div className="deck-info">
              <h3>Valkyra</h3>
              <p>Fantasy Warrior Art</p>

              <div className="deck-meta">
                <span>54 Cards</span>
                <span>Demo Deck</span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>Memory Match</span>
              </div>

              <div className="deck-button-stack">
                <Link
                  to="/demo"
                  className="deck-play-button"
                >
                  Play Blackjack
                </Link>

                <Link
                  to="/match"
                  className="deck-play-button secondary-deck-button"
                >
                  Play Match
                </Link>
              </div>
            </div>
          </article>

          <article className="deck-card">
            <div className="deck-cover">
              {currentDeckCover ? (
                <img
                  src={currentDeckCover}
                  alt={`${currentDeckDisplayName} cover`}
                  className="deck-cover-image"
                />
              ) : (
                <span>
                  {currentDeckDisplayName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="deck-info">
              <h3>{currentDeckDisplayName}</h3>
              <p>{currentDeckCategory}</p>

              <div className="deck-meta">
                <span>
                  {currentDeck.cards.length} Cards
                </span>
                <span>{deckReadiness}</span>
              </div>

              <div className="deck-games">
                <span>Memory Match</span>
              </div>

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
                    alt={`${currentDeckDisplayName} card back`}
                    className="family-photo-thumb"
                  />
                </div>
              )}

              {currentDeck.cards.length > 0 && (
                <div className="family-photo-preview-row">
                  {currentDeck.cards
                    .slice(0, 6)
                    .map((card) => (
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
          </article>

          <article className="deck-card">
            <div className="deck-cover">
              <span>P</span>
            </div>

            <div className="deck-info">
              <h3>Published Decks</h3>
              <p>Card Ledgends Catalogue</p>

              <div className="deck-meta">
                <span>0 Decks</span>
                <span>Coming Soon</span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>Solitaire</span>
                <span>Memory Match</span>
              </div>

              <button
                type="button"
                className="deck-disabled-button"
                disabled
              >
                Multi-Deck Catalogue Coming Next
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="platform-section">
        <h2>Current Deck Details</h2>

        <div className="platform-feature-grid">
          <div>
            <h3>Deck Name</h3>

            <input
              type="text"
              name="name"
              value={currentDeck.name}
              onChange={handleDeckFieldChange}
              placeholder="Warrior Queens"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontFamily: "inherit",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div>
            <h3>Category</h3>

            <input
              type="text"
              name="category"
              value={currentDeck.category}
              onChange={handleDeckFieldChange}
              placeholder="Fantasy"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontFamily: "inherit",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div>
            <h3>Publishing Status</h3>

            <select
              name="status"
              value={currentDeck.status}
              onChange={handleDeckFieldChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.72)",
                color: "white",
                fontFamily: "inherit",
                fontSize: "0.95rem",
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3>Project Information</h3>

            <p>
              <strong>Status:</strong>{" "}
              {currentDeck.status}
            </p>

            <p>
              <strong>Readiness:</strong>{" "}
              {deckReadiness}
            </p>

            <p>
              <strong>Last updated:</strong>{" "}
              {formatUpdatedDate(
                currentDeck.updatedAt
              )}
            </p>
          </div>
        </div>

        <div
          className="platform-feature-grid"
          style={{ marginTop: "12px" }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <h3>Deck Description</h3>

            <textarea
              name="description"
              value={currentDeck.description}
              onChange={handleDeckFieldChange}
              placeholder="Describe the artwork, theme and collection."
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "10px 12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                lineHeight: "1.4",
              }}
            />
          </div>
        </div>
      </section>

      <section className="platform-section">
        <h2>Publishing Workflow</h2>

        <div className="platform-feature-grid">
          <div>
            <h3>1. Create</h3>
            <p>
              Name the deck, choose its category and
              upload the completed artwork.
            </p>
          </div>

          <div>
            <h3>2. Preview</h3>
            <p>
              Review the deck artwork and confirm that
              the card back is ready.
            </p>
          </div>

          <div>
            <h3>3. Test</h3>
            <p>
              Test the deck in Match, Blackjack and
              future Card Ledgends games.
            </p>
          </div>

          <div>
            <h3>4. Publish</h3>
            <p>
              Add completed decks to the Card Ledgends
              subscriber catalogue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
