import { useState } from "react";

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
    for (const v of values) deck.push(v + s);
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
  const [table, setTable] = useState("ruby");

  const cardImage = (card) => `${DECK_FOLDER}/${card}.jpg`;
  const backImage = `${DECK_FOLDER}/Back-Cover.jpg`;

  const startGame = () => {
    const newDeck = buildDeck();
    const p = [newDeck.pop(), newDeck.pop()];
    const d = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayer(p);
    setDealer(d);
    setGameOver(false);
    setDealerRevealed(false);
    setMessage("Your move");
  };

  const hit = () => {
    if (gameOver) return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    if (!card) return;

    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck(newDeck);

    if (getHandValue(newPlayer) > 21) {
      setDealerRevealed(true);
      setMessage("Bust! Dealer wins");
      setGameOver(true);
    }
  };

  const stand = () => {
    if (gameOver) return;

    const newDeck = [...deck];
    const newDealer = [...dealer];

    setDealerRevealed(true);

    while (getHandValue(newDealer) < 17) {
      const card = newDeck.pop();
      if (!card) break;
      newDealer.push(card);
    }

    setDealer(newDealer);
    setDeck(newDeck);

    const p = getHandValue(player);
    const d = getHandValue(newDealer);

    if (d > 21 || p > d) setMessage("You win!");
    else if (p < d) setMessage("Dealer wins");
    else setMessage("Push");

    setGameOver(true);
  };

  const tableClass =
    tableThemes.find((t) => t.id === table)?.className || "theme-ruby";

  return (
    <div className={`app ${tableClass}`}>
      <h1 className="app-title">Play Your Photos Blackjack</h1>

      <div className="control-panel">
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
      </div>

      <div className="buttons">
        <button className="primary-button" onClick={startGame}>
          New Game
        </button>
        <button className="secondary-button" onClick={hit}>
          Hit
        </button>
        <button className="secondary-button" onClick={stand}>
          Stand
        </button>
      </div>

      <div className="status">{message}</div>

      <h2>Dealer</h2>
      <div className="hand">
        {dealer.map((card, i) => (
          <img
            key={i}
            src={i === 1 && !dealerRevealed ? backImage : cardImage(card)}
            alt="Dealer card"
            className="card-image"
          />
        ))}
      </div>

      <h2>Player</h2>
      <div className="hand">
        {player.map((card, i) => (
          <img
            key={i}
            src={cardImage(card)}
            alt="Player card"
            className="card-image"
          />
        ))}
      </div>
    </div>
  );
}
