"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function DomainPage({ params }: any) {
  const domain = params?.domain || "";

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [intents, setIntents] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) setFiltersOpen(false);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("lingua_theme", next);
    window.dispatchEvent(new StorageEvent("storage", { key: "lingua_theme", newValue: next }));
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`/api/conversation/intents?domain=${encodeURIComponent(domain)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");

      const arr = Array.isArray(j.intents) ? j.intents : [];
      // nettoie + retire les vides
      const cleaned = arr.map((x: any) => String(x || "").trim()).filter(Boolean);
      setIntents(cleaned);
    } catch (e: any) {
      setErr(e?.message || "Erreur");
      setIntents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

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

  const filteredIntents = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return intents;
    return intents.filter((i) => i.toLowerCase().includes(s));
  }, [intents, q]);

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            {domain}
          </h1>

          {/* nav */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/" style={linkBtnStyle}>Apprendre</a>
            <a href="/conversation" style={linkBtnStyle}>Conversation</a>
            <a href="/requests" style={linkBtnStyle}>Demandes</a>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/conversation" style={linkBtnStyle}>
            ← Retour
          </Link>

          <button onClick={() => setFiltersOpen((v) => !v)} style={btnStyle}>
            ☰ Filtres
          </button>

          <button onClick={toggleTheme} style={btnStyle}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <button onClick={load} style={{ ...btnStyle, fontWeight: 900 }}>
            Recharger
          </button>
        </div>
      </div>

      {/* Filtres */}
      {filtersOpen && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Intentions dans “{domain}”</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une intention…"
            style={{
              width: "100%",
              maxWidth: 520,
              padding: 10,
              borderRadius: 12,
              border: "1px solid var(--inputBorder)",
              background: "var(--inputBg)",
              color: "var(--fg)",
            }}
          />
          <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
            Astuce: ajoute des valeurs `intent` dans la table `entries` pour voir des menus ici.
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, opacity: 0.78 }}>
        {loading ? "Chargement…" : `${filteredIntents.length} intentions`}
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {/* Liste intents */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {filteredIntents.map((intent) => (
          <Link
            key={intent}
            href={`/conversation/${encodeURIComponent(domain)}/${encodeURIComponent(intent)}`}
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "1px solid var(--inputBorder)",
                background: "var(--inputBg)",
                color: "var(--fg)",
                cursor: "pointer",
                fontWeight: 900,
                textAlign: "left",
              }}
            >
              {intent}
              <div style={{ fontWeight: 500, opacity: 0.75, marginTop: 6, fontSize: 12 }}>
                Ouvrir les phrases
              </div>
            </button>
          </Link>
        ))}

        {!loading && filteredIntents.length === 0 && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 900 }}>Aucune intention trouvée</div>
            <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.4 }}>
              Soit il n’y a pas encore de valeurs dans <code>entries.intent</code> pour ce domaine,
              soit les valeurs sont vides.
            </div>
            <div style={{ marginTop: 10 }}>
              <Link href="/conversation" style={{ color: "inherit", opacity: 0.85 }}>
                ← Retour à la liste des domaines
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
