import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import fullDeck from "../data/fullDeck.js";
import Card from "../components/Card";
import LauncherOverlay from "../components/blackjack/LauncherOverlay";
import InsuranceOverlay from "../components/blackjack/InsuranceOverlay";

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

const defaultStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  splits: 0,
  doubleDowns: 0,
  highestBalance: 1000,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadStats() {
  try {
    const saved = localStorage.getItem("memoryDeckBlackjackStats");
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

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

  if (lower.includes("push") || lower.includes("draw")) return "draw";
  if (lower.includes("dealer bust")) return "win";
  if (lower.includes("dealer blackjack wins")) return "lose";
  if (lower.includes("dealer wins")) return "lose";
  if (lower.includes("you win")) return "win";
  if (lower.includes("blackjack")) return "win";
  if (lower.includes("bust")) return "lose";

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
  const [dealerAnimating, setDealerAnimating] = useState(false);
  const [message, setMessage] = useState("Click New Game to start");

  const [galleryCards, setGalleryCards] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);

  const [showInsuranceOverlay, setShowInsuranceOverlay] = useState(false);
  const [pendingPlayerBlackjack, setPendingPlayerBlackjack] = useState(false);
  const [pendingDealerBlackjack, setPendingDealerBlackjack] = useState(false);

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

  const [showLauncher, setShowLauncher] = useState(false);
  const [launcherText, setLauncherText] = useState("Loading Memory Deck...");
  const [launcherStep, setLauncherStep] = useState(0);

  const [stats, setStats] = useState(loadStats);

  const currentTheme = tableThemes[theme];
  const activePlayerHand = playerHands[activeHandIndex] || [];
  const playerTotal = handTotal(activePlayerHand);

  const dealerTotal = dealerRevealed
    ? handTotal(dealerHand)
    : dealerHand[0]
    ? cardValue(dealerHand[0].rank)
    : 0;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  const insuranceAmount = Math.floor(roundBet / 2);

  const canDoubleDown =
    gameStarted &&
    !dealerAnimating &&
    !splitMode &&
    !dealerRevealed &&
    !showInsuranceOverlay &&
    activePlayerHand.length === 2 &&
    balance >= roundBet &&
    !hasDoubled;

  const canSplit =
    gameStarted &&
    !dealerAnimating &&
    !splitMode &&
    !dealerRevealed &&
    !showInsuranceOverlay &&
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

  function saveStats(nextStats) {
    setStats(nextStats);
    localStorage.setItem("memoryDeckBlackjackStats", JSON.stringify(nextStats));
  }

  function updateStats(updater) {
    setStats((current) => {
      const nextStats = updater(current);
      localStorage.setItem("memoryDeckBlackjackStats", JSON.stringify(nextStats));
      return nextStats;
    });
  }

  function updateHighestBalance(nextBalance) {
    updateStats((current) => ({
      ...current,
      highestBalance: Math.max(current.highestBalance, nextBalance),
    }));
  }

  function resetStats() {
    playClick();
    saveStats(defaultStats);
  }

  function recordSingleResult(finalMessage, blackjackPayout = false) {
    const type = resultType(finalMessage);

    updateStats((current) => ({
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      wins: current.wins + (type === "win" ? 1 : 0),
      losses: current.losses + (type === "lose" ? 1 : 0),
      pushes: current.pushes + (type === "draw" ? 1 : 0),
      blackjacks: current.blackjacks + (blackjackPayout ? 1 : 0),
    }));
  }

  function recordSplitResults(results) {
    updateStats((current) => ({
      ...current,
      gamesPlayed: current.gamesPlayed + results.length,
      wins: current.wins + results.filter((r) => r.outcome === "win").length,
      losses:
        current.losses + results.filter((r) => r.outcome === "lose").length,
      pushes:
        current.pushes + results.filter((r) => r.outcome === "draw").length,
    }));
  }

  function placeBet(amount) {
    if (gameStarted || dealerAnimating) return;

    playClick();
    setBet(amount);
  }

  function resetBank() {
    if (gameStarted || dealerAnimating) return;

    playClick();

    setBalance(1000);
    updateHighestBalance(1000);
    setBet(50);
    setRoundBet(0);
    setHasDoubled(false);
    setPlayerHands([[]]);
    setActiveHandIndex(0);
    setSplitMode(false);
    setHandBets([0]);
    setCompletedHands([]);
    setSplitResults([]);
    setShowInsuranceOverlay(false);
    setPendingPlayerBlackjack(false);
    setPendingDealerBlackjack(false);
    setMessage("Bank reset to 1000");
  }

  function settleSingleBet(
    finalMessage,
    finalRoundBet,
    blackjackPayout = false
  ) {
    const type = resultType(finalMessage);

    let payout = 0;

    if (blackjackPayout) {
      payout = Math.floor(finalRoundBet * 2.5);
    } else if (type === "win") {
      payout = finalRoundBet * 2;
    } else if (type === "draw") {
      payout = finalRoundBet;
    }

    if (payout > 0) {
      setBalance((prev) => {
        const nextBalance = prev + payout;
        updateHighestBalance(nextBalance);
        return nextBalance;
      });
    }
  }

  function settleSplitBets(results) {
    let payout = 0;

    results.forEach((result) => {
      if (result.outcome === "win") payout += result.bet * 2;
      if (result.outcome === "draw") payout += result.bet;
    });

    if (payout > 0) {
      setBalance((prev) => {
        const nextBalance = prev + payout;
        updateHighestBalance(nextBalance);
        return nextBalance;
      });
    }
  }

  function finishSingleGame(
    finalMessage,
    finalRoundBet = roundBet,
    blackjackPayout = false
  ) {
    setShowInsuranceOverlay(false);
    setGameStarted(false);
    setDealerAnimating(false);
    setMessage(finalMessage);

    settleSingleBet(finalMessage, finalRoundBet, blackjackPayout);
    recordSingleResult(finalMessage, blackjackPayout);

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

  function endGame(
    finalMessage,
    finalRoundBet = roundBet,
    blackjackPayout = false
  ) {
    setShowInsuranceOverlay(false);
    setDealerRevealed(true);
    playDeal();
    finishSingleGame(finalMessage, finalRoundBet, blackjackPayout);
  }

  async function animateDealerDraw(startDealerHand, startDeck) {
    let animatedDealerHand = [...startDealerHand];
    let animatedDeck = [...startDeck];

    setDealerAnimating(true);
    setDealerRevealed(true);
    setMessage("Dealer reveals card");
    playDeal();

    await sleep(650);

    while (handTotal(animatedDealerHand) < 17 && animatedDeck.length > 0) {
      const nextCard = animatedDeck[0];

      animatedDeck = animatedDeck.slice(1);
      animatedDealerHand = [...animatedDealerHand, nextCard];

      setMessage("Dealer draws...");
      setDealerHand(animatedDealerHand);
      setDeck(animatedDeck);
      playDeal();

      await sleep(700);
    }

    return {
      finalDealerHand: animatedDealerHand,
      finalDeck: animatedDeck,
    };
  }

  async function finishSplitGame(finalHands, remainingDeck, finalCompletedHands) {
    setGameStarted(false);

    const { finalDealerHand, finalDeck } = await animateDealerDraw(
      dealerHand,
      remainingDeck
    );

    const finalDealerTotal = handTotal(finalDealerHand);

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

    setDealerHand(finalDealerHand);
    setDeck(finalDeck);
    setCompletedHands(finalCompletedHands);
    setSplitResults(results);
    setDealerRevealed(true);
    setDealerAnimating(false);

    settleSplitBets(results);
    recordSplitResults(results);

    const wins = results.filter((r) => r.outcome === "win").length;
    const losses = results.filter((r) => r.outcome === "lose").length;
    const draws = results.filter((r) => r.outcome === "draw").length;

    setMessage(`Split finished — ${wins} win, ${losses} lose, ${draws} push`);

    if (wins > losses) {
      playWin();
    } else if (losses > wins) {
      playLose();
    } else {
      playClick();
    }

    setTimeout(() => {
      setShowResultOverlay(true);
    }, 450);
  }

  async function newGame() {
    if (gameStarted || dealerAnimating) return;

    playClick();

    if (balance < bet) {
      setMessage("Not enough balance");
      playLose();
      return;
    }

    setShowLauncher(true);
    setLauncherStep(1);
    setLauncherText("Loading Memory Deck...");
    setDealerAnimating(true);

    await sleep(500);

    setLauncherStep(2);
    setLauncherText("Loading Valkyra Artwork...");

    await sleep(500);

    setLauncherStep(3);
    setLauncherText("Shuffling Deck...");
    playDeal();

    await sleep(500);

    setLauncherStep(4);
    setLauncherText("Entering Blackjack Table...");

    await sleep(500);

    const freshDeck = shuffleDeck(fullDeck);

    const player = [freshDeck[0], freshDeck[2]];
    const dealer = [freshDeck[1], freshDeck[3]];

    const playerHasBlackjack = isBlackjack(player);
    const dealerHasBlackjack = isBlackjack(dealer);

    setBalance((prev) => prev - bet);
    setRoundBet(bet);
    setDeck(freshDeck.slice(4));

    setPlayerHands([[]]);
    setDealerHand([]);
    setDealerRevealed(false);
    setGameStarted(true);
    setShowResultOverlay(false);
    setHasDoubled(false);
    setActiveHandIndex(0);
    setSplitMode(false);
    setHandBets([bet]);
    setCompletedHands([false]);
    setSplitResults([]);
    setPendingPlayerBlackjack(playerHasBlackjack);
    setPendingDealerBlackjack(dealerHasBlackjack);

    setShowLauncher(false);

    setMessage("Dealing dealer card...");
    setDealerHand([dealer[0]]);
    playDeal();
    await sleep(360);

    setMessage("Dealing player card...");
    setPlayerHands([[player[0]]]);
    playDeal();
    await sleep(360);

    setMessage("Dealing dealer hole card...");
    setDealerHand([dealer[0], dealer[1]]);
    playDeal();
    await sleep(360);

    setMessage("Dealing player card...");
    setPlayerHands([[player[0], player[1]]]);
    playDeal();
    await sleep(360);

    setDealerAnimating(false);

    if (dealer[0]?.rank === "A") {
      setShowInsuranceOverlay(true);
      setMessage("Dealer shows Ace — insurance?");
      return;
    }

    setMessage("Your move");

    if (playerHasBlackjack || dealerHasBlackjack) {
      await sleep(450);

      if (playerHasBlackjack && dealerHasBlackjack) {
        endGame("Blackjack push — draw", bet, false);
      } else if (playerHasBlackjack) {
        endGame("Blackjack! You win 3:2", bet, true);
      } else {
        endGame("Dealer Blackjack wins", bet, false);
      }
    }
  }

  function finishInsuranceChoice(tookInsurance) {
    playClick();

    if (tookInsurance) {
      if (balance < insuranceAmount) {
        setMessage("Not enough balance for insurance");
        playLose();
        return;
      }

      setBalance((prev) => prev - insuranceAmount);
    }

    setShowInsuranceOverlay(false);

    if (pendingDealerBlackjack && tookInsurance) {
      const insurancePayout = insuranceAmount * 3;

      setBalance((prev) => {
        const nextBalance = prev + insurancePayout;
        updateHighestBalance(nextBalance);
        return nextBalance;
      });
    }

    if (pendingPlayerBlackjack && pendingDealerBlackjack) {
      endGame("Blackjack push — draw", roundBet, false);
      return;
    }

    if (pendingDealerBlackjack) {
      endGame("Dealer Blackjack wins", roundBet, false);
      return;
    }

    if (pendingPlayerBlackjack) {
      endGame("Blackjack! You win 3:2", roundBet, true);
      return;
    }

    if (tookInsurance) {
      setMessage("Insurance lost — your move");
    } else {
      setMessage("Your move");
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
    if (
      !gameStarted ||
      dealerRevealed ||
      dealerAnimating ||
      showInsuranceOverlay ||
      deck.length === 0
    ) {
      return;
    }

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

  async function playDealerAndFinish(finalPlayerHand, remainingDeck, finalRoundBet) {
    setGameStarted(false);

    const { finalDealerHand, finalDeck } = await animateDealerDraw(
      dealerHand,
      remainingDeck
    );

    const finalPlayer = handTotal(finalPlayerHand);
    const finalDealer = handTotal(finalDealerHand);

    setDealerHand(finalDealerHand);
    setDeck(finalDeck);

    if (finalDealer > 21) {
      finishSingleGame("Dealer busts — you win!", finalRoundBet);
    } else if (finalPlayer > finalDealer) {
      finishSingleGame("You win!", finalRoundBet);
    } else if (finalPlayer < finalDealer) {
      finishSingleGame("Dealer wins", finalRoundBet);
    } else {
      finishSingleGame("Push — draw", finalRoundBet);
    }
  }

  function stand() {
    if (!gameStarted || dealerRevealed || dealerAnimating || showInsuranceOverlay) {
      return;
    }

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

    updateStats((current) => ({
      ...current,
      doubleDowns: current.doubleDowns + 1,
    }));

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

    updateStats((current) => ({
      ...current,
      splits: current.splits + 1,
    }));

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

  const activeResultType =
    splitMode && splitResults.length > 0
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
        <Link
          to="/platform"
          className="game-back-button"
          onClick={() => playClick()}
        >
          ← Back to My Memory Decks
        </Link>

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
          <div>
            Bet: {gameStarted ? handBets[activeHandIndex] || roundBet : bet}
          </div>
          {splitMode && <div>Active Hand: {activeHandIndex + 1}</div>}
          {showInsuranceOverlay && <div>Insurance: {insuranceAmount}</div>}
        </div>

        <div className="chip-row">
          {[25, 50, 100, 250].map((amount) => (
            <button
              key={amount}
              className="chip-button"
              onClick={() => placeBet(amount)}
              disabled={gameStarted || dealerAnimating}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="button-grid">
          <button
            className="primary-button"
            onClick={newGame}
            disabled={gameStarted || dealerAnimating}
          >
            New Game
          </button>

          <button
            className="reset-button"
            onClick={resetBank}
            disabled={gameStarted || dealerAnimating}
          >
            Reset Bank
          </button>

          <button
            className="game-button"
            onClick={hit}
            disabled={
              !gameStarted ||
              dealerRevealed ||
              dealerAnimating ||
              showInsuranceOverlay
            }
          >
            Hit
          </button>

          <button
            className="game-button"
            onClick={stand}
            disabled={
              !gameStarted ||
              dealerRevealed ||
              dealerAnimating ||
              showInsuranceOverlay
            }
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

          <button className="split-button" onClick={splitPair} disabled={!canSplit}>
            Split
          </button>

          <button
            className="stats-button"
            onClick={() => {
              playClick();
              setShowStatsOverlay(true);
            }}
          >
            Stats
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
                    handIndex === activeHandIndex && gameStarted ? "active" : ""
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
                    <div
                      className={`split-result ${splitResults[handIndex].outcome}`}
                    >
                      {outcomeLabel(splitResults[handIndex].outcome)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <InsuranceOverlay
        showInsuranceOverlay={showInsuranceOverlay}
        insuranceAmount={insuranceAmount}
        onTakeInsurance={() => finishInsuranceChoice(true)}
        onNoInsurance={() => finishInsuranceChoice(false)}
      />

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
                      Hand {result.handIndex + 1}:{" "}
                      {outcomeLabel(result.outcome)} — Bet {result.bet}
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

      {showStatsOverlay && (
        <div className="stats-overlay">
          <div className="stats-box">
            <button
              className="stats-close"
              onClick={() => {
                playClick();
                setShowStatsOverlay(false);
              }}
            >
              ×
            </button>

            <div className="stats-label">PLAYER PROFILE</div>
            <div className="stats-title">Memory Deck Stats</div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Hands Played</span>
                <strong>{stats.gamesPlayed}</strong>
              </div>

              <div className="stat-card">
                <span>Win Rate</span>
                <strong>{winRate}%</strong>
              </div>

              <div className="stat-card win">
                <span>Wins</span>
                <strong>{stats.wins}</strong>
              </div>

              <div className="stat-card lose">
                <span>Losses</span>
                <strong>{stats.losses}</strong>
              </div>

              <div className="stat-card">
                <span>Pushes</span>
                <strong>{stats.pushes}</strong>
              </div>

              <div className="stat-card">
                <span>Blackjacks</span>
                <strong>{stats.blackjacks}</strong>
              </div>

              <div className="stat-card">
                <span>Splits</span>
                <strong>{stats.splits}</strong>
              </div>

              <div className="stat-card">
                <span>Double Downs</span>
                <strong>{stats.doubleDowns}</strong>
              </div>

              <div className="stat-card highlight">
                <span>Highest Balance</span>
                <strong>{stats.highestBalance}</strong>
              </div>
            </div>

            <button className="stats-reset" onClick={resetStats}>
              Reset Statistics
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

      <LauncherOverlay
        showLauncher={showLauncher}
        launcherText={launcherText}
        launcherStep={launcherStep}
        title="Valkyra Blackjack"
      />
    </div>
  );
}
