import { useEffect, useMemo, useState } from "react";

const SETS = {
  Bedroom: {
    label: "Stella in the Bedroom",
    folder: "/stella/public-set-01",
    backImage: "/stella/public-set-01/back-cover.jpg",
    backPreview: "/stella/public-set-01/back-cover.jpg",
    phases: [
      {
        rounds: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        rewardImages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        rounds: [
          [10, 11, 12],
          [13, 14, 15],
          [16, 17, 18],
        ],
        rewardImages: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      },
      {
        rounds: [
          [19, 20, 21],
          [22, 23, 24],
          [25, 26, 1],
        ],
        rewardImages: [19, 20, 21, 22, 23, 24, 25, 26, 1],
      },
    ],
    finalUnlockImages: Array.from({ length: 26 }, (_, i) => i + 1),
  },
  Lounge: {
    label: "Stella in the Lounge",
    folder: "/stella/public-set-02",
    backImage: "/stella/public-set-02/back-cover.jpg",
    backPreview: "/stella/public-set-02/back-cover.jpg",
    phases: [
      {
        rounds: [
          [27, 28, 29],
          [30, 31, 32],
          [33, 34, 35],
        ],
        rewardImages: [27, 28, 29, 30, 31, 32, 33, 34, 35],
      },
      {
        rounds: [
          [36, 37, 38],
          [39, 40, 41],
          [42, 43, 44],
        ],
        rewardImages: [36, 37, 38, 39, 40, 41, 42, 43, 44],
      },
      {
        rounds: [
          [45, 46, 47],
          [48, 49, 50],
          [51, 52, 27],
        ],
        rewardImages: [45, 46, 47, 48, 49, 50, 51, 52, 27],
      },
    ],
    finalUnlockImages: Array.from({ length: 26 }, (_, i) => i + 27),
  },
};

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function buildRoundDeck(setName, phaseIndex, roundIndex) {
  const set = SETS[setName];
  const roundPairs = set.phases[phaseIndex].rounds[roundIndex];
  const cards = [];

  roundPairs.forEach((pairNumber) => {
    const padded = padNumber(pairNumber);

    cards.push({
      id: `${padded}-a`,
      pairId: padded,
      image: `${set.folder}/img-${padded}-a.jpg`,
      backImage: set.backImage,
      flipped: false,
      matched: false,
    });

    cards.push({
      id: `${padded}-b`,
      pairId: padded,
      image: `${set.folder}/img-${padded}-b.jpg`,
      backImage: set.backImage,
      flipped: false,
      matched: false,
    });
  });

  return shuffleArray(cards);
}

function buildRewardImages(setName, phaseIndex) {
  const set = SETS[setName];
  const phase = set.phases[phaseIndex];

  return phase.rewardImages.flatMap((num) => {
    const padded = padNumber(num);
    return [
      `${set.folder}/img-${padded}-a.jpg`,
      `${set.folder}/img-${padded}-b.jpg`,
    ];
  });
}

function buildFinalUnlockImages(setName) {
  const set = SETS[setName];

  return set.finalUnlockImages.flatMap((num) => {
    const padded = padNumber(num);
    return [
      `${set.folder}/img-${padded}-a.jpg`,
      `${set.folder}/img-${padded}-b.jpg`,
    ];
  });
}

