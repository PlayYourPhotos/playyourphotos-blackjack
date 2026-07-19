import { getDeckImages } from "./deckImageDB";

const SUITS = [
  "hearts",
  "diamonds",
  "spades",
  "clubs",
];

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

const DECK_LIBRARY_STORAGE_KEY =
  "playYourPhotosDeckLibrary";

const ACTIVE_DECK_ID_STORAGE_KEY =
  "playYourPhotosActiveDeckId";

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

function getDeckLibrary() {
  const storedLibrary = loadStoredJson(
    DECK_LIBRARY_STORAGE_KEY
  );

  return Array.isArray(storedLibrary)
    ? storedLibrary
    : [];
}

function getActiveDeckId() {
  try {
    return localStorage.getItem(
      ACTIVE_DECK_ID_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "Unable to read the active deck ID:",
      error
    );

    return null;
  }
}

function sortCards(cards) {
  return [...cards].sort((firstCard, secondCard) => {
    const suitDifference =
      SUITS.indexOf(firstCard.suit) -
      SUITS.indexOf(secondCard.suit);

    if (suitDifference !== 0) {
      return suitDifference;
    }

    return (
      VALID_RANKS.indexOf(firstCard.rank) -
      VALID_RANKS.indexOf(secondCard.rank)
    );
  });
}

function validateDeckCards(cards) {
  const problems = [];

  SUITS.forEach((suit) => {
    const suitCards = cards.filter(
      (card) => card.suit === suit
    );

    if (suitCards.length !== 13) {
      problems.push(
        `${suit} contains ${suitCards.length} of 13 cards`
      );
    }

    VALID_RANKS.forEach((rank) => {
      const matchingCards = suitCards.filter(
        (card) => card.rank === rank
      );

      if (matchingCards.length === 0) {
        problems.push(
          `${rank} of ${suit} is missing`
        );
      }

      if (matchingCards.length > 1) {
        problems.push(
          `${rank} of ${suit} is duplicated`
        );
      }
    });
  });

  return {
    valid: problems.length === 0,
    problems,
  };
}

function revokeObjectUrls(urls) {
  urls.forEach((url) => {
    if (
      typeof url === "string" &&
      url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(url);
    }
  });
}

export function getSavedDeck(deckId) {
  const deckLibrary = getDeckLibrary();

  const resolvedDeckId =
    deckId || getActiveDeckId();

  if (!resolvedDeckId) {
    return null;
  }

  return (
    deckLibrary.find(
      (deck) => deck.id === resolvedDeckId
    ) || null
  );
}

export async function loadBlackjackDeck(deckId) {
  const deckRecord = getSavedDeck(deckId);

  if (!deckRecord) {
    throw new Error(
      "The selected deck could not be found."
    );
  }

  const imageRecords = await getDeckImages(
    deckRecord.id
  );

  const objectUrls = [];

  const cardImages = imageRecords.filter(
    (imageRecord) =>
      imageRecord.type === "card"
  );

  const cardBackRecord = imageRecords.find(
    (imageRecord) =>
      imageRecord.type === "cardBack"
  );

  const cards = cardImages
    .map((imageRecord) => {
      if (
        !SUITS.includes(imageRecord.suit) ||
        !VALID_RANKS.includes(imageRecord.rank) ||
        !imageRecord.blob
      ) {
        return null;
      }

      const imageUrl = URL.createObjectURL(
        imageRecord.blob
      );

      objectUrls.push(imageUrl);

      return {
        id: imageRecord.id,
        rank: imageRecord.rank,
        suit: imageRecord.suit,
        image: imageUrl,
      };
    })
    .filter(Boolean);

  const sortedCards = sortCards(cards);

  const validation =
    validateDeckCards(sortedCards);

  if (!validation.valid) {
    revokeObjectUrls(objectUrls);

    throw new Error(
      `This deck is not Blackjack ready:\n${validation.problems.join(
        "\n"
      )}`
    );
  }

  if (!cardBackRecord?.blob) {
    revokeObjectUrls(objectUrls);

    throw new Error(
      "This deck does not have a card back."
    );
  }

  const cardBackUrl = URL.createObjectURL(
    cardBackRecord.blob
  );

  objectUrls.push(cardBackUrl);

  return {
    id: deckRecord.id,
    name: deckRecord.name || "Custom Deck",
    category:
      deckRecord.category || "Uncategorised",
    description:
      deckRecord.description || "",
    cards: sortedCards,
    cardBack: cardBackUrl,

    release() {
      revokeObjectUrls(objectUrls);
    },
  };
}
