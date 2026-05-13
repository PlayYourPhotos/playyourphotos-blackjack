const suits = [
  {
    suit: "hearts",
    folder: "valkyra-hearts",
  },
  {
    suit: "diamonds",
    folder: "valkyra-diamonds",
  },
  {
    suit: "spades",
    folder: "valkyra-spades",
  },
  {
    suit: "clubs",
    folder: "valkyra-clubs",
  },
];

const ranks = [
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

const fullDeck = suits.flatMap(({ suit, folder }) =>
  ranks.map((rank) => ({
    rank,
    suit,
    image: `/cards/${folder}/${rank}.jpg`,
  }))
);

export default fullDeck;
