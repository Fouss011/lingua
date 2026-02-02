"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Fav = {
  entry_id: string;
  domain: string;
  intent: string;
  text_fr: string;
  text_src?: string;
  audio_url?: string | null;
};

function loadFavs(): Record<string, Fav> {
  try {
    return JSON.parse(localStorage.getItem("lingua_favorites_v1") || "{}");
  } catch {
    return {};
  }
}
function saveFavs(obj: Record<string, Fav>) {
  localStorage.setItem("lingua_favorites_v1", JSON.stringify(obj));
}

export default function FavoritesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [favs, setFavs] = useState<Record<string, Fav>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
    setFavs(loadFavs());
  }, []);

  useEffect(() => {
    document.body.style.background = theme === "dark" ? "#0b0b0b" : "#ffffff";
    document.body.style.color = theme === "dark" ? "#ffffff" : "#000000";
    localStorage.setItem("lingua_theme", theme);

    document.documentElement.style.setProperty("--bg", theme === "dark" ? "#0b0b0b" : "#ffffff");
    document.documentElement.style.setProperty("--fg", theme === "dark" ? "#ffffff" : "#000000");
    document.documentElement.style.setProperty("--card", theme === "dark" ? "#111" : "#fff");
    document.documentElement.style.setProperty("--border", theme === "dark" ? "#222" : "#eee");
    document.documentElement.style.setProperty("--inputBg", theme === "dark" ? "#0f0f0f" : "#fff");
    document.documentElement.style.setProperty("--inputBorder", theme === "dark" ? "#333" : "#ddd");
  }, [theme]);

  const list = useMemo(() => Object.values(favs), [favs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((x) =>
      (x.text_fr || "").toLowerCase().includes(s) ||
      (x.text_src || "").toLowerCase().includes(s) ||
      (x.domain || "").toLowerCase().includes(s) ||
      (x.intent || "").toLowerCase().includes(s)
    );
  }, [list, q]);

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    background: "var(--card)",
    borderRadius: 16,
    padding: 14,
  };

  const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid var(--inputBorder)",
    background: "var(--inputBg)",
    color: "var(--fg)",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    fontWeight: 800,
  };

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/conversation" style={btnStyle}>← Conversation</Link>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{ ...btnStyle, marginLeft: "auto" }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "14px 0 10px" }}>
        Favoris
      </h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher dans les favoris…"
          style={{
            flex: "1 1 360px",
            minWidth: 240,
            padding: 10,
            borderRadius: 12,
            border: "1px solid var(--inputBorder)",
            background: "var(--inputBg)",
            color: "var(--fg)",
          }}
        />
      </div>

      <div style={{ marginTop: 10, opacity: 0.78 }}>
        {filtered.length} favoris
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {filtered.map((f, i) => (
          <div key={f.entry_id} style={cardStyle}>
            <div style={{ fontWeight: 900, lineHeight: 1.35 }}>
              {i + 1}. {f.text_fr}
            </div>
            {f.text_src && (
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                {f.text_src}
              </div>
            )}

            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
              {f.domain} → {f.intent}
            </div>

            {f.audio_url ? (
              <audio controls src={f.audio_url} style={{ width: "100%", marginTop: 10 }} />
            ) : (
              <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>(pas d’audio)</div>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={`/conversation/${encodeURIComponent(f.domain)}/${encodeURIComponent(f.intent)}`}
                style={btnStyle}
              >
                Ouvrir
              </Link>

              <button
                onClick={() => {
                  const next = { ...favs };
                  delete next[f.entry_id];
                  setFavs(next);
                  saveFavs(next);
                }}
                style={btnStyle}
              >
                Retirer
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 900 }}>Aucun favori</div>
            <div style={{ marginTop: 6, opacity: 0.75 }}>
              Ajoute une phrase en favoris depuis la page Conversation.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
