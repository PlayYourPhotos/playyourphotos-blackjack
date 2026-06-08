import { useMemo, useState } from "react";
import fullDeck from "../data/fullDeck.js";
import Card from "../components/Card";

const tableThemes = {
  ruby: {
    name: "Ruby Table",
    className: "theme-ruby",
    background: "/backgrounds/ruby.jpg",
  },
  midnight: {
    name: "Midnight Table",
    className: "theme-midnight",
    background: "/backgrounds/midnight.jpg",
  },
  emerald: {
    name: "Emerald Table",
    className: "theme-emerald",
    background: "/backgrounds/emerald.jpg",
  },
};

function shuffleDeck(deck) {
  const copy = [...deck];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function cardValue(rank) {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return Number(rank);
}

function handTotal(hand) {
  let total = hand.reduce((sum, card) => sum + cardValue(card.rank), 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function resultType(message) {
  const lower = message.toLowerCase();

  if (lower.includes("you win") || lower.includes("dealer busts")) return "win";
  if (lower.includes("dealer wins") || lower.includes("bust")) return "lose";
  if (lower.includes("push") || lower.includes("draw")) return "draw";

  return "";
}

export default function Demo() {
  const startingDeck = useMemo(() => shuffleDeck(fullDeck), []);

  const [theme, setTheme] = useState("midnight");
  const [deck, setDeck] = useState(startingDeck);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [message, setMessage] = useState("Click New Game to start");

  const [galleryCards, setGalleryCards] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  const currentTheme = tableThemes[theme];

  const playerTotal = handTotal(playerHand);

  const dealerTotal = dealerRevealed
    ? handTotal(dealerHand)
    : dealerHand[0]
    ? cardValue(dealerHand[0].rank)
    : 0;

  function newGame() {
    const freshDeck = shuffleDeck(fullDeck);

    const player = [freshDeck[0], freshDeck[2]];
    const dealer = [freshDeck[1], freshDeck[3]];

    setDeck(freshDeck.slice(4));
    setPlayerHand(player);
    setDealerHand(dealer);
    setDealerRevealed(false);
    setGameStarted(true);
    setShowResultOverlay(false);
    setMessage("Your move");
  }

  function endGame(finalMessage) {
    setDealerRevealed(true);
    setGameStarted(false);
    setMessage(finalMessage);

    setTimeout(() => {
      setShowResultOverlay(true);
    }, 450);
  }

  function hit() {
    if (!gameStarted || dealerRevealed || deck.length === 0) return;

    const newHand = [...playerHand, deck[0]];

    setPlayerHand(newHand);
    setDeck(deck.slice(1));

    if (handTotal(newHand) > 21) {
      endGame("Bust! Dealer wins");
    }
  }

  function stand() {
    if (!gameStarted || dealerRevealed) return;

    let newDeck = [...deck];
    let newDealerHand = [...dealerHand];

    while (handTotal(newDealerHand) < 17 && newDeck.length > 0) {
      newDealerHand.push(newDeck[0]);
      newDeck = newDeck.slice(1);
    }

    const finalPlayer = handTotal(playerHand);
    const finalDealer = handTotal(newDealerHand);

    setDealerHand(newDealerHand);
    setDeck(newDeck);

    if (finalDealer > 21) endGame("Dealer busts — you win!");
    else if (finalPlayer > finalDealer) endGame("You win!");
    else if (finalPlayer < finalDealer) endGame("Dealer wins");
    else endGame("Push — draw");
  }

  function openGallery(cards, index) {
    setGalleryCards(cards);
    setGalleryIndex(index);
  }

  function closeGallery() {
    setGalleryCards([]);
    setGalleryIndex(null);
  }

  function previousCard() {
    setGalleryIndex((current) =>
      current === 0 ? galleryCards.length - 1 : current - 1
    );
  }

  function nextCard() {
    setGalleryIndex((current) =>
      current === galleryCards.length - 1 ? 0 : current + 1
    );
  }

  const activeGalleryCard =
    galleryIndex !== null ? galleryCards[galleryIndex] : null;

  const activeResultType = resultType(message);

  return (
    <div
      className={`blackjack-page ${currentTheme.className}`}
      style={{
        backgroundImage: `url(${currentTheme.background})`,
      }}
    >
      <aside className="game-panel">
        <h1 className="game-title">Valkyra Blackjack</h1>

        <div className="theme-box">
          <label>Table Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="midnight">Midnight Table</option>
            <option value="ruby">Ruby Table</option>
            <option value="emerald">Emerald Table</option>
          </select>
        </div>

        <button className="primary-button" onClick={newGame}>
          New Game
        </button>

        <button
          className="game-button"
          onClick={hit}
          disabled={!gameStarted || dealerRevealed}
        >
          Hit
        </button>

        <button
          className="game-button"
          onClick={stand}
          disabled={!gameStarted || dealerRevealed}
        >
          Stand
        </button>

        <div className="status-box">
          <strong>{message}</strong>
          <span>Player: {playerTotal}</span>
          <span>Dealer: {dealerTotal}</span>
        </div>
      </aside>

      <main className="table-area">
        <section className="hand-section">
          <h2>Dealer</h2>

          <div className="hand-row">
            {dealerHand.map((card, index) => (
              <Card
                key={index}
                rank={card.rank}
                suit={card.suit}
                image={card.image}
                faceDown={index === 1 && !dealerRevealed}
                onClick={() => openGallery(dealerHand, index)}
              />
            ))}
          </div>
        </section>

        <section className="hand-section">
          <h2>Player</h2>

          <div className="hand-row">
            {playerHand.map((card, index) => (
              <Card
                key={index}
                rank={card.rank}
                suit={card.suit}
                image={card.image}
                onClick={() => openGallery(playerHand, index)}
              />
            ))}
          </div>
        </section>
      </main>

      {showResultOverlay && (
        <div className={`result-overlay ${activeResultType}`}>
          <div className="result-box">
            <button
              className="result-close"
              onClick={() => setShowResultOverlay(false)}
            >
              ×
            </button>

            <div className="result-label">
              {activeResultType === "win"
                ? "VICTORY"
                : activeResultType === "lose"
                ? "DEFEAT"
                : "DRAW"}
            </div>

            <div className="result-message">{message}</div>

            <div className="result-scores">
              <span>Player: {playerTotal}</span>
              <span>Dealer: {handTotal(dealerHand)}</span>
            </div>

            <button className="result-button" onClick={newGame}>
              Deal Again
            </button>
          </div>
        </div>
      )}

      {activeGalleryCard && (
        <div className="gallery-overlay">
          <button className="gallery-close" onClick={closeGallery}>
            ×
          </button>

          <button className="gallery-nav gallery-prev" onClick={previousCard}>
            ‹
          </button>

          <div className="gallery-card">
            <Card
              rank={activeGalleryCard.rank}
              suit={activeGalleryCard.suit}
              image={activeGalleryCard.image}
            />
          </div>

          <button className="gallery-nav gallery-next" onClick={nextCard}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
