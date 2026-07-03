import React from "react";

export default function ChipStack({
  bet,
  roundBet,
  gameStarted,
}) {
  const activeBet = gameStarted ? roundBet : bet;

  if (!activeBet || activeBet <= 0) return null;

  const chips = buildChipStack(activeBet);

  return (
    <div className="chip-stack-box">
      <div className="chip-stack-label">
        Current Bet
      </div>

      <div className="chip-stack">
        {chips.map((chip, index) => (
          <div
            key={`${chip}-${index}`}
            className={`stack-chip chip-${chip}`}
            style={{
              bottom: `${index * 7}px`,
              zIndex: index + 1,
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      <div className="chip-stack-total">
        {activeBet} Credits
      </div>
    </div>
  );
}

function buildChipStack(amount) {
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
