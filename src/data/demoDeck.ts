export const ranks = [
  "A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

export const demoDeck = ranks.map((rank) => ({
  rank,
  suit: "hearts",
  image: `/cards/demo-hearts/${rank}.jpg`,
}));
