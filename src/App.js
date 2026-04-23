import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const suits = ["C", "D", "H", "S"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const DECK_FOLDER = "/cards-public";

const tableThemes = [
  { id: "ruby", label: "Ruby Table", className: "theme-ruby" },
  { id: "emerald", label: "Emerald Table", className: "theme-emerald" },
  { id: "midnight", label: "Midnight Table", className: "theme-midnight" },
];

function buildDeck() {
  const deck = [];
  for (const s of suits) {
    for (const v of values) {
      deck.push(v + s);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getCardValue(card) {
  const v = card.slice(0, -1);
  if (v === "A") return 11;
  if (v === "J" || v === "Q" || v === "K") return 10;
  return parseInt(v, 10);
}

function getHandValue(hand) {
  let total = 0;
  let aces = 0;

  for (const c of hand) {
    const val = getCardValue(c);
    total += val;
    if (val === 11) aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

export default function App() {
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [message, setMessage] = useState("Click New Game to start");
  const [gameOver, setGameOver] = useState(true);
  const [dealerRevealed, setDealerRevealed] = useState(true);
  const [table, setTable] = useState("emerald");
  const [soundOn, setSoundOn] = useState(true);
  const [resultType, setResultType] = useState("none");
  const [resultOpen, setResultOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const audioCtxRef = useRef(null);

  const cardImage = (card) => `${DECK_FOLDER}/${card}.jpg`;
  const backImage = `${DECK_FOLDER}/Back-Cover.jpg`;

  const tableClass =
    tableThemes.find((t) => t.id === table)?.className || "theme-emerald";

  const playerTotal = useMemo(() => getHandValue(player), [player]);
  const dealerTotal = useMemo(
    () => (dealerRevealed ? getHandValue(dealer) : getCardValue(dealer[0] || "0")),
    [dealer, dealerRevealed]
  );

  const visibleCards = useMemo(() => {
    const dealerCards = dealer.map((card, i) => ({
      src: i === 1 && !dealerRevealed ? backImage : cardImage(card),
      alt: "Dealer card",
    }));

    const playerCards = player.map((card) => ({
      src: cardImage(card),
      alt: "Player card",
    }));

    return [...dealerCards, ...playerCards];
  }, [dealer, player, dealerRevealed]);

  const expandedImage =
    expandedIndex !== null && visibleCards[expandedIndex]
      ? visibleCards[expandedIndex]
      : null;

  useEffect(() => {
    if (expandedIndex === null) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setExpandedIndex(null);
      } else if (e.key === "ArrowRight") {
        setExpandedIndex((prev) =>
          prev === null ? 0 : (prev + 1) % visibleCards.length
        );
      } else if (e.key === "ArrowLeft") {
        setExpandedIndex((prev) =>
          prev === null ? 0 : (prev - 1 + visibleCards.length) % visibleCards.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedIndex, visibleCards.length]);

  function getAudioContext() {
    if (!soundOn) return null;
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function beep({ frequency = 440, duration = 0.08, type = "sine", volume = 0.03 }) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  function playDealSound() {
    beep({ frequency: 460, duration: 0.05, type: "triangle", volume: 0.025 });
  }

  function playFlipSound() {
    beep({ frequency: 320, duration: 0.06, type: "square", volume: 0.02 });
  }

  function playWinSound() {
    beep({ frequency: 520, duration: 0.08, type: "triangle", volume: 0.03 });
    window.setTimeout(() => {
      beep({ frequency: 660, duration: 0.09, type: "triangle", volume: 0.03 });
    }, 90);
    window.setTimeout(() => {
      beep({ frequency: 820, duration: 0.11, type: "triangle", volume: 0.03 });
    }, 180);
  }

  function playLoseSound() {
    beep({ frequency: 300, duration: 0.09, type: "sawtooth", volume: 0.03 });
    window.setTimeout(() => {
      beep({ frequency: 230, duration: 0.11, type: "sawtooth", volume: 0.03 });
    }, 90);
  }

  function playPushSound() {
    beep({ frequency: 430, duration: 0.08, type: "sine", volume: 0.025 });
    window.setTimeout(() => {
      beep({ frequency: 430, duration: 0.08, type: "sine", volume: 0.025 });
    }, 90);
  }

  function openResult(type, text) {
    setResultType(type);
    setMessage(text);
    setGameOver(true);

    if (type === "win") playWinSound();
    if (type === "lose") playLoseSound();
    if (type === "push") playPushSound();

    window.setTimeout(() => {
      setResultOpen(true);
    }, 180);
  }

  function startGame() {
    setResultOpen(false);
    setResultType("none");
    setExpandedIndex(null);
    setIsShuffling(true);
    setMessage("Shuffling...");
    setDealer([]);
    setPlayer([]);
    setDealerRevealed(true);

    window.setTimeout(() => {
      const newDeck = buildDeck();
      const p = [newDeck.pop(), newDeck.pop()];
      const d = [newDeck.pop(), newDeck.pop()];

      setDeck(newDeck);
      setPlayer(p);
      setDealer(d);
      setGameOver(false);
      setDealerRevealed(false);
      setMessage("Your move");
      setIsShuffling(false);

      playDealSound();
      window.setTimeout(playDealSound, 90);
      window.setTimeout(playDealSound, 180);
      window.setTimeout(playDealSound, 270);
    }, 700);
  }

  function hit() {
    if (gameOver || isShuffling) return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    if (!card) return;

    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck(newDeck);
    playDealSound();

    if (getHandValue(newPlayer) > 21) {
      setDealerRevealed(true);
      playFlipSound();
      openResult("lose", "Bust! Dealer wins");
    }
  }

  function stand() {
    if (gameOver || isShuffling) return;

    const newDeck = [...deck];
    const newDealer = [...dealer];

    setDealerRevealed(true);
    playFlipSound();

    window.setTimeout(() => {
      while (getHandValue(newDealer) < 17) {
        const card = newDeck.pop();
        if (!card) break;
        newDealer.push(card);
        playDealSound();
      }

      setDealer(newDealer);
      setDeck(newDeck);

      const p = getHandValue(player);
      const d = getHandValue(newDealer);

      if (d > 21 || p > d) {
        openResult("win", "You win!");
      } else if (p < d) {
        openResult("lose", "Dealer wins");
      } else {
        openResult("push", "Push");
      }
    }, 320);
  }

  function openExpandedCard(index) {
    if (isShuffling) return;
    setExpandedIndex(index);
  }

  function closeExpandedImage() {
    setExpandedIndex(null);
  }

  function showPrevImage() {
    if (!visibleCards.length) return;
    setExpandedIndex((prev) =>
      prev === null ? 0 : (prev - 1 + visibleCards.length) % visibleCards.length
    );
  }

  function showNextImage() {
    if (!visibleCards.length) return;
    setExpandedIndex((prev) =>
      prev === null ? 0 : (prev + 1) % visibleCards.length
    );
  }

  return (
    <div className={`app ${tableClass}`}>
      <div
        className="bg-image-layer"
        style={{ backgroundImage: "url('/casino-bg.jpg')" }}
      />
      <div className="bg-color-layer" />

      <div className="desktop-layout">
        <aside className="side-panel">
          <div className="panel-room-glow" />

          <h1 className="app-title">Play Your Photos Blackjack</h1>

          <div className="control-panel side-box">
            <div className="control-group">
              <label className="control-label">Table Theme</label>
              <select
                className="control-select"
                value={table}
                onChange={(e) => setTable(e.target.value)}
              >
                {tableThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group sound-group">
              <label className="control-label">Sound</label>
              <button
                className={`sound-toggle ${soundOn ? "sound-on" : "sound-off"}`}
                onClick={() => setSoundOn((prev) => !prev)}
              >
                {soundOn ? "Sound On" : "Sound Off"}
              </button>
            </div>
          </div>

          <div className="buttons side-box">
            <button className="primary-button" onClick={startGame}>
              New Game
            </button>
            <button
              className="secondary-button"
              onClick={hit}
              disabled={gameOver || isShuffling}
            >
              Hit
            </button>
            <button
              className="secondary-button"
              onClick={stand}
              disabled={gameOver || isShuffling}
            >
              Stand
            </button>
          </div>

          <div className="status side-box">
            {message}
            {!gameOver && !isShuffling && (
              <div className="totals">
                <span>Player: {playerTotal}</span>
                <span>Dealer: {dealerTotal}</span>
              </div>
            )}
          </div>
        </aside>

        <main className="game-panel">
          <h2>Dealer</h2>
          <div className="hand dealer-hand">
            {dealer.map((card, i) => {
              const imageSrc =
                i === 1 && !dealerRevealed ? backImage : cardImage(card);
              const combinedIndex = i;

              return (
                <img
                  key={i}
                  src={imageSrc}
                  alt="Dealer card"
                  className={`card-image ${
                    i === 1 && !dealerRevealed ? "dealer-hidden" : ""
                  }`}
                  onClick={() => openExpandedCard(combinedIndex)}
                />
              );
            })}
          </div>

          <h2>Player</h2>
          <div className="hand player-hand">
            {player.map((card, i) => {
              const imageSrc = cardImage(card);
              const combinedIndex = dealer.length + i;

              return (
                <img
                  key={i}
                  src={imageSrc}
                  alt="Player card"
                  className="card-image"
                  onClick={() => openExpandedCard(combinedIndex)}
                />
              );
            })}
          </div>
        </main>
      </div>

      {isShuffling && (
        <div className="shuffle-overlay">
          <div className="shuffle-box">
            <div className="shuffle-deck-stack">
              <img
                src={backImage}
                alt="Shuffle"
                className="shuffle-card-image shuffle-card-1"
              />
              <img
                src={backImage}
                alt="Shuffle"
                className="shuffle-card-image shuffle-card-2"
              />
              <img
                src={backImage}
                alt="Shuffle"
                className="shuffle-card-image shuffle-card-3"
              />
            </div>
            <div className="shuffle-text">Shuffling...</div>
          </div>
        </div>
      )}

      {resultOpen && (
        <div
          className={`result-overlay ${resultType}`}
          onClick={() => setResultOpen(false)}
        >
          <div className="result-card" onClick={(e) => e.stopPropagation()}>
            <div className="result-title">
              {resultType === "win" && "You Win"}
              {resultType === "lose" && "Dealer Wins"}
              {resultType === "push" && "Push"}
            </div>
            <div className="result-text">{message}</div>
            <button className="primary-button" onClick={() => setResultOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {expandedImage && (
        <div className="image-overlay" onClick={closeExpandedImage}>
          <div className="image-overlay-inner" onClick={(e) => e.stopPropagation()}>
            <button className="image-close-button" onClick={closeExpandedImage}>
              ×
            </button>

            {visibleCards.length > 1 && (
              <>
                <button
                  className="image-nav-button image-nav-left"
                  onClick={showPrevImage}
                >
                  ‹
                </button>
                <button
                  className="image-nav-button image-nav-right"
                  onClick={showNextImage}
                >
                  ›
                </button>
              </>
            )}

            <img
              src={expandedImage.src}
              alt={expandedImage.alt}
              className="image-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
