import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Demo from "./pages/Demo.js";

function Home() {
  return (
    <div className="landing-page">
      <div className="landing-overlay">
        <h1 className="landing-title">BLACKJACK</h1>
        <p className="landing-subtitle">Powered by Memory Deck</p>

        <Link to="/demo" className="launch-button">
          Launch Demo Deck
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Router>
  );
}
