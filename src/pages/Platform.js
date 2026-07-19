import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DECK_LIBRARY_STORAGE_KEY = "playYourPhotosDeckLibrary";
const CURRENT_DECK_STORAGE_KEY = "playYourPhotosCurrentDeck";
const LEGACY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";
const ACTIVE_DECK_ID_STORAGE_KEY = "playYourPhotosActiveDeckId";

const SUITS = ["hearts", "diamonds", "spades", "clubs"];

const SUIT_LABELS = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  spades: "Spades",
  clubs: "Clubs",
};

const SUIT_SYMBOLS = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

const VALID_RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const STATUS_OPTIONS = [
  "Draft",
  "Ready to Test",
  "Published",
  "Archived",
];

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

function createDeckId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `deck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptySuitCards() {
  return {
    hearts: [],
    diamonds: [],
    spades: [],
    clubs: [],
  };
}

function createBlankDeck() {
  const now = new Date().toISOString();

  return {
    id: createDeckId(),
    name: "Untitled Deck",
    category: "Fantasy",
    description: "",
    status: "Draft",
    suitCards: createEmptySuitCards(),
    cardBack: null,
    createdAt: now,
    updatedAt: now,
  };
}

function getAllCards(deck) {
  if (!deck?.suitCards) {
    return [];
  }

  return SUITS.flatMap((suit) =>
    Array.isArray(deck.suitCards[suit])
      ? deck.suitCards[suit]
      : []
  );
}

function extractRankFromFileName(fileName) {
  const nameWithoutExtension = fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toUpperCase();

  const cleanedName = nameWithoutExtension
    .replace(/ACE/g, "A")
    .replace(/JACK/g, "J")
    .replace(/QUEEN/g, "Q")
    .replace(/KING/g, "K")
    .replace(/[^A-Z0-9]/g, "");

  if (VALID_RANKS.includes(cleanedName)) {
    return cleanedName;
  }

  const rankMatch = cleanedName.match(
    /(?:^|[^0-9A-Z])(10|[2-9]|A|J|Q|K)(?:$|[^0-9A-Z])/
  );

  if (rankMatch?.[1] && VALID_RANKS.includes(rankMatch[1])) {
    return rankMatch[1];
  }

  for (const rank of VALID_RANKS) {
    if (
      cleanedName === rank ||
      cleanedName.startsWith(rank) ||
      cleanedName.endsWith(rank)
    ) {
      return rank;
    }
  }

  return null;
}

function createImageId(fileName) {
  const uniquePart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${uniquePart}-${fileName}`;
}

