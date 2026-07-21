import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  deleteDeckImage,
  deleteDeckImages,
  deleteDeckImagesBySuit,
  getDeckImages,
  replaceCardBack,
  replaceSuitCard,
} from "../data/deckImageDB";

const DECK_LIBRARY_STORAGE_KEY =
  "playYourPhotosDeckLibrary";

const CURRENT_DECK_STORAGE_KEY =
  "playYourPhotosCurrentDeck";

const LEGACY_DECK_STORAGE_KEY =
  "playYourPhotosFamilyDeck";

const ACTIVE_DECK_ID_STORAGE_KEY =
  "playYourPhotosActiveDeckId";

const SUITS = [
  "hearts",
  "diamonds",
  "spades",
  "clubs",
];

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

  return `deck-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createImageId(fileName) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${crypto.randomUUID()}-${fileName}`;
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${fileName}`;
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

function extractRankFromFileName(fileName) {
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toUpperCase();

  const directName = baseName
    .replace(/ACE/g, "A")
    .replace(/JACK/g, "J")
    .replace(/QUEEN/g, "Q")
    .replace(/KING/g, "K")
    .replace(/[^A-Z0-9]/g, "");

  if (VALID_RANKS.includes(directName)) {
    return directName;
  }

  const separatedParts = baseName
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  for (const part of separatedParts) {
    const normalisedPart = part
      .replace(/^ACE$/, "A")
      .replace(/^JACK$/, "J")
      .replace(/^QUEEN$/, "Q")
      .replace(/^KING$/, "K");

    if (VALID_RANKS.includes(normalisedPart)) {
      return normalisedPart;
    }
  }

  const endingMatch = directName.match(
    /(10|[2-9]|A|J|Q|K)$/
  );

  if (
    endingMatch?.[1] &&
    VALID_RANKS.includes(endingMatch[1])
  ) {
    return endingMatch[1];
  }

  const startingMatch = directName.match(
    /^(10|[2-9]|A|J|Q|K)/
  );

  if (
    startingMatch?.[1] &&
    VALID_RANKS.includes(startingMatch[1])
  ) {
    return startingMatch[1];
  }

  return null;
}

function sortCardsByRank(cards) {
  return [...cards].sort(
    (firstCard, secondCard) =>
      VALID_RANKS.indexOf(firstCard.rank) -
      VALID_RANKS.indexOf(secondCard.rank)
  );
}

function sanitiseCardReference(card, suit) {
  if (!card) {
    return null;
  }

  const rank =
    card.rank ||
    extractRankFromFileName(card.name || "");

  if (!VALID_RANKS.includes(rank)) {
    return null;
  }

  return {
    id: card.id,
    name: card.name || `${rank}.jpg`,
    suit,
    rank,
  };
}

function normaliseDeck(savedDeck) {
  const blankDeck = createBlankDeck();

  if (!savedDeck || Array.isArray(savedDeck)) {
    return blankDeck;
  }

  const suitCards = createEmptySuitCards();

  SUITS.forEach((suit) => {
    const cards = Array.isArray(
      savedDeck?.suitCards?.[suit]
    )
      ? savedDeck.suitCards[suit]
      : [];

    const uniqueCards = new Map();

    cards.forEach((card) => {
      const sanitisedCard =
        sanitiseCardReference(card, suit);

      if (
        sanitisedCard?.id &&
        sanitisedCard?.rank
      ) {
        uniqueCards.set(
          sanitisedCard.rank,
          sanitisedCard
        );
      }
    });

    suitCards[suit] = sortCardsByRank(
      Array.from(uniqueCards.values())
    );
  });

  const cardBack = savedDeck.cardBack?.id
    ? {
        id: savedDeck.cardBack.id,
        name:
          savedDeck.cardBack.name ||
          "card-back.jpg",
      }
    : null;

  return {
    id: savedDeck.id || blankDeck.id,
    name:
      savedDeck.name ||
      "Untitled Deck",
    category:
      savedDeck.category ||
      "Fantasy",
    description:
      savedDeck.description ||
      "",
    status: STATUS_OPTIONS.includes(
      savedDeck.status
    )
      ? savedDeck.status
      : "Draft",
    suitCards,
    cardBack,
    createdAt:
      savedDeck.createdAt ||
      blankDeck.createdAt,
    updatedAt:
      savedDeck.updatedAt ||
      blankDeck.updatedAt,
  };
}

function loadStoredJson(storageKey) {
  try {
    const savedValue =
      localStorage.getItem(storageKey);

    if (!savedValue) {
      return null;
    }

    return JSON.parse(savedValue);
  } catch (error) {
    console.error(
      `Unable to read "${storageKey}":`,
      error
    );

    return null;
  }
}

function prepareLibraryForStorage(deckLibrary) {
  return deckLibrary.map((deck) =>
    normaliseDeck(deck)
  );
}

function saveDeckLibrary(deckLibrary) {
  const lightweightLibrary =
    prepareLibraryForStorage(deckLibrary);

  try {
    localStorage.setItem(
      DECK_LIBRARY_STORAGE_KEY,
      JSON.stringify(lightweightLibrary)
    );

    return true;
  } catch (firstError) {
    console.error(
      "Initial deck-library save failed:",
      firstError
    );

    try {
      /*
       * Remove the large legacy base64 copies and retry.
       */
      localStorage.removeItem(
        CURRENT_DECK_STORAGE_KEY
      );

      localStorage.removeItem(
        LEGACY_DECK_STORAGE_KEY
      );

      localStorage.setItem(
        DECK_LIBRARY_STORAGE_KEY,
        JSON.stringify(lightweightLibrary)
      );

      return true;
    } catch (secondError) {
      console.error(
        "Deck-library retry failed:",
        secondError
      );

      return false;
    }
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

function loadActiveDeckId() {
  try {
    return localStorage.getItem(
      ACTIVE_DECK_ID_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "Unable to load active deck ID:",
      error
    );

    return null;
  }
}

function saveActiveDeckId(deckId) {
  try {
    localStorage.setItem(
      ACTIVE_DECK_ID_STORAGE_KEY,
      deckId
    );
  } catch (error) {
    console.error(
      "Unable to save active deck ID:",
      error
    );
  }
}

function createDeckSnapshot(deck) {
  return JSON.stringify({
    ...normaliseDeck(deck),
    updatedAt: null,
  });
}

function getAllCards(deck) {
  return SUITS.flatMap((suit) =>
    Array.isArray(deck?.suitCards?.[suit])
      ? deck.suitCards[suit]
      : []
  );
}

function getMissingRanks(cards) {
  const uploadedRanks = new Set(
    cards.map((card) => card.rank)
  );

  return VALID_RANKS.filter(
    (rank) => !uploadedRanks.has(rank)
  );
}

function formatUpdatedDate(updatedAt) {
  if (!updatedAt) {
    return "Not saved yet";
  }

  const updatedDate = new Date(updatedAt);

  if (
    Number.isNaN(updatedDate.getTime())
  ) {
    return "Saved";
  }

  return updatedDate.toLocaleString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function revokeUrlMap(urlMap) {
  Object.values(urlMap).forEach((url) => {
    if (
      typeof url === "string" &&
      url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(url);
    }
  });
}
export default function Platform() {
  const [
    deckLibrary,
    setDeckLibrary,
  ] = useState([]);

  const [
    currentDeck,
    setCurrentDeck,
  ] = useState(createBlankDeck);

  const [
    selectedDeckId,
    setSelectedDeckId,
  ] = useState("");

  const [
    lastSavedSnapshot,
    setLastSavedSnapshot,
  ] = useState("");

  const [
    notification,
    setNotification,
  ] = useState("");

  const [
    imageUrls,
    setImageUrls,
  ] = useState({});

  const [
    imagesLoading,
    setImagesLoading,
  ] = useState(false);

  const notificationTimerRef =
    useRef(null);

  const imageUrlsRef =
    useRef({});

  useEffect(() => {
    const storedLibrary =
      loadDeckLibrary();

    const storedActiveDeckId =
      loadActiveDeckId();

    let initialDeck =
      storedLibrary.find(
        (deck) =>
          deck.id ===
          storedActiveDeckId
      ) || storedLibrary[0];

    if (!initialDeck) {
      initialDeck = createBlankDeck();
    }

    const normalisedDeck =
      normaliseDeck(initialDeck);

    setDeckLibrary(storedLibrary);
    setCurrentDeck(normalisedDeck);
    setSelectedDeckId(
      normalisedDeck.id
    );
    setLastSavedSnapshot(
      createDeckSnapshot(
        normalisedDeck
      )
    );

    saveActiveDeckId(
      normalisedDeck.id
    );

    /*
     * Remove earlier base64 deck copies.
     * They are no longer used as permanent storage.
     */
    try {
      localStorage.removeItem(
        CURRENT_DECK_STORAGE_KEY
      );

      localStorage.removeItem(
        LEGACY_DECK_STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "Unable to remove legacy deck records:",
        error
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentDeckImages() {
      setImagesLoading(true);

      try {
        const imageRecords =
          await getDeckImages(
            currentDeck.id
          );

        const nextUrls = {};

        imageRecords.forEach(
          (imageRecord) => {
            if (imageRecord.blob) {
              nextUrls[imageRecord.id] =
                URL.createObjectURL(
                  imageRecord.blob
                );
            }
          }
        );

        if (cancelled) {
          revokeUrlMap(nextUrls);
          return;
        }

        revokeUrlMap(
          imageUrlsRef.current
        );

        imageUrlsRef.current =
          nextUrls;

        setImageUrls(nextUrls);
      } catch (error) {
        console.error(
          "Unable to load deck images:",
          error
        );

        if (!cancelled) {
          setImageUrls({});
        }
      } finally {
        if (!cancelled) {
          setImagesLoading(false);
        }
      }
    }

    loadCurrentDeckImages();

    return () => {
      cancelled = true;
    };
  }, [currentDeck.id]);

  useEffect(() => {
    return () => {
      if (
        notificationTimerRef.current
      ) {
        window.clearTimeout(
          notificationTimerRef.current
        );
      }

      revokeUrlMap(
        imageUrlsRef.current
      );
    };
  }, []);

  const allCurrentCards = useMemo(
    () => getAllCards(currentDeck),
    [currentDeck]
  );

  const hasUnsavedChanges =
    useMemo(
      () =>
        createDeckSnapshot(
          currentDeck
        ) !== lastSavedSnapshot,
      [
        currentDeck,
        lastSavedSnapshot,
      ]
    );

  const publishedDeckCount =
    useMemo(
      () =>
        deckLibrary.filter(
          (deck) =>
            deck.status ===
            "Published"
        ).length,
      [deckLibrary]
    );

  const suitValidation = useMemo(
    () => {
      const validation = {};

      SUITS.forEach((suit) => {
        const cards =
          currentDeck.suitCards?.[
            suit
          ] || [];

        const missingRanks =
          getMissingRanks(cards);

        validation[suit] = {
          count: cards.length,
          missingRanks,
          complete:
            cards.length === 13 &&
            missingRanks.length === 0,
        };
      });

      return validation;
    },
    [currentDeck]
  );

  const blackjackReady =
    SUITS.every(
      (suit) =>
        suitValidation[suit]
          .complete
    ) &&
    Boolean(currentDeck.cardBack);

  const matchReady =
    allCurrentCards.length >= 3 &&
    Boolean(currentDeck.cardBack);

  function showNotification(message) {
    setNotification(message);

    if (
      notificationTimerRef.current
    ) {
      window.clearTimeout(
        notificationTimerRef.current
      );
    }

    notificationTimerRef.current =
      window.setTimeout(() => {
        setNotification("");
      }, 4000);
  }

  function updateCurrentDeck(changes) {
    setCurrentDeck(
      (existingDeck) => ({
        ...existingDeck,
        ...changes,
      })
    );
  }

  function handleDeckFieldChange(
    event
  ) {
    const { name, value } =
      event.target;

    updateCurrentDeck({
      [name]: value,
    });
  }

  async function refreshImageUrls() {
    const imageRecords =
      await getDeckImages(
        currentDeck.id
      );

    const nextUrls = {};

    imageRecords.forEach(
      (imageRecord) => {
        if (imageRecord.blob) {
          nextUrls[imageRecord.id] =
            URL.createObjectURL(
              imageRecord.blob
            );
        }
      }
    );

    revokeUrlMap(
      imageUrlsRef.current
    );

    imageUrlsRef.current =
      nextUrls;

    setImageUrls(nextUrls);
  }

  async function handleSuitUpload(
    event,
    suit
  ) {
    const files = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const imageFiles = files.filter(
      (file) =>
        file.type.startsWith(
          "image/"
        )
    );

    if (imageFiles.length === 0) {
      return;
    }

    const validFiles = [];
    const invalidFileNames = [];

    imageFiles.forEach((file) => {
      const rank =
        extractRankFromFileName(
          file.name
        );

      if (rank) {
        validFiles.push({
          file,
          rank,
        });
      } else {
        invalidFileNames.push(
          file.name
        );
      }
    });

    if (validFiles.length === 0) {
      window.alert(
        "No recognised card ranks were found. Use filenames such as A.jpg, 10.jpg, J.jpg, Q.jpg and K.jpg."
      );

      return;
    }

    try {
      setImagesLoading(true);

      const newCardReferences = [];

      for (const {
        file,
        rank,
      } of validFiles) {
        const imageId =
          createImageId(file.name);

        const imageReference =
          await replaceSuitCard({
            deckId:
              currentDeck.id,
            suit,
            rank,
            file,
            imageId,
          });

        newCardReferences.push(
          imageReference
        );
      }

      setCurrentDeck(
        (existingDeck) => {
          const existingCards =
            existingDeck.suitCards?.[
              suit
            ] || [];

          const cardsByRank =
            new Map(
              existingCards.map(
                (card) => [
                  card.rank,
                  card,
                ]
              )
            );

          newCardReferences.forEach(
            (cardReference) => {
              cardsByRank.set(
                cardReference.rank,
                {
                  id:
                    cardReference.id,
                  name:
                    cardReference.name,
                  suit,
                  rank:
                    cardReference.rank,
                }
              );
            }
          );

          return {
            ...existingDeck,
            suitCards: {
              ...existingDeck.suitCards,
              [suit]:
                sortCardsByRank(
                  Array.from(
                    cardsByRank.values()
                  )
                ),
            },
          };
        }
      );

      await refreshImageUrls();

      showNotification(
        `${newCardReferences.length} ${
          SUIT_LABELS[suit]
        } card${
          newCardReferences.length ===
          1
            ? ""
            : "s"
        } saved to IndexedDB.`
      );

      if (
        invalidFileNames.length >
        0
      ) {
        window.alert(
          `These files were skipped because no rank could be identified:\n\n${invalidFileNames.join(
            "\n"
          )}`
        );
      }
    } catch (error) {
      console.error(
        "Unable to upload suit cards:",
        error
      );

      window.alert(
        `The ${SUIT_LABELS[suit]} upload failed: ${error.message}`
      );
    } finally {
      setImagesLoading(false);
    }
  }

  async function handleCardBackUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (
      !file ||
      !file.type.startsWith(
        "image/"
      )
    ) {
      return;
    }

    try {
      setImagesLoading(true);

      const imageId =
        createImageId(file.name);

      const cardBackReference =
        await replaceCardBack({
          deckId:
            currentDeck.id,
          file,
          imageId,
        });

      updateCurrentDeck({
        cardBack: {
          id:
            cardBackReference.id,
          name:
            cardBackReference.name,
        },
      });

      await refreshImageUrls();

      showNotification(
        "Card back saved to IndexedDB."
      );
    } catch (error) {
      console.error(
        "Unable to upload card back:",
        error
      );

      window.alert(
        `The card-back upload failed: ${error.message}`
      );
    } finally {
      setImagesLoading(false);
    }
  }

  async function handleClearSuit(
    suit
  ) {
    const confirmed =
      window.confirm(
        `Remove all ${SUIT_LABELS[suit]} cards from this deck?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setImagesLoading(true);

      await deleteDeckImagesBySuit(
        currentDeck.id,
        suit
      );

      setCurrentDeck(
        (existingDeck) => ({
          ...existingDeck,
          suitCards: {
            ...existingDeck.suitCards,
            [suit]: [],
          },
        })
      );

      await refreshImageUrls();

      showNotification(
        `${SUIT_LABELS[suit]} cards removed.`
      );
    } catch (error) {
      console.error(
        "Unable to clear suit:",
        error
      );

      window.alert(
        `The ${SUIT_LABELS[suit]} cards could not be removed.`
      );
    } finally {
      setImagesLoading(false);
    }
  }

  async function clearCardBack() {
    const confirmed =
      window.confirm(
        "Remove the card back from this deck?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setImagesLoading(true);

      if (
        currentDeck.cardBack?.id
      ) {
        await deleteDeckImage(
          currentDeck.cardBack.id
        );
      }

      updateCurrentDeck({
        cardBack: null,
      });

      await refreshImageUrls();

      showNotification(
        "Card back removed."
      );
    } catch (error) {
      console.error(
        "Unable to remove card back:",
        error
      );

      window.alert(
        "The card back could not be removed."
      );
    } finally {
      setImagesLoading(false);
    }
  }
    async function handleRemoveCard(
    suit,
    card
  ) {
    const confirmed =
      window.confirm(
        `Remove ${card.rank} of ${SUIT_LABELS[suit]} from this deck?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setImagesLoading(true);

      if (card.id) {
        await deleteDeckImage(
          card.id
        );
      }

      setCurrentDeck(
        (existingDeck) => ({
          ...existingDeck,
          suitCards: {
            ...existingDeck.suitCards,
            [suit]:
              existingDeck.suitCards[
                suit
              ].filter(
                (existingCard) =>
                  existingCard.id !==
                  card.id
              ),
          },
        })
      );

      await refreshImageUrls();

      showNotification(
        `${card.rank} of ${SUIT_LABELS[suit]} removed.`
      );
    } catch (error) {
      console.error(
        "Unable to remove card:",
        error
      );

      window.alert(
        "The card could not be removed."
      );
    } finally {
      setImagesLoading(false);
    }
  }

  function handleSaveDeck() {
    const now =
      new Date().toISOString();

    const deckToSave =
      normaliseDeck({
        ...currentDeck,
        name:
          currentDeck.name.trim() ||
          "Untitled Deck",
        updatedAt: now,
      });

    const existingIndex =
      deckLibrary.findIndex(
        (deck) =>
          deck.id ===
          deckToSave.id
      );

    let nextLibrary;

    if (existingIndex >= 0) {
      nextLibrary = [
        ...deckLibrary,
      ];

      nextLibrary[
        existingIndex
      ] = deckToSave;
    } else {
      nextLibrary = [
        ...deckLibrary,
        deckToSave,
      ];
    }

    const saved =
      saveDeckLibrary(
        nextLibrary
      );

    if (!saved) {
      window.alert(
        "The deck images are safely stored in IndexedDB, but the lightweight deck library could not be saved in browser storage."
      );

      return;
    }

    setDeckLibrary(nextLibrary);
    setCurrentDeck(deckToSave);
    setSelectedDeckId(
      deckToSave.id
    );
    setLastSavedSnapshot(
      createDeckSnapshot(
        deckToSave
      )
    );

    saveActiveDeckId(
      deckToSave.id
    );

    showNotification(
      `"${deckToSave.name}" saved.`
    );
  }

  function handleCreateNewDeck() {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Create a new deck anyway?"
      )
    ) {
      return;
    }

    const blankDeck =
      createBlankDeck();

    setCurrentDeck(blankDeck);
    setSelectedDeckId(
      blankDeck.id
    );
    setLastSavedSnapshot(
      createDeckSnapshot(
        blankDeck
      )
    );

    saveActiveDeckId(
      blankDeck.id
    );

    showNotification(
      "New blank deck created."
    );
  }

  function handleLoadSelectedDeck() {
    const selectedDeck =
      deckLibrary.find(
        (deck) =>
          deck.id ===
          selectedDeckId
      );

    if (!selectedDeck) {
      window.alert(
        "Select a saved deck first."
      );

      return;
    }

    if (
      hasUnsavedChanges &&
      currentDeck.id !==
        selectedDeck.id &&
      !window.confirm(
        "You have unsaved changes. Load the selected deck anyway?"
      )
    ) {
      return;
    }

    const deckToLoad =
      normaliseDeck(
        selectedDeck
      );

    setCurrentDeck(deckToLoad);
    setLastSavedSnapshot(
      createDeckSnapshot(
        deckToLoad
      )
    );

    saveActiveDeckId(
      deckToLoad.id
    );

    showNotification(
      `"${deckToLoad.name}" loaded.`
    );
  }

  async function handleDeleteCurrentDeck() {
    const savedDeck =
      deckLibrary.find(
        (deck) =>
          deck.id ===
          currentDeck.id
      );

    if (!savedDeck) {
      window.alert(
        "This deck has not been saved yet."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${savedDeck.name}" and all of its stored images?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setImagesLoading(true);

      await deleteDeckImages(
        savedDeck.id
      );

      const nextLibrary =
        deckLibrary.filter(
          (deck) =>
            deck.id !==
            savedDeck.id
        );

      const saved =
        saveDeckLibrary(
          nextLibrary
        );

      if (!saved) {
        window.alert(
          "The deck images were removed, but the browser deck library could not be updated."
        );

        return;
      }

      setDeckLibrary(nextLibrary);

      const nextDeck =
        nextLibrary[0]
          ? normaliseDeck(
              nextLibrary[0]
            )
          : createBlankDeck();

      setCurrentDeck(nextDeck);
      setSelectedDeckId(
        nextDeck.id
      );
      setLastSavedSnapshot(
        createDeckSnapshot(
          nextDeck
        )
      );

      saveActiveDeckId(
        nextDeck.id
      );

      showNotification(
        `"${savedDeck.name}" deleted.`
      );
    } catch (error) {
      console.error(
        "Unable to delete deck:",
        error
      );

      window.alert(
        "The deck could not be deleted."
      );
    } finally {
      setImagesLoading(false);
    }
  }

  function saveDeckForMatch() {
    if (!matchReady) {
      return false;
    }

    saveActiveDeckId(
      currentDeck.id
    );

    return true;
  }

  function handleTestMatch(
    event
  ) {
    if (!saveDeckForMatch()) {
      event.preventDefault();

      window.alert(
        "The deck could not be prepared for Match."
      );
    }
  }

  function handleTestBlackjack(
    event
  ) {
    const savedDeck =
      deckLibrary.find(
        (deck) =>
          deck.id ===
          currentDeck.id
      );

    if (!savedDeck) {
      event.preventDefault();

      window.alert(
        "Save this deck before testing it in Blackjack."
      );

      return;
    }

    if (hasUnsavedChanges) {
      event.preventDefault();

      window.alert(
        "Save the current deck changes before testing it in Blackjack."
      );

      return;
    }

    saveActiveDeckId(
      currentDeck.id
    );
  }

  function getReadinessMessage() {
    if (blackjackReady) {
      return "This deck is ready for Blackjack.";
    }

    if (!currentDeck.cardBack) {
      return "Upload a card back before testing this deck.";
    }

    const incompleteSuits =
      SUITS.filter(
        (suit) =>
          !suitValidation[suit]
            .complete
      );

    if (
      incompleteSuits.length >
      0
    ) {
      return `Complete all four suits for Blackjack: ${incompleteSuits
        .map(
          (suit) =>
            SUIT_LABELS[suit]
        )
        .join(", ")}.`;
    }

    return "This deck is not ready for Blackjack.";
  }

  const currentDeckSaved =
    deckLibrary.some(
      (deck) =>
        deck.id ===
        currentDeck.id
    );

  return (
    <div className="platform-page">
      <header className="platform-header">
        <div>
          <div className="platform-eyebrow">
            PlayYourPhotos Platform
          </div>

          <h1>
            Memory Deck Creator
          </h1>

          <p>
            Build one reusable deck,
            store its images safely in
            the browser, and prepare it
            for multiple card games.
          </p>
        </div>

        <div className="platform-header-actions">
          <Link
            to="/"
            className="platform-secondary-button"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {notification && (
        <div className="platform-notification">
          {notification}
        </div>
      )}

      <section className="platform-summary-grid">
        <article className="platform-summary-card">
          <span>Saved Decks</span>

          <strong>
            {deckLibrary.length}
          </strong>
        </article>

        <article className="platform-summary-card">
          <span>Published</span>

          <strong>
            {publishedDeckCount}
          </strong>
        </article>

        <article className="platform-summary-card">
          <span>Cards Uploaded</span>

          <strong>
            {allCurrentCards.length}
          </strong>
        </article>

        <article className="platform-summary-card">
          <span>Current Status</span>

          <strong>
            {currentDeck.status}
          </strong>
        </article>
      </section>

      <section className="platform-workspace">
        <aside className="platform-sidebar">
          <div className="platform-panel">
            <div className="platform-panel-heading">
              <div>
                <span className="platform-section-label">
                  Deck Library
                </span>

                <h2>
                  Saved Decks
                </h2>
              </div>

              <button
                type="button"
                className="platform-small-button"
                onClick={
                  handleCreateNewDeck
                }
              >
                + New Deck
              </button>
            </div>

            <label className="platform-field-label">
              Load Saved Deck
            </label>

            <select
              value={selectedDeckId}
              onChange={(event) =>
                setSelectedDeckId(
                  event.target.value
                )
              }
              style={fieldStyle}
            >
              {!deckLibrary.length && (
                <option
                  value={
                    currentDeck.id
                  }
                >
                  No saved decks yet
                </option>
              )}

              {deckLibrary.map(
                (deck) => (
                  <option
                    key={deck.id}
                    value={deck.id}
                  >
                    {deck.name} —{" "}
                    {deck.status}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="platform-primary-button"
              onClick={
                handleLoadSelectedDeck
              }
              disabled={
                deckLibrary.length ===
                0
              }
            >
              Load Deck
            </button>

            <div className="platform-divider" />

            <div className="platform-current-deck">
              <span>
                Current Deck
              </span>

              <strong>
                {currentDeck.name}
              </strong>

              <small>
                {currentDeckSaved
                  ? `Last saved ${formatUpdatedDate(
                      currentDeck.updatedAt
                    )}`
                  : "Not saved yet"}
              </small>

              {hasUnsavedChanges && (
                <em>
                  Unsaved changes
                </em>
              )}
            </div>

            <button
              type="button"
              className="platform-danger-button"
              onClick={
                handleDeleteCurrentDeck
              }
              disabled={
                !currentDeckSaved
              }
            >
              Delete Current Deck
            </button>
          </div>

          <div className="platform-panel">
            <span className="platform-section-label">
              Game Readiness
            </span>

            <h2>
              Deck Status
            </h2>

            <div className="platform-readiness-list">
              {SUITS.map((suit) => {
                const validation =
                  suitValidation[suit];

                return (
                  <div
                    key={suit}
                    className={`platform-readiness-row ${
                      validation.complete
                        ? "complete"
                        : ""
                    }`}
                  >
                    <span>
                      {
                        SUIT_SYMBOLS[
                          suit
                        ]
                      }{" "}
                      {
                        SUIT_LABELS[
                          suit
                        ]
                      }
                    </span>

                    <strong>
                      {
                        validation.count
                      }
                      /13
                    </strong>
                  </div>
                );
              })}

              <div
                className={`platform-readiness-row ${
                  currentDeck.cardBack
                    ? "complete"
                    : ""
                }`}
              >
                <span>Card Back</span>

                <strong>
                  {currentDeck.cardBack
                    ? "Ready"
                    : "Missing"}
                </strong>
              </div>
            </div>

            <p className="platform-readiness-message">
              {getReadinessMessage()}
            </p>

            <div className="platform-game-buttons">
              {blackjackReady ? (
                <Link
                  to="/demo"
                  className="deck-play-button"
                  onClick={
                    handleTestBlackjack
                  }
                >
                  Test in Blackjack
                </Link>
              ) : (
                <button
                  type="button"
                  className="deck-play-button"
                  disabled
                >
                  Blackjack Not Ready
                </button>
              )}

              {matchReady ? (
                <Link
                  to="/match?family=1"
                  className="deck-play-button"
                  onClick={
                    handleTestMatch
                  }
                >
                  Test in Match
                </Link>
              ) : (
                <button
                  type="button"
                  className="deck-play-button"
                  disabled
                >
                  Match Not Ready
                </button>
              )}
            </div>
          </div>
        </aside>
        <main className="platform-main">
          <section className="platform-panel">
            <div className="platform-panel-heading">
              <div>
                <span className="platform-section-label">
                  Deck Information
                </span>

                <h2>
                  Edit Current Deck
                </h2>
              </div>

              <div className="platform-save-status">
                {hasUnsavedChanges
                  ? "Unsaved changes"
                  : currentDeckSaved
                  ? "Saved"
                  : "New deck"}
              </div>
            </div>

            <div className="platform-editor-grid">
              <label className="platform-editor-field">
                <span>Deck Name</span>

                <input
                  type="text"
                  name="name"
                  value={currentDeck.name}
                  onChange={
                    handleDeckFieldChange
                  }
                  placeholder="Welcome to Valkyra"
                  style={fieldStyle}
                />
              </label>

              <label className="platform-editor-field">
                <span>Category</span>

                <input
                  type="text"
                  name="category"
                  value={
                    currentDeck.category
                  }
                  onChange={
                    handleDeckFieldChange
                  }
                  placeholder="Fantasy"
                  style={fieldStyle}
                />
              </label>

              <label className="platform-editor-field">
                <span>
                  Publishing Status
                </span>

                <select
                  name="status"
                  value={currentDeck.status}
                  onChange={
                    handleDeckFieldChange
                  }
                  style={{
                    ...fieldStyle,
                    background:
                      "rgba(0,0,0,0.72)",
                  }}
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <label className="platform-editor-field platform-description-field">
              <span>Deck Description</span>

              <textarea
                name="description"
                value={
                  currentDeck.description
                }
                onChange={
                  handleDeckFieldChange
                }
                placeholder="Describe the deck, its artwork and the experience it offers."
                rows="5"
                style={{
                  ...fieldStyle,
                  resize: "vertical",
                  minHeight: "120px",
                }}
              />
            </label>

            <div className="platform-editor-actions">
              <button
                type="button"
                className="platform-primary-button"
                onClick={handleSaveDeck}
                disabled={imagesLoading}
              >
                {currentDeckSaved
                  ? "Save Changes"
                  : "Save Deck"}
              </button>

              <button
                type="button"
                className="platform-secondary-button"
                onClick={
                  handleCreateNewDeck
                }
                disabled={imagesLoading}
              >
                Create New Deck
              </button>
            </div>
          </section>

          <section className="platform-panel">
            <div className="platform-panel-heading">
              <div>
                <span className="platform-section-label">
                  Playing Cards
                </span>

                <h2>
                  Upload the Four Suits
                </h2>
              </div>

              <div className="platform-card-total">
                {allCurrentCards.length}
                /52 cards
              </div>
            </div>

            <p className="platform-help-text">
              Upload thirteen images for
              each suit. Filenames must
              identify the rank, for
              example A.jpg, 2.jpg,
              10.jpg, J.jpg, Q.jpg and
              K.jpg.
            </p>

            <div className="platform-suit-grid">
              {SUITS.map((suit) => {
                const cards =
                  currentDeck.suitCards?.[
                    suit
                  ] || [];

                const validation =
                  suitValidation[suit];

                return (
                  <article
                    key={suit}
                    className={`platform-suit-panel platform-suit-${suit}`}
                  >
                    <div className="platform-suit-heading">
                      <div>
                        <h3>
                          <span>
                            {
                              SUIT_SYMBOLS[
                                suit
                              ]
                            }
                          </span>{" "}
                          {
                            SUIT_LABELS[
                              suit
                            ]
                          }
                        </h3>

                        <p>
                          {
                            validation.count
                          }
                          /13 cards
                        </p>
                      </div>

                      <span
                        className={`platform-suit-status ${
                          validation.complete
                            ? "complete"
                            : ""
                        }`}
                      >
                        {validation.complete
                          ? "Complete"
                          : "Incomplete"}
                      </span>
                    </div>

                    <div className="platform-suit-actions">
                      <label className="platform-upload-button">
                        Upload{" "}
                        {
                          SUIT_LABELS[
                            suit
                          ]
                        }

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(
                            event
                          ) =>
                            handleSuitUpload(
                              event,
                              suit
                            )
                          }
                          disabled={
                            imagesLoading
                          }
                          hidden
                        />
                      </label>

                      <button
                        type="button"
                        className="platform-small-button"
                        onClick={() =>
                          handleClearSuit(
                            suit
                          )
                        }
                        disabled={
                          cards.length ===
                            0 ||
                          imagesLoading
                        }
                      >
                        Clear Suit
                      </button>
                    </div>

                    {!validation.complete &&
                      validation
                        .missingRanks
                        .length > 0 && (
                        <p className="platform-missing-ranks">
                          Missing:{" "}
                          {validation.missingRanks.join(
                            ", "
                          )}
                        </p>
                      )}

                    <div className="platform-card-preview-grid">
                      {cards.map(
                        (card) => {
                          const cardUrl =
                            imageUrls[
                              card.id
                            ];

                          return (
                            <div
                              key={
                                card.id
                              }
                              className="platform-card-preview"
                            >
                              {cardUrl ? (
                                <img
                                  src={
                                    cardUrl
                                  }
                                  alt={`${card.rank} of ${SUIT_LABELS[suit]}`}
                                />
                              ) : (
                                <div className="platform-card-placeholder">
                                  {
                                    card.rank
                                  }
                                </div>
                              )}

                              <div className="platform-card-preview-footer">
                                <strong>
                                  {
                                    card.rank
                                  }
                                </strong>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCard(
                                      suit,
                                      card
                                    )
                                  }
                                  disabled={
                                    imagesLoading
                                  }
                                  aria-label={`Remove ${card.rank} of ${SUIT_LABELS[suit]}`}
                                  title={`Remove ${card.rank} of ${SUIT_LABELS[suit]}`}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {cards.length ===
                        0 && (
                        <div className="platform-empty-suit">
                          No cards uploaded
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="platform-panel">
            <div className="platform-panel-heading">
              <div>
                <span className="platform-section-label">
                  Shared Card Back
                </span>

                <h2>
                  Card Back Image
                </h2>
              </div>

              <span
                className={`platform-suit-status ${
                  currentDeck.cardBack
                    ? "complete"
                    : ""
                }`}
              >
                {currentDeck.cardBack
                  ? "Ready"
                  : "Required"}
              </span>
            </div>

            <p className="platform-help-text">
              The same card-back image
              will be used whenever a
              card is face down in
              Blackjack, Match and future
              games.
            </p>

            <div className="platform-card-back-layout">
              <div className="platform-card-back-preview">
                {currentDeck.cardBack &&
                imageUrls[
                  currentDeck.cardBack.id
                ] ? (
                  <img
                    src={
                      imageUrls[
                        currentDeck
                          .cardBack.id
                      ]
                    }
                    alt={`${currentDeck.name} card back`}
                  />
                ) : (
                  <div className="platform-card-back-placeholder">
                    <span>
                      Card Back
                    </span>
                  </div>
                )}
              </div>

              <div className="platform-card-back-controls">
                <label className="platform-upload-button">
                  {currentDeck.cardBack
                    ? "Replace Card Back"
                    : "Upload Card Back"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleCardBackUpload
                    }
                    disabled={
                      imagesLoading
                    }
                    hidden
                  />
                </label>

                <button
                  type="button"
                  className="platform-small-button"
                  onClick={
                    clearCardBack
                  }
                  disabled={
                    !currentDeck.cardBack ||
                    imagesLoading
                  }
                >
                  Remove Card Back
                </button>

                {currentDeck.cardBack && (
                  <p>
                    <strong>
                      Stored file:
                    </strong>{" "}
                    {
                      currentDeck
                        .cardBack.name
                    }
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="platform-panel">
            <div className="platform-panel-heading">
              <div>
                <span className="platform-section-label">
                  Final Review
                </span>

                <h2>
                  Save and Test
                </h2>
              </div>
            </div>

            <div className="platform-final-summary">
              <div>
                <span>Deck</span>

                <strong>
                  {currentDeck.name}
                </strong>
              </div>

              <div>
                <span>Cards</span>

                <strong>
                  {
                    allCurrentCards.length
                  }
                  /52
                </strong>
              </div>

              <div>
                <span>Card Back</span>

                <strong>
                  {currentDeck.cardBack
                    ? "Uploaded"
                    : "Missing"}
                </strong>
              </div>

              <div>
                <span>Blackjack</span>

                <strong>
                  {blackjackReady
                    ? "Ready"
                    : "Not Ready"}
                </strong>
              </div>
            </div>

            <div className="platform-editor-actions">
              <button
                type="button"
                className="platform-primary-button"
                onClick={handleSaveDeck}
                disabled={imagesLoading}
              >
                {currentDeckSaved
                  ? "Save Deck Changes"
                  : "Save Deck"}
              </button>

              {blackjackReady ? (
                <Link
                  to="/demo"
                  className="deck-play-button"
                  onClick={
                    handleTestBlackjack
                  }
                >
                  Test in Blackjack
                </Link>
              ) : (
                <button
                  type="button"
                  className="deck-play-button"
                  disabled
                >
                  Blackjack Not Ready
                </button>
              )}

              {matchReady ? (
                <Link
                  to="/match?family=1"
                  className="deck-play-button secondary-deck-button"
                  onClick={
                    handleTestMatch
                  }
                >
                  Test in Match
                </Link>
              ) : (
                <button
                  type="button"
                  className="deck-disabled-button"
                  disabled
                >
                  Match Not Ready
                </button>
              )}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}

