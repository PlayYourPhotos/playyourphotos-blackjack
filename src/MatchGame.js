import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const FAMILY_DECK_STORAGE_KEY = "playYourPhotosFamilyDeck";
const FAMILY_SET = "Family";

const SETS = {
  Bedroom: {
    label: "Stella in the Bedroom",
    folder: "/stella/public-set-01",
    backImage: "/stella/public-set-01/back-cover.jpg",
    backPreview: "/stella/public-set-01/back-cover.jpg",
    phases: [
      { rounds: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], rewardImages: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { rounds: [[10, 11, 12], [13, 14, 15], [16, 17, 18]], rewardImages: [10, 11, 12, 13, 14, 15, 16, 17, 18] },
      { rounds: [[19, 20, 21], [22, 23, 24], [25, 26, 1]], rewardImages: [19, 20, 21, 22, 23, 24, 25, 26, 1] },
    ],
    finalUnlockImages: Array.from({ length: 26 }, (_, i) => i + 1),
  },

  Lounge: {
    label: "Stella in the Lounge",
    folder: "/stella/public-set-02",
    backImage: "/stella/public-set-02/back-cover.jpg",
    backPreview: "/stella/public-set-02/back-cover.jpg",
    phases: [
      { rounds: [[27, 28, 29], [30, 31, 32], [33, 34, 35]], rewardImages: [27, 28, 29, 30, 31, 32, 33, 34, 35] },
      { rounds: [[36, 37, 38], [39, 40, 41], [42, 43, 44]], rewardImages: [36, 37, 38, 39, 40, 41, 42, 43, 44] },
      { rounds: [[45, 46, 47], [48, 49, 50], [51, 52, 27]], rewardImages: [45, 46, 47, 48, 49, 50, 51, 52, 27] },
    ],
    finalUnlockImages: Array.from({ length: 26 }, (_, i) => i + 27),
  },
};

function loadFamilyDeck() {
  try {
    const saved = localStorage.getItem(FAMILY_DECK_STORAGE_KEY);
    if (!saved) return { cards: [], cardBack: null };

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      return { cards: parsed, cardBack: null };
    }

    return {
      cards: parsed.cards || [],
      cardBack: parsed.cardBack || null,
    };
  } catch {
    return { cards: [], cardBack: null };
  }
}

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

function getInitialSet(familyDeck) {
  const params = new URLSearchParams(window.location.search);
  const wantsFamily = params.get("family") === "1";

  if (wantsFamily && familyDeck.cards.length > 0) {
    return FAMILY_SET;
  }

  return "Bedroom";
}

function getFamilyRoundCards(familyDeck, phaseIndex, roundIndex) {
  const startIndex = phaseIndex * 9 + roundIndex * 3;
  const selected = [];

  for (let i = 0; i < 3; i += 1) {
    const card = familyDeck.cards[(startIndex + i) % familyDeck.cards.length];
    if (card) selected.push(card);
  }

  return selected;
}

