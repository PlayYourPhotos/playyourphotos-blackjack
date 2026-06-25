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

function handOutcome(playerTotal, dealerTotal) {
  if (playerTotal > 21) return "lose";
  if (dealerTotal > 21) return "win";
  if (playerTotal > dealerTotal) return "win";
  if (playerTotal < dealerTotal) return "lose";
  return "draw";
}

function outcomeLabel(outcome) {
  if (outcome === "win") return "WIN";
  if (outcome === "lose") return "LOSE";
  return "PUSH";
}

export default function Demo() {
  const startingDeck = useMemo(() => shuffleDeck(fullDeck), []);

  const [theme, setTheme] = useState("midnight");
  const [deck, setDeck] = useState(startingDeck);
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

  const [playerHands, setPlayerHands] = useState([[]]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [splitMode, setSplitMode] = useState(false);
  const [handBets, setHandBets] = useState([0]);
  const [completedHands, setCompletedHands] = useState([]);
  const [splitResults, setSplitResults] = useState([]);

  const currentTheme = tableThemes[theme];
  const activePlayerHand = playerHands[activeHandIndex] || [];
  const playerTotal = handTotal(activePlayerHand);

  const dealerTotal = dealerRevealed
    ? handTotal(dealerHand)
    : dealerHand[0]
    ? cardValue(dealerHand[0].rank)
    : 0;

  const canDoubleDown =
    gameStarted &&
    !splitMode &&
    !dealerRevealed &&
    activePlayerHand.length === 2 &&
    balance >= roundBet &&
    !hasDoubled;

  const canSplit =
    gameStarted &&
    !splitMode &&
    !dealerRevealed &&
    activePlayerHand.length === 2 &&
    activePlayerHand[0]?.rank === activePlayerHand[1]?.rank &&
    balance >= roundBet;

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
    setPlayerHands([[]]);
    setActiveHandIndex(0);
    setSplitMode(false);
    setHandBets([0]);
    setCompletedHands([]);
    setSplitResults([]);
    setMessage("Bank reset to 1000");
  }

  function settleSingleBet(finalMessage, finalRoundBet, blackjackPayout = false) {
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

  function settleSplitBets(results) {
    let payout = 0;

    results.forEach((result) => {
      if (result.outcome === "win") payout += result.bet * 2;
      if (result.outcome === "draw") payout += result.bet;
    });

    setBalance((prev) => prev + payout);
  }

  function endGame(finalMessage, finalRoundBet = roundBet, blackjackPayout = false) {
    setDealerRevealed(true);
    playDeal();

    setGameStarted(false);
    setMessage(finalMessage);

    settleSingleBet(finalMessage, finalRoundBet, blackjackPayout);

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

  function finishSplitGame(finalHands, remainingDeck, finalCompletedHands) {
    let newDeck = [...remainingDeck];
    let newDealerHand = [...dealerHand];

    while (handTotal(newDealerHand) < 17 && newDeck.length > 0) {
      playDeal();
      newDealerHand.push(newDeck[0]);
      newDeck = newDeck.slice(1);
    }

    const finalDealerTotal = handTotal(newDealerHand);

    const results = finalHands.map((hand, index) => {
      const total = handTotal(hand);
      const betForHand = handBets[index] || roundBet;
      const outcome = handOutcome(total, finalDealerTotal);

      return {
        handIndex: index,
        total,
        bet: betForHand,
        outcome,
      };
    });

    setDealerHand(newDealerHand);
    setDeck(newDeck);
    setCompletedHands(finalCompletedHands);
    setSplitResults(results);
    setDealerRevealed(true);
    setGameStarted(false);

    settleSplitBets(results);

    const wins = results.filter((r) => r.outcome === "win").length;
    const losses = results.filter((r) => r.outcome === "lose").length;
    const draws = results.filter((r) => r.outcome === "draw").length;

    if (wins > losses) {
      setMessage(`Split finished — ${wins} win, ${losses} lose, ${draws} push`);
      playWin();
    } else if (losses > wins) {
      setMessage(`Split finished — ${wins} win, ${losses} lose, ${draws} push`);
      playLose();
    } else {
      setMessage(`Split finished — ${wins} win, ${losses} lose, ${draws} push`);
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
    setPlayerHands([player]);
    setDealerHand(dealer);
    setDealerRevealed(false);
    setGameStarted(true);
    setShowResultOverlay(false);
    setHasDoubled(false);
    setActiveHandIndex(0);
    setSplitMode(false);
    setHandBets([bet]);
    setCompletedHands([false]);
    setSplitResults([]);
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

  function updateActiveHand(newHand, newDeck) {
    const updatedHands = [...playerHands];
    updatedHands[activeHandIndex] = newHand;

    setPlayerHands(updatedHands);
    setDeck(newDeck);

    return updatedHands;
  }

  function moveToNextSplitHand(updatedHands, updatedDeck, updatedCompletedHands) {
    const nextIndex = updatedCompletedHands.findIndex((done) => !done);

    if (nextIndex === -1) {
      finishSplitGame(updatedHands, updatedDeck, updatedCompletedHands);
      return;
    }

    setActiveHandIndex(nextIndex);
    setCompletedHands(updatedCompletedHands);
    setMessage(`Playing hand ${nextIndex + 1}`);
  }

  function hit() {
    if (!gameStarted || dealerRevealed || deck.length === 0) return;

    playClick();
    playDeal();

    const newHand = [...activePlayerHand, deck[0]];
    const newDeck = deck.slice(1);
    const updatedHands = updateActiveHand(newHand, newDeck);

    if (handTotal(newHand) > 21) {
      if (splitMode) {
        const updatedCompletedHands = [...completedHands];
        updatedCompletedHands[activeHandIndex] = true;

        setMessage(`Hand ${activeHandIndex + 1} busts`);

        moveToNextSplitHand(updatedHands, newDeck, updatedCompletedHands);
      } else {
        endGame("Bust! Dealer wins");
      }
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

    if (splitMode) {
      const updatedCompletedHands = [...completedHands];
      updatedCompletedHands[activeHandIndex] = true;

      moveToNextSplitHand(playerHands, deck, updatedCompletedHands);
      return;
    }

    playDealerAndFinish(activePlayerHand, deck, roundBet);
  }

  function doubleDown() {
    if (!canDoubleDown || deck.length === 0) return;

    playClick();
    playDeal();

    const doubledBet = roundBet * 2;
    const newPlayerHand = [...activePlayerHand, deck[0]];
    const remainingDeck = deck.slice(1);

    setBalance((prev) => prev - roundBet);
    setRoundBet(doubledBet);
    setHandBets([doubledBet]);
    setHasDoubled(true);
    setPlayerHands([newPlayerHand]);
    setDeck(remainingDeck);

    if (handTotal(newPlayerHand) > 21) {
      endGame("Double down bust! Dealer wins", doubledBet);
      return;
    }

    playDealerAndFinish(newPlayerHand, remainingDeck, doubledBet);
  }

  function splitPair() {
    if (!canSplit || deck.length < 2) return;

    playClick();
    playDeal();

    const firstCard = activePlayerHand[0];
    const secondCard = activePlayerHand[1];

    const firstHand = [firstCard, deck[0]];
    const secondHand = [secondCard, deck[1]];
    const remainingDeck = deck.slice(2);

    setBalance((prev) => prev - roundBet);
    setDeck(remainingDeck);
    setPlayerHands([firstHand, secondHand]);
    setActiveHandIndex(0);
    setSplitMode(true);
    setHandBets([roundBet, roundBet]);
    setCompletedHands([false, false]);
    setSplitResults([]);
    setHasDoubled(false);
    setMessage("Split active — playing hand 1");
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

  const activeResultType = splitMode && splitResults.length > 0
    ? splitResults.some((r) => r.outcome === "win")
      ? "win"
      : splitResults.some((r) => r.outcome === "lose")
      ? "lose"
      : "draw"
    : resultType(message);

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
          <div>Bet: {gameStarted ? handBets[activeHandIndex] || roundBet : bet}</div>
          {splitMode && <div>Active Hand: {activeHandIndex + 1}</div>}
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

          <button
            className="split-button"
            onClick={splitPair}
            disabled={!canSplit}
          >
            Split
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

          {!splitMode && (
            <div className="hand-row">
              {activePlayerHand.map((card, index) => (
                <Card
                  key={index}
                  rank={card.rank}
                  suit={card.suit}
                  image={card.image}
                  onClick={() => openGallery(activePlayerHand, index)}
                />
              ))}
            </div>
          )}

          {splitMode && (
            <div className="split-hands">
              {playerHands.map((hand, handIndex) => (
                <div
                  key={handIndex}
                  className={`split-hand ${
                    handIndex === activeHandIndex && gameStarted
                      ? "active"
                      : ""
                  }`}
                >
                  <div className="split-label">
                    Hand {handIndex + 1} — {handTotal(hand)}
                    {completedHands[handIndex] && " ✓"}
                  </div>

                  <div className="hand-row split-row">
                    {hand.map((card, cardIndex) => (
                      <Card
                        key={cardIndex}
                        rank={card.rank}
                        suit={card.suit}
                        image={card.image}
                        onClick={() => openGallery(hand, cardIndex)}
                      />
                    ))}
                  </div>

                  {splitResults[handIndex] && (
                    <div className={`split-result ${splitResults[handIndex].outcome}`}>
                      {outcomeLabel(splitResults[handIndex].outcome)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
              {!splitMode && (
                <>
                  <div>Player: {playerTotal}</div>
                  <div>Dealer: {handTotal(dealerHand)}</div>
                  <div>Bet: {roundBet}</div>
                  <div>Balance: {balance}</div>
                </>
              )}

              {splitMode && splitResults.length > 0 && (
                <>
                  <div>Dealer: {handTotal(dealerHand)}</div>
                  {splitResults.map((result) => (
                    <div key={result.handIndex}>
                      Hand {result.handIndex + 1}: {outcomeLabel(result.outcome)} — Bet {result.bet}
                    </div>
                  ))}
                  <div>Balance: {balance}</div>
                </>
              )}
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
