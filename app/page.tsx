"use client";

import { useEffect, useMemo, useState } from "react";

type AudioItem = {
  audio_id: string;
  entry_id: string;
  audio_type: string;
  language: string;
  storage_path: string;
  status: string;
  uploaded_by: string;
  publicUrl: string | null;
  created_at?: string;
};

type Entry = {
  entry_id: string;
  domain: string;
  source_language: string;
  target_language: string;
  source_lemma: string;
  translation_primary: string;
  example_source: string | null;
  example_target: string | null;
  review_status: string;
  created_at: string;
  audios: AudioItem[];
};

export default function Studio() {
  // Theme (light par défaut)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // UI responsive
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Domains auto
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("lingua_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    // Mobile: replie filtres par défaut
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) setFiltersOpen(false);
    }
  }, []);

  useEffect(() => {
    document.body.style.background = theme === "dark" ? "#0b0b0b" : "#ffffff";
    document.body.style.color = theme === "dark" ? "#ffffff" : "#000000";
    localStorage.setItem("lingua_theme", theme);
  }, [theme]);

  // Load domains (auto)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/meta/domains", { cache: "no-store" });
        const j = await r.json();
        if (r.ok && Array.isArray(j.domains)) setDomains(j.domains);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Filters
  const [q, setQ] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [audioType, setAudioType] = useState("");
  const [domain, setDomain] = useState("");

  // Paging + Data
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const cardBg = theme === "dark" ? "#111" : "#fff";
  const cardBorder = theme === "dark" ? "#222" : "#eee";
  const inputBg = theme === "dark" ? "#0f0f0f" : "#fff";
  const inputBorder = theme === "dark" ? "#333" : "#ddd";
  const subtle = theme === "dark" ? 0.78 : 0.7;

  async function load(p = page) {
    setLoading(true);
    setErr("");
    setSavedMsg("");

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (sourceLanguage) params.set("source_language", sourceLanguage);
      if (audioType) params.set("audio_type", audioType);
      if (domain) params.set("domain", domain);
      params.set("page", String(p));
      params.set("pageSize", "20");

      const r = await fetch(`/api/studio?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");

      setItems(j.items || []);
      setTotal(j.total || 0);
      setPage(j.page || p);
    } catch (e: any) {
      setErr(e?.message || "Erreur");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setQ("");
    setSourceLanguage("");
    setAudioType("");
    setDomain("");
    setPage(1);
    setSavedMsg("");
    setErr("");
    load(1);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => [...items], [items]);

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Lingua Dataset Studio
        </h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={goHome}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Accueil
          </button>

          <a
            href="/requests"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Demandes
          </a>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            ☰ Filtres
          </button>

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (mot ou traduction)…"
            style={{
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              flex: "1 1 260px",
              background: inputBg,
              color: "inherit",
              minWidth: 220,
            }}
          />

          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
            }}
          >
            <option value="">Toutes langues</option>
            <option value="mina">mina</option>
            <option value="bambara">bambara</option>
          </select>

          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
            }}
          >
            <option value="">Toutes catégories</option>
            {(domains.length ? domains : ["sante", "salutation", "pharmacie"]).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={audioType}
            onChange={(e) => setAudioType(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
            }}
          >
            <option value="">Tous types audio</option>
            <option value="word">word</option>
          </select>

          <button
            onClick={() => load(1)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Filtrer
          </button>

          <button
            onClick={() => {
              setQ("");
              load(1);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Effacer
          </button>
        </div>
      )}

      <div style={{ marginTop: 10, opacity: subtle }}>
        {loading ? "Chargement…" : `${total} entrées (page ${page})`}
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {/* No results -> save missing request */}
      {!loading && items.length === 0 && (
        <div
          style={{
            marginTop: 14,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 12,
            background: cardBg,
          }}
        >
          <div style={{ fontWeight: 800 }}>Aucun résultat</div>
          <div style={{ marginTop: 6, opacity: subtle }}>
            Cette traduction n&apos;est pas encore disponible. Nous pouvons enregistrer ta demande et la traiter en
            priorité lors d&apos;une prochaine mise à jour.
          </div>

          <button
            onClick={async () => {
              setSavedMsg("");
              try {
                const r = await fetch("/api/missing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    query: q.trim(),
                    source_language: sourceLanguage || "",
                    target_language: "fr",
                    domain: domain || "",
                  }),
                });
                const j = await r.json();
                if (!r.ok) throw new Error(j?.error || "Erreur enregistrement");
                setSavedMsg("✅ Demande enregistrée. Merci !");
              } catch (e: any) {
                setSavedMsg(`❌ ${e?.message || "Erreur"}`);
              }
            }}
            disabled={!q.trim()}
            style={{
              marginTop: 10,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${inputBorder}`,
              background: inputBg,
              color: "inherit",
              cursor: q.trim() ? "pointer" : "not-allowed",
              opacity: q.trim() ? 1 : 0.5,
            }}
          >
            Enregistrer la demande
          </button>

          {savedMsg && <div style={{ marginTop: 10 }}>{savedMsg}</div>}
        </div>
      )}

      {/* List */}
      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {sorted.map((en) => (
          <div
            key={en.entry_id}
            style={{
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: 12,
              background: cardBg,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {en.source_lemma} <span style={{ opacity: subtle }}>→</span> {en.translation_primary}
                </div>
                <div style={{ fontSize: 12, opacity: subtle }}>
                  {en.source_language} • {en.domain} • {en.review_status}
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: subtle }}>{new Date(en.created_at).toLocaleString()}</div>
            </div>

            {(en.example_source || en.example_target) && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <div>
                  <b>Ex:</b> {en.example_source || ""}
                </div>
                <div style={{ opacity: subtle }}>{en.example_target || ""}</div>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Audios ({en.audios.length})</div>
              {en.audios.length === 0 && <div style={{ fontSize: 13, opacity: subtle }}>Aucun audio</div>}

              <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                {en.audios.map((a) => (
                  <div
                    key={a.audio_id}
                    style={{
                      border: `1px solid ${theme === "dark" ? "#222" : "#f0f0f0"}`,
                      borderRadius: 10,
                      padding: 10,
                      background: theme === "dark" ? "#0e0e0e" : "#fafafa",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: subtle }}>
                      {a.language} • {a.audio_type} • {a.status} • {a.uploaded_by || ""}
                    </div>

                    <div style={{ fontSize: 12, opacity: subtle, marginTop: 4 }}>
                      <code>{a.storage_path}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(a.storage_path)}
                        style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 8,
                          border: `1px solid ${inputBorder}`,
                          background: inputBg,
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        copier
                      </button>
                    </div>

                    {a.publicUrl ? (
                      <audio controls src={a.publicUrl} style={{ width: "100%", marginTop: 8 }} />
                    ) : (
                      <div style={{ color: "crimson", marginTop: 8, fontSize: 13 }}>URL audio indisponible</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => page > 1 && load(page - 1)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${inputBorder}`,
            background: inputBg,
            color: "inherit",
            cursor: page > 1 ? "pointer" : "not-allowed",
            opacity: page > 1 ? 1 : 0.5,
          }}
          disabled={page <= 1}
        >
          ← Précédent
        </button>
        <button
          onClick={() => load(page + 1)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${inputBorder}`,
            background: inputBg,
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Suivant →
        </button>
      </div>
    </main>
  );
}