export default function MatchGame() {
  const [selectedSet, setSelectedSet] = useState("Bedroom");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);

  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(SETS.Bedroom.backPreview);

  const [showReward, setShowReward] = useState(false);
  const [showFinalUnlock, setShowFinalUnlock] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const totalPairsThisRound = 3;

  const matchedPairs = useMemo(() => {
    const unique = new Set(
      cards.filter((card) => card.matched).map((card) => card.pairId)
    );
    return unique.size;
  }, [cards]);

  const rewardImages = useMemo(
    () => buildRewardImages(selectedSet, phaseIndex),
    [selectedSet, phaseIndex]
  );

  const finalUnlockImages = useMemo(
    () => buildFinalUnlockImages(selectedSet),
    [selectedSet]
  );

  useEffect(() => {
    setPreviewImage(SETS[selectedSet].backPreview);
    resetWholeGame(selectedSet);
  }, [selectedSet]);

  useEffect(() => {
    if (!showFinalUnlock) return;

    if (timeLeft <= 0) {
      setShowFinalUnlock(false);
      resetWholeGame(selectedSet);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [showFinalUnlock, timeLeft, selectedSet]);

  function loadRound(setName, nextPhaseIndex, nextRoundIndex) {
    setCards(buildRoundDeck(setName, nextPhaseIndex, nextRoundIndex));
    setSelectedCards([]);
    setIsLocked(false);
    setShowReward(false);
  }

  function resetWholeGame(setName = selectedSet) {
    setPhaseIndex(0);
    setRoundIndex(0);
    setShowReward(false);
    setShowFinalUnlock(false);
    setTimeLeft(300);
    setSelectedImage(null);
    setCards(buildRoundDeck(setName, 0, 0));
    setSelectedCards([]);
    setIsLocked(false);
  }

  function handleCardClick(card) {
    if (isLocked || showReward || showFinalUnlock) return;
    if (card.flipped || card.matched) return;

    const flippedCard = { ...card, flipped: true };

    setCards((prev) => prev.map((c) => (c.id === card.id ? flippedCard : c)));

    const nextSelected = [...selectedCards, flippedCard];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setIsLocked(true);

      const [first, second] = nextSelected;

      if (first.pairId === second.pairId) {
        window.setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c) =>
              c.pairId === first.pairId ? { ...c, matched: true } : c
            );

            const uniqueMatched = new Set(
              updated.filter((c) => c.matched).map((c) => c.pairId)
            ).size;

            if (uniqueMatched >= totalPairsThisRound) {
              window.setTimeout(() => {
                if (roundIndex < 2) {
                  const nextRound = roundIndex + 1;
                  setRoundIndex(nextRound);
                  loadRound(selectedSet, phaseIndex, nextRound);
                } else {
                  setShowReward(true);
                }
              }, 250);
            }

            return updated;
          });

          setSelectedCards([]);
          setIsLocked(false);
        }, 350);
      } else {
        window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, flipped: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsLocked(false);
        }, 900);
      }
    }
  }

  function handleContinue() {
    if (phaseIndex < 2) {
      const nextPhase = phaseIndex + 1;
      setPhaseIndex(nextPhase);
      setRoundIndex(0);
      loadRound(selectedSet, nextPhase, 0);
    } else {
      setShowReward(false);
      setShowFinalUnlock(true);
      setTimeLeft(300);
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div className="match-page">
      <div className="match-shell">
        <header className="match-header">
          <h1 className="match-title">Stella - Match Me</h1>
          <p className="match-subtitle">
            Preview edition • Match 3 pairs to unlock each stage.
          </p>
        </header>

        <div className="match-controls">
          <select
            className="match-select"
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            disabled={showReward || showFinalUnlock}
          >
            <option value="Bedroom">Bedroom</option>
            <option value="Lounge">Lounge</option>
          </select>

          <button
            className="match-button primary"
            onClick={() => resetWholeGame()}
          >
            Reset
          </button>
        </div>

        <div className="set-preview-wrap">
          <div className="set-label">{SETS[selectedSet].label}</div>
          <div className="set-preview">
            <img src={previewImage} alt={`${selectedSet} card back preview`} />
          </div>
        </div>

        {!showReward && !showFinalUnlock && (
          <div className="match-status">
            Stage {phaseIndex + 1} of 3 • Round {roundIndex + 1} of 3 •{" "}
            {matchedPairs}/{totalPairsThisRound} pairs
          </div>
        )}

        {!showReward && !showFinalUnlock && (
          <div className="match-grid">
            {cards.map((card) => {
              const isVisible = card.flipped || card.matched;

              return (
                <button
                  key={card.id}
                  type="button"
                  className={`memory-card ${card.matched ? "matched" : ""}`}
                  onClick={() => handleCardClick(card)}
                >
                  <img
                    src={isVisible ? card.image : card.backImage}
                    alt={isVisible ? `Pair ${card.pairId}` : "card back"}
                    className="memory-image"
                  />
                </button>
              );
            })}
          </div>
        )}

        {showReward && !showFinalUnlock && (
          <>
            <div className="overlay-inline">
              <div className="overlay-card">
                <h2 className="overlay-title">Reward Unlocked</h2>
                <p className="overlay-text">
                  You completed Stage {phaseIndex + 1}. These are the 18 preview
                  images unlocked for this stage.
                </p>
                <button
                  className="match-button primary"
                  onClick={handleContinue}
                >
                  {phaseIndex < 2
                    ? "Continue"
                    : "Unlock All 26 Pairs for 5 Minutes"}
                </button>
              </div>
            </div>

            <div className="gallery-grid">
              {rewardImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="gallery-card"
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt="Reward" className="gallery-image" />
                </button>
              ))}
            </div>
          </>
        )}

        {showFinalUnlock && (
          <>
            <div className="overlay-inline">
              <div className="overlay-card">
                <h2 className="overlay-title">Full Preview Unlocked</h2>
                <p className="overlay-text">
                  All 26 pairs are unlocked for {formatTime(timeLeft)}.
                </p>
                <button
                  className="match-button primary"
                  onClick={() => resetWholeGame()}
                >
                  Restart
                </button>
              </div>
            </div>

            <div className="gallery-grid">
              {finalUnlockImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="gallery-card"
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt="Unlocked" className="gallery-image" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedImage && (
        <div className="image-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Expanded card" className="image-full" />
        </div>
      )}
    </div>
  );
}
