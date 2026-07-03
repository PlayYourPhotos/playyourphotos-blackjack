export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shuffleDeck(deck) {
  const copy = [...deck];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function cardValue(rank) {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return Number(rank);
}

export function handTotal(hand) {
  let total = hand.reduce((sum, card) => sum + cardValue(card.rank), 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function isBlackjack(hand) {
  return hand.length === 2 && handTotal(hand) === 21;
}

export function isBust(hand) {
  return handTotal(hand) > 21;
}

export function canSplitHand(hand) {
  return hand.length === 2 && hand[0]?.rank === hand[1]?.rank;
}

export function handOutcome(playerTotal, dealerTotal) {
  if (playerTotal > 21) return "lose";
  if (dealerTotal > 21) return "win";
  if (playerTotal > dealerTotal) return "win";
  if (playerTotal < dealerTotal) return "lose";
  return "draw";
}

export function outcomeLabel(outcome) {
  if (outcome === "win") return "WIN";
  if (outcome === "lose") return "LOSE";
  return "PUSH";
}

export function resultType(message = "") {
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

export function calculateSinglePayout({
  finalMessage,
  finalRoundBet,
  blackjackPayout = false,
}) {
  const type = resultType(finalMessage);

  if (blackjackPayout) {
    return Math.floor(finalRoundBet * 2.5);
  }

  if (type === "win") {
    return finalRoundBet * 2;
  }

  if (type === "draw") {
    return finalRoundBet;
  }

  return 0;
}

export function calculateSplitPayout(results) {
  return results.reduce((total, result) => {
    if (result.outcome === "win") return total + result.bet * 2;
    if (result.outcome === "draw") return total + result.bet;
    return total;
  }, 0);
}

export function buildSplitResults({
  finalHands,
  handBets,
  roundBet,
  dealerTotal,
}) {
  return finalHands.map((hand, index) => {
    const total = handTotal(hand);
    const betForHand = handBets[index] || roundBet;
    const outcome = handOutcome(total, dealerTotal);

    return {
      handIndex: index,
      total,
      bet: betForHand,
      outcome,
    };
  });
}

export function createInitialDeal(fullDeck) {
  const freshDeck = shuffleDeck(fullDeck);

  const player = [freshDeck[0], freshDeck[2]];
  const dealer = [freshDeck[1], freshDeck[3]];

  return {
    freshDeck,
    remainingDeck: freshDeck.slice(4),
    player,
    dealer,
    playerHasBlackjack: isBlackjack(player),
    dealerHasBlackjack: isBlackjack(dealer),
  };
}

export function shouldDealerDraw(dealerHand) {
  return handTotal(dealerHand) < 17;
}

export function buildChipStack(amount) {
  const chipValues = [250, 100, 50, 25];
  const chips = [];
  let remaining = amount;

  chipValues.forEach((value) => {
    while (remaining >= value) {
      chips.push(value);
      remaining -= value;
    }
  });

  return chips;
}
