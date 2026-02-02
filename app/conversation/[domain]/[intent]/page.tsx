"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  entry_id: string;
  domain: string;
  intent: string | null;
  order_in_intent?: number | null;
  source_language?: string | null;

  source_lemma?: string | null;
  translation_primary?: string | null;
  example_source?: string | null;
  example_target?: string | null;

  text_fr?: string | null;
  text_src?: string | null;
  audio_url?: string | null;
};

type FavItem = {
  entry_id: string;
  domain: string;
  intent: string;
  fr: string;
  src: string;
  added_at: string;
};

const FAV_KEY = "lingua_favorites_v1";

function readFavs(): FavItem[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeFavs(items: FavItem[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(items));
}

export default function IntentPhrasesPage({ params }: any) {
  const domain = params?.domain || "";
  const intent = params?.intent || "";

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    // init fav set
    const favs = readFavs();
    setFavIds(new Set(favs.map((f) => f.entry_id)));
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
  };

  const linkBtnStyle: React.CSSProperties = {
    ...btnStyle,
    textDecoration: "none",
    display: "inline-block",
    fontWeight: 800,
  };

  async function load(search = "") {
    setLoading(true);
    setErr("");

    try {
      const sp = new URLSearchParams();
      sp.set("domain", domain);
      sp.set("intent", intent);
      if (search.trim()) sp.set("q", search.trim());

      const r = await fetch(`/api/conversation/phrases?${sp.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");

      const items = Array.isArray(j.items) ? j.items : [];
      setRows(items);
    } catch (e: any) {
      setErr(e?.message || "Erreur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, intent]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const fr = (r.text_fr || r.example_target || r.translation_primary || "")
        .toString()
        .toLowerCase();
      const src = (r.text_src || r.example_source || r.source_lemma || "")
        .toString()
        .toLowerCase();
      return fr.includes(s) || src.includes(s);
    });
  }, [rows, q]);

  function toggleFav(row: Row) {
    const fr = (row.text_fr || row.example_target || row.translation_primary || "").toString().trim();
    const src = (row.text_src || row.example_source || row.source_lemma || "").toString().trim();

    const favs = readFavs();
    const exists = favs.some((f) => f.entry_id === row.entry_id);

    if (exists) {
      const next = favs.filter((f) => f.entry_id !== row.entry_id);
      writeFavs(next);
      const s = new Set(favIds);
      s.delete(row.entry_id);
      setFavIds(s);
      return;
    }

    const item: FavItem = {
      entry_id: row.entry_id,
      domain: row.domain || domain,
      intent: (row.intent || intent || "").toString(),
      fr,
      src,
      added_at: new Date().toISOString(),
    };

    const next = [item, ...favs].slice(0, 500); // petit garde-fou
    writeFavs(next);

    const s = new Set(favIds);
    s.add(row.entry_id);
    setFavIds(s);
  }

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Top nav */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Link href={`/conversation/${encodeURIComponent(domain)}`} style={linkBtnStyle}>
          ← Intentions
        </Link>
        <Link href="/conversation" style={linkBtnStyle}>
          Domaines
        </Link>
        <Link href="/favorites" style={linkBtnStyle}>
          Favoris
        </Link>

        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{ ...btnStyle, marginLeft: "auto" }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "14px 0 10px" }}>{intent}</h1>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une phrase…"
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
        <button onClick={() => load(q)} style={{ ...btnStyle, padding: "10px 14px", fontWeight: 800 }}>
          Rechercher
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.78 }}>
        {loading ? "Chargement…" : `${filtered.length} phrases`}
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {filtered.map((r, i) => {
          const fr = (r.text_fr || r.example_target || r.translation_primary || "").toString().trim();
          const src = (r.text_src || r.example_source || r.source_lemma || "").toString().trim();
          const isFav = favIds.has(r.entry_id);

          return (
            <div key={r.entry_id} style={cardStyle}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, lineHeight: 1.35 }}>
                    {i + 1}. {fr || "(texte manquant)"}
                  </div>

                  {src && (
                    <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                      {(r.source_language ? `${r.source_language} • ` : "") + src}
                    </div>
                  )}
                </div>

                {/* ⭐ Favori */}
                <button
                  onClick={() => toggleFav(r)}
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  style={{
                    ...btnStyle,
                    padding: "8px 10px",
                    fontWeight: 900,
                    opacity: isFav ? 1 : 0.85,
                  }}
                >
                  {isFav ? "⭐" : "☆"}
                </button>
              </div>

              {r.audio_url ? (
                <audio controls src={r.audio_url} style={{ width: "100%", marginTop: 10 }} />
              ) : (
                <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>(pas d’audio)</div>
              )}
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 900 }}>Aucune phrase</div>
            <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.4 }}>
              Il n&apos;y a pas encore de contenu pour cette intention, ou la recherche ne correspond à rien.
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={() => load("")} style={{ ...btnStyle, fontWeight: 900 }}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
