import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Demo from "./pages/Demo.js";
import Platform from "./pages/Platform.js";

function Home() {
  return (
    <div className="landing-page">
      <div className="landing-overlay">
        <h1 className="landing-title">Play Your Photos</h1>
        <p className="landing-subtitle">
          Create a Memory Deck. Play it everywhere.
        </p>

        <div className="landing-buttons">
          <Link to="/platform" className="launch-button">
            Enter Platform
          </Link>

          <Link to="/demo" className="launch-button secondary-launch">
            Play Blackjack
          </Link>
        </div>

        <p className="landing-powered">Powered by Memory Deck technology</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/platform" element={<Platform />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Router>
  );
}
