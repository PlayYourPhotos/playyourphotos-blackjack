import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Demo from "./pages/Demo";

function Home() {
  return (
    <div style={styles.app}>
      <div style={styles.overlay}>
        <div style={styles.content}>
          <h1 style={styles.title}>BLACKJACK</h1>

          <p style={styles.subtitle}>
            Powered by Memory Deck
          </p>

          <Link to="/demo" style={styles.button}>
            Launch Demo Deck
          </Link>
        </div>
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

const styles = {
  app: {
    minHeight: "100vh",
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.75)), url('/casino-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  overlay: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  content: {
    textAlign: "center",
    background: "rgba(0,0,0,0.45)",
    padding: "40px",
    borderRadius: "20px",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  },

  title: {
    fontSize: "64px",
    color: "#f5e6b3",
    marginBottom: "10px",
    letterSpacing: "4px",
  },

  subtitle: {
    color: "#ddd",
    marginBottom: "30px",
    fontSize: "18px",
  },

  button: {
    display: "inline-block",
    padding: "14px 28px",
    background: "#b91c1c",
    color: "white",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "18px",
    transition: "0.2s ease",
  },
};
