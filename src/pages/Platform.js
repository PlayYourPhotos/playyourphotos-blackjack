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

  function handleNewDeck() {
    if (hasUnsavedChanges) {
      const confirmed =
        window.confirm(
          "The current deck has unsaved information changes. Create a new deck without saving them?"
        );

      if (!confirmed) {
        return;
      }
    }

    const newDeck =
      createBlankDeck();

    setCurrentDeck(newDeck);
    setSelectedDeckId(
      newDeck.id
    );
    setLastSavedSnapshot(
      createDeckSnapshot(
        newDeck
      )
    );

    saveActiveDeckId(
      newDeck.id
    );

    showNotification(
      "New blank deck created."
    );
  }

  function handleSaveDeck() {
    const trimmedName =
      currentDeck.name.trim();

    if (!trimmedName) {
      window.alert(
        "Enter a deck name before saving."
      );

      return;
    }

    const now =
      new Date().toISOString();

    const deckToSave =
      normaliseDeck({
        ...currentDeck,
        name: trimmedName,
        category:
          currentDeck.category.trim() ||
          "Uncategorised",
        updatedAt: now,
        createdAt:
          currentDeck.createdAt ||
          now,
      });

    const existingIndex =
      deckLibrary.findIndex(
        (deck) =>
          deck.id ===
          deckToSave.id
      );

    const nextLibrary =
      existingIndex >= 0
        ? deckLibrary.map(
            (deck) =>
              deck.id ===
              deckToSave.id
                ? deckToSave
                : deck
          )
        : [
            ...deckLibrary,
            deckToSave,
          ];

    if (
      !saveDeckLibrary(
        nextLibrary
      )
    ) {
      window.alert(
        "The deck information could not be saved. Clear the browser's old site data and try again."
      );

      return;
    }

    setDeckLibrary(
      nextLibrary
    );

    setCurrentDeck(
      deckToSave
    );

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
      `"${deckToSave.name}" saved successfully.`
    );
  }

  function handleLoadDeck() {
    if (!selectedDeckId) {
      window.alert(
        "Select a saved deck to load."
      );

      return;
    }

    if (hasUnsavedChanges) {
      const confirmed =
        window.confirm(
          "The current deck has unsaved information changes. Load another deck without saving them?"
        );

      if (!confirmed) {
        return;
      }
    }

    const selectedDeck =
      deckLibrary.find(
        (deck) =>
          deck.id ===
          selectedDeckId
      );

    if (!selectedDeck) {
      window.alert(
        "The selected deck could not be found."
      );

      return;
    }

    const loadedDeck =
      normaliseDeck(
        selectedDeck
      );

    setCurrentDeck(
      loadedDeck
    );

    setSelectedDeckId(
      loadedDeck.id
    );

    setLastSavedSnapshot(
      createDeckSnapshot(
        loadedDeck
      )
    );

    saveActiveDeckId(
      loadedDeck.id
    );

    showNotification(
      `"${loadedDeck.name}" loaded.`
    );
  }

  async function handleDeleteDeck() {
    const existingDeck =
      deckLibrary.find(
        (deck) =>
          deck.id ===
          currentDeck.id
      );

    const deckName =
      existingDeck?.name ||
      currentDeck.name ||
      "Untitled Deck";

    const confirmed =
      window.confirm(
        `Delete "${deckName}" and all of its card images permanently from this browser?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setImagesLoading(true);

      await deleteDeckImages(
        currentDeck.id
      );

      const nextLibrary =
        deckLibrary.filter(
          (deck) =>
            deck.id !==
            currentDeck.id
        );

      if (
        !saveDeckLibrary(
          nextLibrary
        )
      ) {
        throw new Error(
          "The deck library could not be updated."
        );
      }

      setDeckLibrary(
        nextLibrary
      );

      const nextDeck =
        nextLibrary[0]
          ? normaliseDeck(
              nextLibrary[0]
            )
          : createBlankDeck();

      setCurrentDeck(
        nextDeck
      );

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
        `"${deckName}" deleted.`
      );
    } catch (error) {
      console.error(
        "Unable to delete deck:",
        error
      );

      window.alert(
        `The deck could not be deleted: ${error.message}`
      );
    } finally {
      setImagesLoading(false);
    }
  }

  function saveDeckForMatch() {
    const matchCards =
      allCurrentCards
        .map((card) => ({
          ...card,
          image:
            imageUrls[
              card.id
            ] || null,
        }))
        .filter(
          (card) => card.image
        );

    const matchDeck = {
      ...normaliseDeck(
        currentDeck
      ),
      cards: matchCards,
      cardBack:
        currentDeck.cardBack
          ? {
              ...currentDeck.cardBack,
              image:
                imageUrls[
                  currentDeck
                    .cardBack.id
                ] || null,
            }
          : null,
    };

    try {
      /*
       * These contain blob URLs, not base64 images.
       * They are small and valid during this browser session.
       */
      const matchDeckJson =
        JSON.stringify(
          matchDeck
        );

      localStorage.setItem(
        CURRENT_DECK_STORAGE_KEY,
        matchDeckJson
      );

      localStorage.setItem(
        LEGACY_DECK_STORAGE_KEY,
        matchDeckJson
      );

      return true;
    } catch (error) {
      console.error(
        "Unable to prepare Match deck:",
        error
      );

      return false;
    }
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

  function getReadinessMessage() {
    if (
      allCurrentCards.length === 0
    ) {
      return "Upload Suit Cards";
    }

    if (blackjackReady) {
      return "Blackjack Ready";
    }

    if (matchReady) {
      return "Match Ready";
    }

    if (
      !currentDeck.cardBack
    ) {
      return "Card Back Required";
    }

    return `${allCurrentCards.length} / 52 Cards`;
  }

  const currentDeckDisplayName =
    currentDeck.name.trim() ||
    "Untitled Deck";

  const currentDeckCategory =
    currentDeck.category.trim() ||
    "Uncategorised";

  const currentDeckCoverCard =
    allCurrentCards[0];

  const currentDeckCoverUrl =
    currentDeckCoverCard
      ? imageUrls[
          currentDeckCoverCard.id
        ]
      : null;

  const deckReadiness =
    getReadinessMessage();

  return (
    <div className="platform-page">
      <header className="platform-hero">
        <div>
          <p className="platform-kicker">
            Card Ledgends
          </p>

          <h1>
            Deck Publishing Studio
          </h1>

          <p>
            Create, organise, save,
            test and publish complete
            illustrated card decks
            across multiple games.
          </p>

          {notification && (
            <p
              style={{
                marginTop: "8px",
                color: "#ffe7a3",
                fontWeight: "bold",
              }}
            >
              {notification}
            </p>
          )}

          {imagesLoading && (
            <p
              style={{
                marginTop: "8px",
                color:
                  "rgba(255,255,255,0.75)",
              }}
            >
              Processing deck
              images…
            </p>
          )}
        </div>

        <div className="platform-actions">
          <button
            type="button"
            className="platform-primary"
            onClick={
              handleNewDeck
            }
            disabled={
              imagesLoading
            }
          >
            + New Deck
          </button>

          <button
            type="button"
            className="platform-secondary"
            onClick={
              handleSaveDeck
            }
            disabled={
              imagesLoading
            }
          >
            Save Deck
            {hasUnsavedChanges
              ? " *"
              : ""}
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
              <p>
                Fantasy Warrior Art
              </p>

              <div className="deck-meta">
                <span>52 Cards</span>
                <span>Demo Deck</span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>
                  Memory Match
                </span>
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
              {currentDeckCoverUrl ? (
                <img
                  src={
                    currentDeckCoverUrl
                  }
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
              <h3>
                {
                  currentDeckDisplayName
                }
              </h3>

              <p>
                {
                  currentDeckCategory
                }
              </p>

              <div className="deck-meta">
                <span>
                  {
                    allCurrentCards.length
                  }{" "}
                  / 52 Cards
                </span>

                <span>
                  {deckReadiness}
                </span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>
                  Memory Match
                </span>

                {hasUnsavedChanges && (
                  <span>
                    Unsaved Changes
                  </span>
                )}
              </div>

              <div className="deck-button-stack">
                <label className="deck-play-button secondary-deck-button">
                  Upload Card Back

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
                    Add Cards and Card
                    Back to Test
                  </button>
                )}

                {blackjackReady ? (
                  <button
                    type="button"
                    className="deck-play-button"
                    disabled
                    title="Blackjack connection is the next development stage."
                  >
                    Blackjack Ready
                  </button>
                ) : (
                  <button
                    type="button"
                    className="deck-disabled-button"
                    disabled
                  >
                    Blackjack Requires
                    52 Cards
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
              <h3>
                Published Decks
              </h3>

              <p>
                Card Ledgends Catalogue
              </p>

              <div className="deck-meta">
                <span>
                  {
                    publishedDeckCount
                  }{" "}
                  Deck
                  {publishedDeckCount ===
                  1
                    ? ""
                    : "s"}
                </span>

                <span>
                  {
                    deckLibrary.length
                  }{" "}
                  Saved
                </span>
              </div>

              <div className="deck-games">
                <span>Blackjack</span>
                <span>Solitaire</span>
                <span>
                  Memory Match
                </span>
              </div>

              <button
                type="button"
                className="deck-disabled-button"
                disabled
              >
                Catalogue View Coming
                Next
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
              value={
                currentDeck.name
              }
              onChange={
                handleDeckFieldChange
              }
              placeholder="Warrior Queens"
              style={fieldStyle}
            />
          </div>

          <div>
            <h3>Category</h3>

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
          </div>

          <div>
            <h3>
              Publishing Status
            </h3>

            <select
              name="status"
              value={
                currentDeck.status
              }
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
          </div>

          <div>
            <h3>
              Project Information
            </h3>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {currentDeck.status}
            </p>

            <p>
              <strong>
                Readiness:
              </strong>{" "}
              {deckReadiness}
            </p>

            <p>
              <strong>
                Last saved:
              </strong>{" "}
              {formatUpdatedDate(
                currentDeck.updatedAt
              )}
            </p>
          </div>
        </div>

        <div
          className="platform-feature-grid"
          style={{
            marginTop: "12px",
          }}
        >
          {SUITS.map((suit) => {
            const cards =
              currentDeck
                .suitCards?.[
                suit
              ] || [];

            const validation =
              suitValidation[suit];

            return (
              <div key={suit}>
                <h3>
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
                </h3>

                <p>
                  <strong>
                    {
                      validation.count
                    }{" "}
                    / 13 Cards
                  </strong>
                </p>

                <label className="deck-play-button">
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

                {validation
                  .missingRanks
                  .length > 0 ? (
                  <p
                    style={{
                      marginTop:
                        "8px",
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Missing:{" "}
                    {validation.missingRanks.join(
                      ", "
                    )}
                  </p>
                ) : (
                  <p
                    style={{
                      marginTop:
                        "8px",
                      color:
                        "#ffe7a3",
                      fontWeight:
                        "bold",
                    }}
                  >
                    Complete
                  </p>
                )}

                {cards.length >
                  0 && (
                  <button
                    type="button"
                    className="deck-disabled-button"
                    onClick={() =>
                      handleClearSuit(
                        suit
                      )
                    }
                    disabled={
                      imagesLoading
                    }
                    style={{
                      cursor:
                        "pointer",
                      marginTop:
                        "8px",
                    }}
                  >
                    Clear{" "}
                    {
                      SUIT_LABELS[
                        suit
                      ]
                    }
                  </button>
                )}

                {cards.length >
                  0 && (
                  <div
                    className="family-photo-preview-row"
                    style={{
                      gridTemplateColumns:
                        "repeat(4, 1fr)",
                    }}
                  >
                    {cards
                      .slice(0, 4)
                      .map(
                        (card) => {
                          const url =
                            imageUrls[
                              card
                                .id
                            ];

                          if (!url) {
                            return null;
                          }

                          return (
                            <img
                              key={
                                card.id
                              }
                              src={
                                url
                              }
                              alt={`${card.rank} of ${SUIT_LABELS[suit]}`}
                              className="family-photo-thumb"
                              title={`${card.rank} of ${SUIT_LABELS[suit]}`}
                            />
                          );
                        }
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="platform-feature-grid"
          style={{
            marginTop: "12px",
          }}
        >
          <div>
            <h3>
              Load Saved Deck
            </h3>

            <select
              value={
                selectedDeckId
              }
              onChange={(event) =>
                setSelectedDeckId(
                  event.target
                    .value
                )
              }
              style={{
                ...fieldStyle,
                background:
                  "rgba(0,0,0,0.72)",
              }}
            >
              <option value="">
                Select a saved deck
              </option>

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
              className="deck-play-button secondary-deck-button"
              onClick={
                handleLoadDeck
              }
              disabled={
                imagesLoading
              }
              style={{
                marginTop: "8px",
              }}
            >
              Load Deck
            </button>
          </div>

          <div>
            <h3>
              Save Current Deck
            </h3>

            <p>
              Save all four suits and
              deck information to the
              Card Ledgends library.
            </p>

            <button
              type="button"
              className="deck-play-button"
              onClick={
                handleSaveDeck
              }
              disabled={
                imagesLoading
              }
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
                onChange={
                  handleCardBackUpload
                }
                disabled={
                  imagesLoading
                }
                hidden
              />
            </label>

            {currentDeck.cardBack && (
              <>
                {imageUrls[
                  currentDeck
                    .cardBack.id
                ] && (
                  <img
                    src={
                      imageUrls[
                        currentDeck
                          .cardBack
                          .id
                      ]
                    }
                    alt="Card back"
                    className="family-photo-thumb"
                    style={{
                      marginTop:
                        "8px",
                    }}
                  />
                )}

                <button
                  type="button"
                  className="deck-disabled-button"
                  onClick={
                    clearCardBack
                  }
                  disabled={
                    imagesLoading
                  }
                  style={{
                    cursor:
                      "pointer",
                    marginTop:
                      "8px",
                  }}
                >
                  Clear Card Back
                </button>
              </>
            )}
          </div>

          <div>
            <h3>Delete Deck</h3>

            <p>
              Permanently remove the
              loaded project and its
              images from this browser.
            </p>

            <button
              type="button"
              className="deck-disabled-button"
              onClick={
                handleDeleteDeck
              }
              disabled={
                imagesLoading
              }
              style={{
                cursor: "pointer",
              }}
            >
              Delete Deck
            </button>
          </div>
        </div>

        <div
          className="platform-feature-grid"
          style={{
            marginTop: "12px",
          }}
        >
          <div
            style={{
              gridColumn:
                "1 / -1",
            }}
          >
            <h3>
              Deck Description
            </h3>

            <textarea
              name="description"
              value={
                currentDeck.description
              }
              onChange={
                handleDeckFieldChange
              }
              placeholder="Describe the artwork, theme and collection."
              rows={3}
              style={{
                ...fieldStyle,
                resize:
                  "vertical",
                lineHeight:
                  "1.4",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
