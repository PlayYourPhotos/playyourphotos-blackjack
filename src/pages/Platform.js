import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DECK_LIBRARY_STORAGE_KEY = "playYourPhotosDeckLibrary";
const CURRENT_DECK_STORAGE_KEY = "playYourPhotosCurrentDeck";
const LEGACY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";
const ACTIVE_DECK_ID_STORAGE_KEY = "playYourPhotosActiveDeckId";

const STATUS_OPTIONS = [
  "Draft",
  "Ready to Test",
  "Published",
  "Archived",
];

function createDeckId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `deck-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createBlankDeck() {
  const now = new Date().toISOString();

  return {
    id: createDeckId(),
    name: "Untitled Deck",
    category: "Fantasy",
    description: "",
    status: "Draft",
    cards: [],
    cardBack: null,
    createdAt: now,
    updatedAt: now,
  };
}

function normaliseDeck(savedDeck) {
  const blankDeck = createBlankDeck();

  if (Array.isArray(savedDeck)) {
    return {
      ...blankDeck,
      cards: savedDeck,
    };
  }

  return {
    ...blankDeck,
    ...savedDeck,
    id: savedDeck?.id || blankDeck.id,
    name: savedDeck?.name || "Untitled Deck",
    category: savedDeck?.category || "Fantasy",
    description: savedDeck?.description || "",
    status: STATUS_OPTIONS.includes(savedDeck?.status)
      ? savedDeck.status
      : "Draft",
    cards: Array.isArray(savedDeck?.cards)
      ? savedDeck.cards
      : [],
    cardBack: savedDeck?.cardBack || null,
    createdAt: savedDeck?.createdAt || blankDeck.createdAt,
    updatedAt: savedDeck?.updatedAt || blankDeck.updatedAt,
  };
}

function loadStoredJson(storageKey) {
  try {
    const savedValue = localStorage.getItem(storageKey);

    if (!savedValue) {
      return null;
    }

    return JSON.parse(savedValue);
  } catch (error) {
    console.error(
      `Unable to read local storage key "${storageKey}":`,
      error
    );

    return null;
  }
}

function loadDeckLibrary() {
  const storedLibrary = loadStoredJson(
    DECK_LIBRARY_STORAGE_KEY
  );

  if (!Array.isArray(storedLibrary)) {
    return [];
  }

  return storedLibrary.map(normaliseDeck);
}

function saveDeckLibrary(deckLibrary) {
  try {
    localStorage.setItem(
      DECK_LIBRARY_STORAGE_KEY,
      JSON.stringify(deckLibrary)
    );

    return true;
  } catch (error) {
    console.error("Unable to save the deck library:", error);
    return false;
  }
}

function saveActiveDeckId(deckId) {
  try {
    localStorage.setItem(
      ACTIVE_DECK_ID_STORAGE_KEY,
      deckId
    );
  } catch (error) {
    console.error("Unable to save the active deck ID:", error);
  }
}

function loadActiveDeckId() {
  try {
    return localStorage.getItem(
      ACTIVE_DECK_ID_STORAGE_KEY
    );
  } catch (error) {
    console.error("Unable to load the active deck ID:", error);
    return null;
  }
}

function loadPreviousCurrentDeck() {
  const currentDeck = loadStoredJson(
    CURRENT_DECK_STORAGE_KEY
  );

  if (currentDeck) {
    return normaliseDeck(currentDeck);
  }

  const legacyDeck = loadStoredJson(
    LEGACY_DECK_STORAGE_KEY
  );

  if (legacyDeck) {
    return normaliseDeck(legacyDeck);
  }

  return null;
}

function saveWorkingDeckForGames(deck) {
  try {
    const savedDeck = JSON.stringify(deck);

    localStorage.setItem(
      CURRENT_DECK_STORAGE_KEY,
      savedDeck
    );

    /*
     * Temporary compatibility:
     * Match.js currently reads the original Family Photos key.
     */
    localStorage.setItem(
      LEGACY_DECK_STORAGE_KEY,
      savedDeck
    );
  } catch (error) {
    console.error(
      "Unable to save the working deck for game testing:",
      error
    );
  }
}

function createImageId(fileName) {
  const uniquePart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

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

function createDeckSnapshot(deck) {
  return JSON.stringify({
    ...deck,
    updatedAt: null,
  });
}

export default function Platform() {
  const [deckLibrary, setDeckLibrary] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(
    createBlankDeck
  );
  const [selectedDeckId, setSelectedDeckId] =
    useState("");
  const [lastSavedSnapshot, setLastSavedSnapshot] =
    useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const storedLibrary = loadDeckLibrary();
    const storedActiveDeckId = loadActiveDeckId();

    let initialDeck = null;
    let initialLibrary = storedLibrary;

    if (storedActiveDeckId) {
      initialDeck = storedLibrary.find(
        (deck) => deck.id === storedActiveDeckId
      );
    }

    if (!initialDeck) {
      const previousCurrentDeck =
        loadPreviousCurrentDeck();

      if (previousCurrentDeck) {
        initialDeck = previousCurrentDeck;

        const alreadyInLibrary = storedLibrary.some(
          (deck) => deck.id === previousCurrentDeck.id
        );

        if (!alreadyInLibrary) {
          initialLibrary = [
            ...storedLibrary,
            previousCurrentDeck,
          ];

          saveDeckLibrary(initialLibrary);
        }
      }
    }

    if (!initialDeck && initialLibrary.length > 0) {
      initialDeck = initialLibrary[0];
    }

    if (!initialDeck) {
      initialDeck = createBlankDeck();
    }

    setDeckLibrary(initialLibrary);
    setCurrentDeck(initialDeck);
    setSelectedDeckId(initialDeck.id);
    setLastSavedSnapshot(
      createDeckSnapshot(initialDeck)
    );

    saveActiveDeckId(initialDeck.id);
    saveWorkingDeckForGames(initialDeck);
  }, []);

  useEffect(() => {
    saveWorkingDeckForGames(currentDeck);
  }, [currentDeck]);

  const hasUnsavedChanges = useMemo(() => {
    return (
      createDeckSnapshot(currentDeck) !==
      lastSavedSnapshot
    );
  }, [currentDeck, lastSavedSnapshot]);

  const publishedDeckCount = useMemo(() => {
    return deckLibrary.filter(
      (deck) => deck.status === "Published"
    ).length;
  }, [deckLibrary]);

  function showNotification(message) {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3000);
  }

  function updateCurrentDeck(changes) {
    setCurrentDeck((existingDeck) => ({
      ...existingDeck,
      ...changes,
    }));
  }

  function handleDeckFieldChange(event) {
    const { name, value } = event.target;

    updateCurrentDeck({
      [name]: value,
    });
  }

  async function handleCardUpload(event) {
    const files = Array.from(
      event.target.files || []
    );

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

      setCurrentDeck((existingDeck) => ({
        ...existingDeck,
        cards: [
          ...existingDeck.cards,
          ...newCards,
        ],
      }));

      showNotification(
        `${newCards.length} card image${
          newCards.length === 1 ? "" : "s"
        } added. Save the deck to keep the changes.`
      );
    } catch (error) {
      console.error("Unable to upload cards:", error);
      showNotification("The card upload failed.");
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
      const uploadedCardBack =
        await fileToImage(file);

      updateCurrentDeck({
        cardBack: uploadedCardBack,
      });

      showNotification(
        "Card back added. Save the deck to keep the change."
      );
    } catch (error) {
      console.error(
        "Unable to upload the card back:",
        error
      );

      showNotification(
        "The card-back upload failed."
      );
    }

    event.target.value = "";
  }

  function clearCards() {
    const confirmed = window.confirm(
      "Remove all card images from this deck?"
    );

    if (!confirmed) {
      return;
    }

    updateCurrentDeck({
      cards: [],
    });

    showNotification(
      "Cards removed. Save the deck to confirm the change."
    );
  }

  function clearCardBack() {
    const confirmed = window.confirm(
      "Remove the card back from this deck?"
    );

    if (!confirmed) {
      return;
    }

    updateCurrentDeck({
      cardBack: null,
    });

    showNotification(
      "Card back removed. Save the deck to confirm the change."
    );
  }

  function handleNewDeck() {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "The current deck has unsaved changes. Create a new deck without saving them?"
      );

      if (!confirmed) {
        return;
      }
    }

    const newDeck = createBlankDeck();

    setCurrentDeck(newDeck);
    setSelectedDeckId(newDeck.id);
    setLastSavedSnapshot(
      createDeckSnapshot(newDeck)
    );

    saveActiveDeckId(newDeck.id);
    saveWorkingDeckForGames(newDeck);

    showNotification("New blank deck created.");
  }

  function handleSaveDeck() {
    const trimmedName = currentDeck.name.trim();

    if (!trimmedName) {
      window.alert(
        "Enter a deck name before saving."
      );

      return;
    }

    const now = new Date().toISOString();

    const deckToSave = {
      ...currentDeck,
      name: trimmedName,
      category:
        currentDeck.category.trim() ||
        "Uncategorised",
      updatedAt: now,
      createdAt:
        currentDeck.createdAt || now,
    };

    const existingIndex = deckLibrary.findIndex(
      (deck) => deck.id === deckToSave.id
    );

    let nextLibrary;

    if (existingIndex >= 0) {
      nextLibrary = deckLibrary.map((deck) =>
        deck.id === deckToSave.id
          ? deckToSave
          : deck
      );
    } else {
      nextLibrary = [
        ...deckLibrary,
        deckToSave,
      ];
    }

    const savedSuccessfully =
      saveDeckLibrary(nextLibrary);

    if (!savedSuccessfully) {
      window.alert(
        "The browser could not save this deck. The uploaded images may be too large for local storage."
      );

      return;
    }

    setDeckLibrary(nextLibrary);
    setCurrentDeck(deckToSave);
    setSelectedDeckId(deckToSave.id);
    setLastSavedSnapshot(
      createDeckSnapshot(deckToSave)
    );

    saveActiveDeckId(deckToSave.id);
    saveWorkingDeckForGames(deckToSave);

    showNotification(
      `"${deckToSave.name}" saved successfully.`
    );
  }

  function handleLoadDeck() {
    if (!selectedDeckId) {
      window.alert("Select a deck to load.");
      return;
    }

    if (
      selectedDeckId === currentDeck.id &&
      !hasUnsavedChanges
    ) {
      showNotification(
        "That deck is already loaded."
      );

      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "The current deck has unsaved changes. Load another deck without saving them?"
      );

      if (!confirmed) {
        return;
      }
    }

    const selectedDeck = deckLibrary.find(
      (deck) => deck.id === selectedDeckId
    );

    if (!selectedDeck) {
      window.alert(
        "The selected deck could not be found."
      );

      return;
    }

    const loadedDeck = normaliseDeck(
      selectedDeck
    );

    setCurrentDeck(loadedDeck);
    setSelectedDeckId(loadedDeck.id);
    setLastSavedSnapshot(
      createDeckSnapshot(loadedDeck)
    );

    saveActiveDeckId(loadedDeck.id);
    saveWorkingDeckForGames(loadedDeck);

    showNotification(
      `"${loadedDeck.name}" loaded.`
    );
  }

  function handleDeleteDeck() {
    const existingDeck = deckLibrary.find(
      (deck) => deck.id === currentDeck.id
    );

    if (!existingDeck) {
      const confirmed = window.confirm(
        "This unsaved deck has not been added to the library. Clear it and create a new blank deck?"
      );

      if (!confirmed) {
        return;
      }

      handleNewDeck();
      return;
    }

    const confirmed = window.confirm(
      `Delete "${existingDeck.name}" permanently from this browser?`
    );

    if (!confirmed) {
      return;
    }

    const nextLibrary = deckLibrary.filter(
      (deck) => deck.id !== existingDeck.id
    );

    const savedSuccessfully =
      saveDeckLibrary(nextLibrary);

    if (!savedSuccessfully) {
      window.alert(
        "The deck library could not be updated."
      );

      return;
    }

    setDeckLibrary(nextLibrary);

    const nextDeck =
      nextLibrary[0] || createBlankDeck();

    setCurrentDeck(nextDeck);
    setSelectedDeckId(nextDeck.id);
    setLastSavedSnapshot(
      createDeckSnapshot(nextDeck)
    );

    saveActiveDeckId(nextDeck.id);
    saveWorkingDeckForGames(nextDeck);

    showNotification(
      `"${existingDeck.name}" deleted.`
    );
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
    currentDeck.name.trim() ||
    "Untitled Deck";

  const currentDeckCategory =
    currentDeck.category.trim() ||
    "Uncategorised";

  const deckReadiness =
    getReadinessMessage();

  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">
            Card Ledgends
          </p>

          <h1>Deck Publishing Studio</h1>

          <p>
            Create, save, load, test and publish
            illustrated card decks across multiple
            games.
          </p>

          {notification && (
            <p
              style={{
                marginTop: "10px",
                color: "#ffe7a3",
                fontWeight: "bold",
              }}
            >
              {notification}
            </p>
          )}
        </div>

        <div className="platform-actions">
          <button
            type="button"
            className="platform-primary"
            onClick={handleNewDeck}
          >
            + New Deck
          </button>

          <button
            type="button"
            className="platform-secondary"
            onClick={handleSaveDeck}
          >
            Save Deck
            {hasUnsavedChanges ? " *" : ""}
          </button>

          <Link
            to="/demo"
            className="platform-secondary"
          >
            Play Valkyra Blackjack
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

                {hasUnsavedChanges && (
                  <span>Unsaved Changes</span>
                )}
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
              </div>
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
                <span>
                  {publishedDeckCount} Deck
                  {publishedDeckCount === 1
                    ? ""
                    : "s"}
                </span>

                <span>
                  {deckLibrary.length} Saved
                </span>
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
                Catalogue View Coming Next
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="platform-section">
        <h2>Deck Editor</h2>

        <div className="platform-feature-grid">
          <div>
            <h3>Deck Name</h3>

            <input
              type="text"
              name="name"
              value={currentDeck.name}
              onChange={handleDeckFieldChange}
              placeholder="Warrior Queens"
              style={fieldStyle}
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
              style={fieldStyle}
            />
          </div>

          <div>
            <h3>Publishing Status</h3>

            <select
              name="status"
              value={currentDeck.status}
              onChange={handleDeckFieldChange}
              style={{
                ...fieldStyle,
                background: "rgba(0,0,0,0.72)",
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
              <strong>Last saved:</strong>{" "}
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
          <div>
            <h3>Load Saved Deck</h3>

            <select
              value={selectedDeckId}
              onChange={(event) =>
                setSelectedDeckId(
                  event.target.value
                )
              }
              style={{
                ...fieldStyle,
                background: "rgba(0,0,0,0.72)",
              }}
            >
              <option value="">
                Select a saved deck
              </option>

              {deckLibrary.map((deck) => (
                <option
                  key={deck.id}
                  value={deck.id}
                >
                  {deck.name} — {deck.status}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="deck-play-button secondary-deck-button"
              onClick={handleLoadDeck}
              style={{ marginTop: "8px" }}
            >
              Load Deck
            </button>
          </div>

          <div>
            <h3>Save Current Deck</h3>

            <p>
              Save this project to the local Card
              Ledgends deck library.
            </p>

            <button
              type="button"
              className="deck-play-button"
              onClick={handleSaveDeck}
            >
              Save Deck
            </button>
          </div>

          <div>
            <h3>Create New Deck</h3>

            <p>
              Start a new blank project without
              changing saved decks.
            </p>

            <button
              type="button"
              className="deck-play-button secondary-deck-button"
              onClick={handleNewDeck}
            >
              + New Deck
            </button>
          </div>

          <div>
            <h3>Delete Deck</h3>

            <p>
              Permanently remove the loaded project
              from this browser.
            </p>

            <button
              type="button"
              className="deck-disabled-button"
              onClick={handleDeleteDeck}
              style={{ cursor: "pointer" }}
            >
              Delete Deck
            </button>
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
                ...fieldStyle,
                resize: "vertical",
                lineHeight: "1.4",
              }}
            />
          </div>
        </div>

        {(currentDeck.cards.length > 0 ||
          currentDeck.cardBack) && (
          <div
            className="platform-feature-grid"
            style={{ marginTop: "12px" }}
          >
            <div>
              <h3>Deck Artwork</h3>

              <p>
                {currentDeck.cards.length} card image
                {currentDeck.cards.length === 1
                  ? ""
                  : "s"}{" "}
                uploaded.
              </p>

              {currentDeck.cards.length > 0 && (
                <button
                  type="button"
                  className="deck-disabled-button"
                  onClick={clearCards}
                  style={{ cursor: "pointer" }}
                >
                  Clear Cards
                </button>
              )}
            </div>

            <div>
              <h3>Card Back</h3>

              <p>
                {currentDeck.cardBack
                  ? "Card back uploaded."
                  : "No card back uploaded."}
              </p>

              {currentDeck.cardBack && (
                <button
                  type="button"
                  className="deck-disabled-button"
                  onClick={clearCardBack}
                  style={{ cursor: "pointer" }}
                >
                  Clear Card Back
                </button>
              )}
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <h3>Artwork Preview</h3>

              {currentDeck.cardBack && (
                <div className="family-card-back-preview">
                  <p>Card Back</p>

                  <img
                    src={
                      currentDeck.cardBack.image
                    }
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
          </div>
        )}
      </section>
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  fontFamily: "inherit",
  fontSize: "0.95rem",
};