function fileToCard(file, suit) {
  return new Promise((resolve, reject) => {
    const rank = extractRankFromFileName(file.name);

    if (!rank) {
      reject(
        new Error(
          `${file.name} does not contain a recognised rank. Use filenames such as A.jpg, 10.jpg, J.jpg, Q.jpg or K.jpg.`
        )
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: createImageId(file.name),
        name: file.name,
        image: reader.result,
        suit,
        rank,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Unable to read image file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
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
      reject(new Error(`Unable to read image file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

function sortCardsByRank(cards) {
  return [...cards].sort(
    (firstCard, secondCard) =>
      VALID_RANKS.indexOf(firstCard.rank) -
      VALID_RANKS.indexOf(secondCard.rank)
  );
}

function migrateFlatCardsToSuitCards(savedDeck) {
  const migratedSuitCards = createEmptySuitCards();

  const flatCards = Array.isArray(savedDeck?.cards)
    ? savedDeck.cards
    : [];

  flatCards.forEach((card, index) => {
    const suit = SUITS.includes(card?.suit)
      ? card.suit
      : SUITS[Math.floor(index / 13)] || "hearts";

    const detectedRank =
      card?.rank ||
      extractRankFromFileName(card?.name || "") ||
      VALID_RANKS[index % 13];

    if (!detectedRank) {
      return;
    }

    const duplicateExists = migratedSuitCards[suit].some(
      (existingCard) => existingCard.rank === detectedRank
    );

    if (!duplicateExists) {
      migratedSuitCards[suit].push({
        ...card,
        suit,
        rank: detectedRank,
      });
    }
  });

  SUITS.forEach((suit) => {
    migratedSuitCards[suit] = sortCardsByRank(
      migratedSuitCards[suit]
    );
  });

  return migratedSuitCards;
}

function normaliseDeck(savedDeck) {
  const blankDeck = createBlankDeck();

  if (Array.isArray(savedDeck)) {
    return {
      ...blankDeck,
      suitCards: migrateFlatCardsToSuitCards({
        cards: savedDeck,
      }),
    };
  }

  let suitCards = createEmptySuitCards();

  if (savedDeck?.suitCards) {
    SUITS.forEach((suit) => {
      suitCards[suit] = sortCardsByRank(
        Array.isArray(savedDeck.suitCards[suit])
          ? savedDeck.suitCards[suit].map((card) => ({
              ...card,
              suit,
              rank:
                card.rank ||
                extractRankFromFileName(card.name || ""),
            }))
          : []
      ).filter((card) => VALID_RANKS.includes(card.rank));
    });
  } else if (Array.isArray(savedDeck?.cards)) {
    suitCards = migrateFlatCardsToSuitCards(savedDeck);
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
    suitCards,
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
  const storedLibrary = loadStoredJson(DECK_LIBRARY_STORAGE_KEY);

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
    localStorage.setItem(ACTIVE_DECK_ID_STORAGE_KEY, deckId);
  } catch (error) {
    console.error("Unable to save the active deck ID:", error);
  }
}

function loadActiveDeckId() {
  try {
    return localStorage.getItem(ACTIVE_DECK_ID_STORAGE_KEY);
  } catch (error) {
    console.error("Unable to load the active deck ID:", error);
    return null;
  }
}

function loadPreviousCurrentDeck() {
  const currentDeck = loadStoredJson(CURRENT_DECK_STORAGE_KEY);

  if (currentDeck) {
    return normaliseDeck(currentDeck);
  }

  const legacyDeck = loadStoredJson(LEGACY_DECK_STORAGE_KEY);

  if (legacyDeck) {
    return normaliseDeck(legacyDeck);
  }

  return null;
}

function createMatchCompatibleDeck(deck) {
  const allCards = getAllCards(deck);

  return {
    ...deck,
    cards: allCards,
  };
}

function saveWorkingDeckForGames(deck) {
  try {
    const matchCompatibleDeck = createMatchCompatibleDeck(deck);
    const savedDeck = JSON.stringify(matchCompatibleDeck);

    localStorage.setItem(CURRENT_DECK_STORAGE_KEY, savedDeck);

    /*
     * Temporary compatibility with the current Match game.
     */
    localStorage.setItem(LEGACY_DECK_STORAGE_KEY, savedDeck);
  } catch (error) {
    console.error(
      "Unable to save the working deck for game testing:",
      error
    );
  }
}

function createDeckSnapshot(deck) {
  return JSON.stringify({
    ...deck,
    updatedAt: null,
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

function getMissingRanks(cards) {
  const uploadedRanks = new Set(cards.map((card) => card.rank));

  return VALID_RANKS.filter((rank) => !uploadedRanks.has(rank));
}

export default function Platform() {
  const [deckLibrary, setDeckLibrary] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(createBlankDeck);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState("");
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
      const previousCurrentDeck = loadPreviousCurrentDeck();

      if (previousCurrentDeck) {
        initialDeck = previousCurrentDeck;

        const alreadyInLibrary = storedLibrary.some(
          (deck) => deck.id === previousCurrentDeck.id
        );

        if (!alreadyInLibrary) {
          initialLibrary = [...storedLibrary, previousCurrentDeck];
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

    const normalisedInitialDeck = normaliseDeck(initialDeck);

    setDeckLibrary(initialLibrary.map(normaliseDeck));
    setCurrentDeck(normalisedInitialDeck);
    setSelectedDeckId(normalisedInitialDeck.id);
    setLastSavedSnapshot(createDeckSnapshot(normalisedInitialDeck));

    saveActiveDeckId(normalisedInitialDeck.id);
    saveWorkingDeckForGames(normalisedInitialDeck);
  }, []);

  useEffect(() => {
    saveWorkingDeckForGames(currentDeck);
  }, [currentDeck]);

  const allCurrentCards = useMemo(
    () => getAllCards(currentDeck),
    [currentDeck]
  );

  const hasUnsavedChanges = useMemo(
    () =>
      createDeckSnapshot(currentDeck) !== lastSavedSnapshot,
    [currentDeck, lastSavedSnapshot]
  );

  const publishedDeckCount = useMemo(
    () =>
      deckLibrary.filter(
        (deck) => deck.status === "Published"
      ).length,
    [deckLibrary]
  );

  const suitValidation = useMemo(() => {
    const result = {};

    SUITS.forEach((suit) => {
      const cards = currentDeck.suitCards?.[suit] || [];

      result[suit] = {
        count: cards.length,
        missingRanks: getMissingRanks(cards),
        complete:
          cards.length === 13 &&
          getMissingRanks(cards).length === 0,
      };
    });

    return result;
  }, [currentDeck]);

  const blackjackReady =
    SUITS.every((suit) => suitValidation[suit].complete) &&
    Boolean(currentDeck.cardBack);

  const matchReady =
    allCurrentCards.length >= 3 &&
    Boolean(currentDeck.cardBack);

  function showNotification(message) {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 4000);
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

  async function handleSuitUpload(event, suit) {
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
      const uploadResults = await Promise.allSettled(
        imageFiles.map((file) => fileToCard(file, suit))
      );

      const uploadedCards = uploadResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failedUploads = uploadResults
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message)
        .filter(Boolean);

      setCurrentDeck((existingDeck) => {
        const existingSuitCards =
          existingDeck.suitCards?.[suit] || [];

        const nextSuitCards = [...existingSuitCards];

        uploadedCards.forEach((newCard) => {
          const existingIndex = nextSuitCards.findIndex(
            (card) => card.rank === newCard.rank
          );

          if (existingIndex >= 0) {
            nextSuitCards[existingIndex] = newCard;
          } else {
            nextSuitCards.push(newCard);
          }
        });

        return {
          ...existingDeck,
          suitCards: {
            ...existingDeck.suitCards,
            [suit]: sortCardsByRank(nextSuitCards),
          },
        };
      });

      if (uploadedCards.length > 0) {
        showNotification(
          `${uploadedCards.length} ${SUIT_LABELS[suit]} card${
            uploadedCards.length === 1 ? "" : "s"
          } added. Existing ranks were replaced where necessary.`
        );
      }

      if (failedUploads.length > 0) {
        window.alert(
          `Some files were not added:\n\n${failedUploads.join("\n")}`
        );
      }
    } catch (error) {
      console.error("Unable to upload suit cards:", error);
      showNotification("The suit upload failed.");
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

      showNotification(
        "Card back added. Save the deck to keep the change."
      );
    } catch (error) {
      console.error("Unable to upload the card back:", error);
      showNotification("The card-back upload failed.");
    }

    event.target.value = "";
  }

  function handleClearSuit(suit) {
    const confirmed = window.confirm(
      `Remove all ${SUIT_LABELS[suit]} cards from this deck?`
    );

    if (!confirmed) {
      return;
    }

    setCurrentDeck((existingDeck) => ({
      ...existingDeck,
      suitCards: {
        ...existingDeck.suitCards,
        [suit]: [],
      },
    }));

    showNotification(
      `${SUIT_LABELS[suit]} cards removed. Save the deck to confirm the change.`
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
    setLastSavedSnapshot(createDeckSnapshot(newDeck));

    saveActiveDeckId(newDeck.id);
    saveWorkingDeckForGames(newDeck);

    showNotification("New blank deck created.");
  }

  function handleSaveDeck() {
    const trimmedName = currentDeck.name.trim();

    if (!trimmedName) {
      window.alert("Enter a deck name before saving.");
      return;
    }

    const now = new Date().toISOString();

    const deckToSave = {
      ...currentDeck,
      name: trimmedName,
      category:
        currentDeck.category.trim() || "Uncategorised",
      updatedAt: now,
      createdAt: currentDeck.createdAt || now,
    };

    const existingIndex = deckLibrary.findIndex(
      (deck) => deck.id === deckToSave.id
    );

    const nextLibrary =
      existingIndex >= 0
        ? deckLibrary.map((deck) =>
            deck.id === deckToSave.id ? deckToSave : deck
          )
        : [...deckLibrary, deckToSave];

    const savedSuccessfully = saveDeckLibrary(nextLibrary);

    if (!savedSuccessfully) {
      window.alert(
        "The browser could not save this deck. The uploaded images may be too large for browser storage."
      );

      return;
    }

    setDeckLibrary(nextLibrary);
    setCurrentDeck(deckToSave);
    setSelectedDeckId(deckToSave.id);
    setLastSavedSnapshot(createDeckSnapshot(deckToSave));

    saveActiveDeckId(deckToSave.id);
    saveWorkingDeckForGames(deckToSave);

    showNotification(`"${deckToSave.name}" saved successfully.`);
  }

  function handleLoadDeck() {
    if (!selectedDeckId) {
      window.alert("Select a deck to load.");
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
      window.alert("The selected deck could not be found.");
      return;
    }

    const loadedDeck = normaliseDeck(selectedDeck);

    setCurrentDeck(loadedDeck);
    setSelectedDeckId(loadedDeck.id);
    setLastSavedSnapshot(createDeckSnapshot(loadedDeck));

    saveActiveDeckId(loadedDeck.id);
    saveWorkingDeckForGames(loadedDeck);

    showNotification(`"${loadedDeck.name}" loaded.`);
  }

  function handleDeleteDeck() {
    const existingDeck = deckLibrary.find(
      (deck) => deck.id === currentDeck.id
    );

    if (!existingDeck) {
      const confirmed = window.confirm(
        "This deck has not been saved. Clear it and create a new blank deck?"
      );

      if (!confirmed) {
        return;
      }

      const newDeck = createBlankDeck();

      setCurrentDeck(newDeck);
      setSelectedDeckId(newDeck.id);
      setLastSavedSnapshot(createDeckSnapshot(newDeck));

      saveActiveDeckId(newDeck.id);
      saveWorkingDeckForGames(newDeck);

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

    if (!saveDeckLibrary(nextLibrary)) {
      window.alert("The deck library could not be updated.");
      return;
    }

    setDeckLibrary(nextLibrary);

    const nextDeck =
      nextLibrary.length > 0
        ? normaliseDeck(nextLibrary[0])
        : createBlankDeck();

    setCurrentDeck(nextDeck);
    setSelectedDeckId(nextDeck.id);
    setLastSavedSnapshot(createDeckSnapshot(nextDeck));

    saveActiveDeckId(nextDeck.id);
    saveWorkingDeckForGames(nextDeck);

    showNotification(`"${existingDeck.name}" deleted.`);
  }

  function getReadinessMessage() {
    if (allCurrentCards.length === 0) {
      return "Upload Suit Cards";
    }

    if (blackjackReady) {
      return "Blackjack Ready";
    }

    if (matchReady) {
      return "Match Ready";
    }

    if (!currentDeck.cardBack) {
      return "Card Back Required";
    }

    return `${allCurrentCards.length} / 52 Cards`;
  }

  const currentDeckCover =
    allCurrentCards[0]?.image || null;

  const currentDeckDisplayName =
    currentDeck.name.trim() || "Untitled Deck";

  const currentDeckCategory =
    currentDeck.category.trim() || "Uncategorised";

  const deckReadiness = getReadinessMessage();

  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">Card Ledgends</p>

          <h1>Deck Publishing Studio</h1>

          <p>
            Create, organise, save, test and publish complete
            illustrated card decks across multiple games.
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
            Save Deck{hasUnsavedChanges ? " *" : ""}
          </button>

          <Link to="/demo" className="platform-secondary">
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
                <span>52 Cards</span>
                <span>Demo Deck</span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>Memory Match</span>
              </div>

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
                  {currentDeckDisplayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="deck-info">
              <h3>{currentDeckDisplayName}</h3>
              <p>{currentDeckCategory}</p>

              <div className="deck-meta">
                <span>{allCurrentCards.length} / 52 Cards</span>
                <span>{deckReadiness}</span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>Memory Match</span>

                {hasUnsavedChanges && (
                  <span>Unsaved Changes</span>
                )}
              </div>

              <div className="deck-button-stack">
                <label className="deck-play-button secondary-deck-button">
                  Upload Card Back
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCardBackUpload}
                    hidden
                  />
                </label>

                {matchReady ? (
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

                {blackjackReady ? (
                  <button
                    type="button"
                    className="deck-play-button"
                    disabled
                    title="Blackjack connection will be added in the next stage."
                  >
                    Blackjack Ready
                  </button>
                ) : (
                  <button
                    type="button"
                    className="deck-disabled-button"
                    disabled
                  >
                    Blackjack Requires 52 Cards
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
                  {publishedDeckCount === 1 ? "" : "s"}
                </span>

                <span>{deckLibrary.length} Saved</span>
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
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3>Project Information</h3>

            <p>
              <strong>Status:</strong> {currentDeck.status}
            </p>

            <p>
              <strong>Readiness:</strong> {deckReadiness}
            </p>

            <p>
              <strong>Last saved:</strong>{" "}
              {formatUpdatedDate(currentDeck.updatedAt)}
            </p>
          </div>
        </div>

        <div
          className="platform-feature-grid"
          style={{ marginTop: "12px" }}
        >
          {SUITS.map((suit) => {
            const cards = currentDeck.suitCards?.[suit] || [];
            const validation = suitValidation[suit];

            return (
              <div key={suit}>
                <h3>
                  {SUIT_SYMBOLS[suit]} {SUIT_LABELS[suit]}
                </h3>

                <p>
                  <strong>{validation.count} / 13 Cards</strong>
                </p>

                <label className="deck-play-button">
                  Upload {SUIT_LABELS[suit]}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      handleSuitUpload(event, suit)
                    }
                    hidden
                  />
                </label>

                {validation.missingRanks.length > 0 ? (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "0.8rem",
                    }}
                  >
                    Missing:{" "}
                    {validation.missingRanks.join(", ")}
                  </p>
                ) : (
                  <p
                    style={{
                      marginTop: "8px",
                      color: "#ffe7a3",
                      fontWeight: "bold",
                    }}
                  >
                    Complete
                  </p>
                )}

                {cards.length > 0 && (
                  <button
                    type="button"
                    className="deck-disabled-button"
                    onClick={() => handleClearSuit(suit)}
                    style={{
                      cursor: "pointer",
                      marginTop: "8px",
                    }}
                  >
                    Clear {SUIT_LABELS[suit]}
                  </button>
                )}

                {cards.length > 0 && (
                  <div
                    className="family-photo-preview-row"
                    style={{
                      gridTemplateColumns: "repeat(4, 1fr)",
                    }}
                  >
                    {cards.slice(0, 4).map((card) => (
                      <img
                        key={card.id}
                        src={card.image}
                        alt={`${card.rank} of ${SUIT_LABELS[suit]}`}
                        className="family-photo-thumb"
                        title={`${card.rank} of ${SUIT_LABELS[suit]}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                setSelectedDeckId(event.target.value)
              }
              style={{
                ...fieldStyle,
                background: "rgba(0,0,0,0.72)",
              }}
            >
              <option value="">Select a saved deck</option>

              {deckLibrary.map((deck) => (
                <option key={deck.id} value={deck.id}>
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
              Save all four suits and deck information to the local
              Card Ledgends library.
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
            <h3>Card Back</h3>

            <p>
              {currentDeck.cardBack
                ? "Card back uploaded."
                : "No card back uploaded."}
            </p>

            <label className="deck-play-button secondary-deck-button">
              Upload Card Back
              <input
                type="file"
                accept="image/*"
                onChange={handleCardBackUpload}
                hidden
              />
            </label>

            {currentDeck.cardBack && (
              <button
                type="button"
                className="deck-disabled-button"
                onClick={clearCardBack}
                style={{
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Clear Card Back
              </button>
            )}
          </div>

          <div>
            <h3>Delete Deck</h3>

            <p>
              Permanently remove the loaded project from this
              browser.
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
      </section>
    </div>
  );
}
