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

  // Apply theme CSS vars (cohérent avec les autres pages)
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

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
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
    fontWeight: 800,
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

  const onlyGeneral = !loading && !err && intents.length === 1 && intents[0] === "general";

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{domain}</h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/" prefetch style={linkBtnStyle}>
              Apprendre
            </Link>
            <Link href="/conversation" prefetch style={linkBtnStyle}>
              Conversation
            </Link>
            <Link href="/favorites" prefetch style={linkBtnStyle}>
              Favoris
            </Link>
            <Link href="/requests" prefetch style={linkBtnStyle}>
              Demandes
            </Link>
          </div>
        </div>

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
        </div>
      )}

      <div style={{ marginTop: 10, opacity: 0.78 }}>
        {loading ? "Chargement…" : `${filteredIntents.length} intentions`}
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {/* ✅ Fix bug "back" : plus de router.replace automatique */}
      {onlyGeneral && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>Ce domaine n’a qu’une intention : “general”</div>
          <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.4 }}>
            Clique pour ouvrir (pas de redirection automatique → plus de bug au retour).
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href={`/conversation/${encodeURIComponent(domain)}/general`} style={linkBtnStyle}>
              Ouvrir general →
            </Link>
          </div>
        </div>
      )}

      {!onlyGeneral && (
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
        </div>
      )}
    </main>
  );
}