function buildRoundDeck(setName, phaseIndex, roundIndex, familyDeck) {
  if (setName === FAMILY_SET) {
    const roundCards = getFamilyRoundCards(familyDeck, phaseIndex, roundIndex);
    const backImage =
      familyDeck.cardBack?.image || "/stella/public-set-01/back-cover.jpg";

    const cards = [];

    roundCards.forEach((photo, index) => {
      const pairId = `family-${phaseIndex}-${roundIndex}-${index}`;

      cards.push({
        id: `${pairId}-a`,
        pairId,
        image: photo.image,
        backImage,
        flipped: false,
        matched: false,
      });

      cards.push({
        id: `${pairId}-b`,
        pairId,
        image: photo.image,
        backImage,
        flipped: false,
        matched: false,
      });
    });

    return shuffleArray(cards);
  }

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

function buildRewardImages(setName, phaseIndex, familyDeck) {
  if (setName === FAMILY_SET) {
    const startIndex = phaseIndex * 9;
    return familyDeck.cards
      .slice(startIndex, startIndex + 9)
      .map((card) => card.image);
  }

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

function buildFinalUnlockImages(setName, familyDeck) {
  if (setName === FAMILY_SET) {
    return familyDeck.cards.map((card) => card.image);
  }

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
  const [familyDeck] = useState(loadFamilyDeck);
  const [selectedSet, setSelectedSet] = useState(() =>
    getInitialSet(loadFamilyDeck())
  );

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);

  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  const [previewImage, setPreviewImage] = useState(
    familyDeck.cardBack?.image || SETS.Bedroom.backPreview
  );

  const [showReward, setShowReward] = useState(false);
  const [showFinalUnlock, setShowFinalUnlock] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [galleryFadeKey, setGalleryFadeKey] = useState(0);

  const totalPairsThisRound = 3;

  const matchedPairs = useMemo(() => {
    const unique = new Set(
      cards.filter((card) => card.matched).map((card) => card.pairId)
    );

    return unique.size;
  }, [cards]);

  const rewardImages = useMemo(
    () => buildRewardImages(selectedSet, phaseIndex, familyDeck),
    [selectedSet, phaseIndex, familyDeck]
  );

  const finalUnlockImages = useMemo(
    () => buildFinalUnlockImages(selectedSet, familyDeck),
    [selectedSet, familyDeck]
  );

  const activeGalleryImage =
    galleryIndex !== null ? galleryImages[galleryIndex] : null;

  const activeLabel =
    selectedSet === FAMILY_SET ? "Family Photos" : SETS[selectedSet].label;

  const activeTitle =
    selectedSet === FAMILY_SET ? "Family Photos - Match" : "Stella - Match Me";

  const activeSubtitle =
    selectedSet === FAMILY_SET
      ? "Personal Collection • Test Edition"
      : `${selectedSet} Collection • Preview Edition`;

  useEffect(() => {
    if (selectedSet === FAMILY_SET) {
      setPreviewImage(
        familyDeck.cardBack?.image || "/stella/public-set-01/back-cover.jpg"
      );
    } else {
      setPreviewImage(SETS[selectedSet].backPreview);
    }

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

  useEffect(() => {
    function handleKeyDown(event) {
      if (!activeGalleryImage) return;

      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") previousGalleryImage();
      if (event.key === "ArrowRight") nextGalleryImage();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGalleryImage, galleryImages]);

  function loadRound(setName, nextPhaseIndex, nextRoundIndex) {
    setCards(buildRoundDeck(setName, nextPhaseIndex, nextRoundIndex, familyDeck));
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
    setCards(buildRoundDeck(setName, 0, 0, familyDeck));
    setSelectedCards([]);
    setIsLocked(false);
    closeGallery();
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

  function openGallery(images, index) {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryFadeKey((prev) => prev + 1);
  }

  function closeGallery() {
    setGalleryImages([]);
    setGalleryIndex(null);
  }

  function previousGalleryImage() {
    setGalleryIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
    setGalleryFadeKey((prev) => prev + 1);
  }

  function nextGalleryImage() {
    setGalleryIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
    setGalleryFadeKey((prev) => prev + 1);
  }

  function stopOverlayClick(event) {
    event.stopPropagation();
  }

  return (
    <div className="match-page">
      <div className="match-shell">
        <header className="match-header compact-match-header">
          <div>
            <h1 className="match-title">{activeTitle}</h1>
            <p className="match-subtitle">{activeSubtitle}</p>
          </div>

          <div className="match-header-progress">
            <Link to="/platform" className="game-back-button">
              ← Back to My Memory Decks
            </Link>

            <strong>
              Stage {phaseIndex + 1} of 3 • Round {roundIndex + 1} of 3
            </strong>

            <span>
              {matchedPairs}/{totalPairsThisRound} pairs
            </span>

            <button
              className="match-button primary compact-reset"
              onClick={() => resetWholeGame()}
            >
              Reset
            </button>
          </div>
        </header>

        <div className="match-game-layout">
          <aside className="match-side-panel">
            <div className="match-side-card combined-match-card">
              <h3>Choose Set</h3>

              <select
                className="match-select"
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                disabled={showReward || showFinalUnlock}
              >
                <option value="Bedroom">Bedroom</option>
                <option value="Lounge">Lounge</option>
                {familyDeck.cards.length > 0 && (
                  <option value={FAMILY_SET}>Family Photos</option>
                )}
              </select>

              <div className="match-side-divider" />

              <h3>{activeLabel}</h3>

              <p>
                Stage {phaseIndex + 1} / 3
                <br />
                Round {roundIndex + 1} / 3
                <br />
                {matchedPairs} of {totalPairsThisRound} pairs
              </p>
            </div>

            <div className="match-side-preview">
              <img src={previewImage} alt={`${selectedSet} card back preview`} />
            </div>
          </aside>

          <main className="match-main-area">
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
                  <div className="overlay-card stage-complete-card">
                    <div className="stage-kicker">★ Stage Complete ★</div>
                    <h2 className="overlay-title">Reward Unlocked</h2>

                    <p className="overlay-text">
                      You completed Stage {phaseIndex + 1}. These images are now
                      unlocked for this stage.
                    </p>

                    <button
                      className="match-button primary"
                      onClick={handleContinue}
                    >
                      {phaseIndex < 2
                        ? "Continue"
                        : "Unlock Full Deck for 5 Minutes"}
                    </button>
                  </div>
                </div>

                <div className="gallery-grid">
                  {rewardImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className="gallery-card"
                      onClick={() => openGallery(rewardImages, index)}
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
                  <div className="overlay-card stage-complete-card">
                    <div className="stage-kicker">★ Full Preview ★</div>
                    <h2 className="overlay-title">All Images Unlocked</h2>

                    <p className="overlay-text">
                      All images are unlocked for {formatTime(timeLeft)}.
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
                      onClick={() => openGallery(finalUnlockImages, index)}
                    >
                      <img
                        src={image}
                        alt="Unlocked"
                        className="gallery-image"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {activeGalleryImage && (
        <div className="image-overlay slideshow-overlay" onClick={closeGallery}>
          <button className="slideshow-close" onClick={closeGallery}>
            ×
          </button>

          <button
            className="slideshow-nav slideshow-prev"
            onClick={(event) => {
              event.stopPropagation();
              previousGalleryImage();
            }}
          >
            ‹
          </button>

          <div className="slideshow-content" onClick={stopOverlayClick}>
            <div className="slideshow-counter">
              Image {galleryIndex + 1} of {galleryImages.length}
            </div>

            <img
              key={galleryFadeKey}
              src={activeGalleryImage}
              alt="Expanded card"
              className="image-full slideshow-image"
            />
          </div>

          <button
            className="slideshow-nav slideshow-next"
            onClick={(event) => {
              event.stopPropagation();
              nextGalleryImage();
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
