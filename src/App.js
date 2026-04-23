import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const DECK_FOLDER = "/cards-public";

export default function App() {
  const [bgImage] = useState("/casino-bg.jpg");

  return (
    <div
      className="app theme-emerald"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* DARK OVERLAY */}
      <div className="bg-overlay" />

      <h1 className="app-title">Play Your Photos Blackjack</h1>

      <div className="status">Background test live</div>
    </div>
  );
}
