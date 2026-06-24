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

function playSound(path) {
  const sound = new Audio(path);
  sound.volume = 0.55;
  sound.play().catch(() => {});
}

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

function isBlackjack(hand) {
  return hand.length === 2 && handTotal(hand) === 21;
}

function resultType(message) {
  const lower = message.toLowerCase();

  if (
    lower.includes("blackjack") ||
    lower.includes("you win") ||
    lower.includes("dealer busts")
  ) {
    return "win";
  }

  if (lower.includes("dealer wins") || lower.includes("bust")) {
    return "lose";
  }

  if (lower.includes("push") || lower.includes("draw")) {
    return "draw";
  }

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

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(50);
  const [roundBet, setRoundBet] = useState(0);
  const [hasDoubled, setHasDoubled] = useState(false);

  const currentTheme = tableThemes[theme];

  const playerTotal = handTotal(playerHand);

  const dealerTotal = dealerRevealed
    ? handTotal(dealerHand)
    : dealerHand[0]
    ? cardValue(dealerHand[0].rank)
    : 0;

  const canDoubleDown =
    gameStarted &&
    !dealerRevealed &&
    playerHand.length === 2 &&
    balance >= roundBet &&
    !hasDoubled;

  function playClick() {
    playSound("/sounds/click.mp3");
  }

  function playDeal() {
    playSound("/sounds/deal.m4a");
  }

  function playWin() {
    playSound("/sounds/win.m4a");
  }

  function playLose() {
    playSound("/sounds/lose.mp3");
  }

  function placeBet(amount) {
    if (gameStarted) return;

    playClick();
    setBet(amount);
  }

  function resetBank() {
    if (gameStarted) return;

    playClick();

    setBalance(1000);
    setBet(50);
    setRoundBet(0);
    setHasDoubled(false);
    setMessage("Bank reset to 1000");
  }

  function settleBet(finalMessage, finalRoundBet, blackjackPayout = false) {
    const type = resultType(finalMessage);

    if (blackjackPayout) {
      setBalance((prev) => prev + Math.floor(finalRoundBet * 2.5));
      return;
    }

    if (type === "win") {
      setBalance((prev) => prev + finalRoundBet * 2);
    }

    if (type === "draw") {
      setBalance((prev) => prev + finalRoundBet);
    }
  }

  function endGame(finalMessage, finalRoundBet = roundBet, blackjackPayout = false) {
    setDealerRevealed(true);
    playDeal();

    setGameStarted(false);
    setMessage(finalMessage);

    settleBet(finalMessage, finalRoundBet, blackjackPayout);

    const type = resultType(finalMessage);

    if (type === "win") {
      playWin();
    } else if (type === "lose") {
      playLose();
    } else {
      playClick();
    }

    setTimeout(() => {
      setShowResultOverlay(true);
    }, 450);
  }

  function newGame() {
    if (gameStarted) return;

    playClick();

    if (balance < bet) {
      setMessage("Not enough balance");
      playLose();
      return;
    }

    playDeal();

    const freshDeck = shuffleDeck(fullDeck);

    const player = [freshDeck[0], freshDeck[2]];
    const dealer = [freshDeck[1], freshDeck[3]];

    const playerHasBlackjack = isBlackjack(player);
    const dealerHasBlackjack = isBlackjack(dealer);

    setBalance((prev) => prev - bet);
    setRoundBet(bet);

    setDeck(freshDeck.slice(4));
    setPlayerHand(player);
    setDealerHand(dealer);
    setDealerRevealed(false);
    setGameStarted(true);
    setShowResultOverlay(false);
    setHasDoubled(false);
    setMessage("Your move");

    if (playerHasBlackjack || dealerHasBlackjack) {
      setTimeout(() => {
        if (playerHasBlackjack && dealerHasBlackjack) {
          endGame("Blackjack push — draw", bet, false);
        } else if (playerHasBlackjack) {
          endGame("Blackjack! You win 3:2", bet, true);
        } else {
          endGame("Dealer Blackjack wins", bet, false);
        }
      }, 450);
    }
  }

  function hit() {
    if (!gameStarted || dealerRevealed || deck.length === 0) return;

    playClick();
    playDeal();

    const newHand = [...playerHand, deck[0]];

    setPlayerHand(newHand);
    setDeck(deck.slice(1));

    if (handTotal(newHand) > 21) {
      endGame("Bust! Dealer wins");
    }
  }

  function playDealerAndFinish(finalPlayerHand, remainingDeck, finalRoundBet) {
    let newDeck = [...remainingDeck];
    let newDealerHand = [...dealerHand];

    while (handTotal(newDealerHand) < 17 && newDeck.length > 0) {
      playDeal();
      newDealerHand.push(newDeck[0]);
      newDeck = newDeck.slice(1);
    }

    const finalPlayer = handTotal(finalPlayerHand);
    const finalDealer = handTotal(newDealerHand);

    setDealerHand(newDealerHand);
    setDeck(newDeck);

    if (finalDealer > 21) {
      endGame("Dealer busts — you win!", finalRoundBet);
    } else if (finalPlayer > finalDealer) {
      endGame("You win!", finalRoundBet);
    } else if (finalPlayer < finalDealer) {
      endGame("Dealer wins", finalRoundBet);
    } else {
      endGame("Push — draw", finalRoundBet);
    }
  }

  function stand() {
    if (!gameStarted || dealerRevealed) return;

    playClick();

    playDealerAndFinish(playerHand, deck, roundBet);
  }

  function doubleDown() {
    if (!canDoubleDown || deck.length === 0) return;

    playClick();
    playDeal();

    const doubledBet = roundBet * 2;
    const newPlayerHand = [...playerHand, deck[0]];
    const remainingDeck = deck.slice(1);

    setBalance((prev) => prev - roundBet);
    setRoundBet(doubledBet);
    setHasDoubled(true);
    setPlayerHand(newPlayerHand);
    setDeck(remainingDeck);

    if (handTotal(newPlayerHand) > 21) {
      endGame("Double down bust! Dealer wins", doubledBet);
      return;
    }

    playDealerAndFinish(newPlayerHand, remainingDeck, doubledBet);
  }

  function openGallery(cards, index) {
    playClick();
    setGalleryCards(cards);
    setGalleryIndex(index);
  }

  function closeGallery() {
    playClick();
    setGalleryCards([]);
    setGalleryIndex(null);
  }

  function previousCard() {
    playClick();

    setGalleryIndex((current) =>
      current === 0 ? galleryCards.length - 1 : current - 1
    );
  }

  function nextCard() {
    playClick();

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

          <select
            value={theme}
            onChange={(e) => {
              playClick();
              setTheme(e.target.value);
            }}
          >
            <option value="midnight">Midnight Table</option>
            <option value="ruby">Ruby Table</option>
            <option value="emerald">Emerald Table</option>
          </select>
        </div>

        <div className="bank-box">
          <div>Balance: {balance}</div>
          <div>Bet: {gameStarted ? roundBet : bet}</div>
        </div>

        <div className="chip-row">
          <button
            className="chip-button"
            onClick={() => placeBet(25)}
            disabled={gameStarted}
          >
            25
          </button>

          <button
            className="chip-button"
            onClick={() => placeBet(50)}
            disabled={gameStarted}
          >
            50
          </button>

          <button
            className="chip-button"
            onClick={() => placeBet(100)}
            disabled={gameStarted}
          >
            100
          </button>

          <button
            className="chip-button"
            onClick={() => placeBet(250)}
            disabled={gameStarted}
          >
            250
          </button>
        </div>

        <div className="button-grid">
          <button
            className="primary-button"
            onClick={newGame}
            disabled={gameStarted}
          >
            New Game
          </button>

          <button
            className="reset-button"
            onClick={resetBank}
            disabled={gameStarted}
          >
            Reset Bank
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

          <button
            className="double-button"
            onClick={doubleDown}
            disabled={!canDoubleDown}
          >
            Double
          </button>
        </div>

        <div className="status-box">
          <strong>{message}</strong>
          <div>Player: {playerTotal}</div>
          <div>Dealer: {dealerTotal}</div>
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
              onClick={() => {
                playClick();
                setShowResultOverlay(false);
              }}
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
              <div>Player: {playerTotal}</div>
              <div>Dealer: {handTotal(dealerHand)}</div>
              <div>Bet: {roundBet}</div>
              <div>Balance: {balance}</div>
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
