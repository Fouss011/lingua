"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ConversationHome() {
  const DOMAINS = ["salutation", "pharmacie", "marche", "transport", "maison"];

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) setFiltersOpen(false);
    }
  }, []);

  // on ne réapplique pas le thème ici (c’est déjà géré globalement),
  // on fait juste un bouton qui change la valeur pour que ThemeSync suive.
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("lingua_theme", next);
    window.dispatchEvent(new StorageEvent("storage", { key: "lingua_theme", newValue: next }));
  }

  const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid var(--inputBorder)",
    background: "var(--inputBg)",
    color: "var(--fg)",
    cursor: "pointer",
  };

  const linkBtnStyle: React.CSSProperties = {
    ...btnStyle,
    textDecoration: "none",
    display: "inline-block",
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    background: "var(--card)",
    borderRadius: 16,
    padding: 14,
  };

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header (cohérent) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Mode Conversation</h1>

          {/* Row A: navigation */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/" style={linkBtnStyle}>Apprendre</a>
            <a href="/conversation" style={linkBtnStyle}>Conversation</a>
            <a href="/requests" style={linkBtnStyle}>Demandes</a>
          </div>
        </div>

        {/* Row B: actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setFiltersOpen((v) => !v)} style={btnStyle}>
            ☰ Filtres
          </button>

          <button onClick={toggleTheme} style={btnStyle}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      {/* “Filtres” (ici = juste un texte + liste domaines, mais on garde le pattern) */}
      {filtersOpen && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Choisir une situation</div>
          <div style={{ opacity: 0.75, lineHeight: 1.4 }}>
            Domaine → Intention → Phrases audio
          </div>
        </div>
      )}

      {/* Domains */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {DOMAINS.map((d) => (
          <Link key={d} href={`/conversation/${d}`} style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "1px solid var(--inputBorder)",
                background: "var(--inputBg)",
                color: "var(--fg)",
                cursor: "pointer",
                fontWeight: 800,
                textAlign: "left",
              }}
            >
              {d}
            </button>
          </Link>
        ))}
      </div>
    </main>
  );
}
