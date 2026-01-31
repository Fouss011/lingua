"use client";

import { useEffect, useState } from "react";

type MissingReq = {
  id: string;
  query: string;
  source_language: string | null;
  target_language: string | null;
  domain: string | null;
  count: number;
  last_seen_at: string;
  created_at?: string;
};

export default function RequestsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<MissingReq[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    const t = localStorage.getItem("admin_token") || "";
    setToken(t);

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
    setStatus("Chargement...");
    setItems([]);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      const r = await fetch(`/api/requests?${params.toString()}`, {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Unauthorized");

      setItems(j.items || []);
      setStatus(`OK • ${j.items?.length || 0} demandes`);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Erreur"}`);
    }
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
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Demandes (Admin)</h1>

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

          <button onClick={load} style={{ ...btnStyle, fontWeight: 900 }}>
            Charger
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr", maxWidth: 700 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Admin token</div>
              <input
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  localStorage.setItem("admin_token", e.target.value);
                }}
                placeholder="Colle ton ADMIN_TOKEN"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--inputBorder)",
                  background: "var(--inputBg)",
                  color: "var(--fg)",
                }}
              />
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                Stocké en local sur ton téléphone/PC (localStorage).
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Recherche</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filtrer par mot demandé…"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid var(--inputBorder)",
                  background: "var(--inputBg)",
                  color: "var(--fg)",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.8 }}>{status}</div>
        </div>
      )}

      {/* List */}
      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {items.map((it, idx) => (
          <div key={it.id} style={cardStyle}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontWeight: 900, opacity: 0.75 }}>#{idx + 1}</div>
              <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>{it.query}</div>
              <div style={{ marginLeft: "auto", opacity: 0.75, fontSize: 12 }}>
                {new Date(it.last_seen_at).toLocaleString()}
              </div>
            </div>

            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
              {it.source_language || "—"} → {it.target_language || "—"} • {it.domain || "—"} • count:{" "}
              <b>{it.count}</b>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
