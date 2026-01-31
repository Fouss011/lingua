"use client";

import { useEffect, useState } from "react";

type ReqRow = {
  id: string;
  query: string;
  source_language: string;
  target_language: string;
  domain: string;
  count: number;
  created_at: string;
  last_seen_at: string;
};

export default function RequestsPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ReqRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("lingua_admin_token") || "";
    setToken(t);
    setSavedToken(t);
  }, []);

  async function load(p = page, t = token) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(p));
      params.set("pageSize", "20");

      const r = await fetch(`/api/requests?${params.toString()}`, {
        headers: { "x-admin-token": t },
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");

      setItems(j.items || []);
      setTotal(j.total || 0);
      setPage(j.page || p);
    } catch (e: any) {
      setItems([]);
      setTotal(0);
      setErr(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function saveToken() {
    localStorage.setItem("lingua_admin_token", token);
    setSavedToken(token);
  }

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Demandes manquantes (Admin)</h1>
        <a href="/" style={{ textDecoration: "underline" }}>← Retour Studio</a>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700 }}>Token Admin</div>
        <div style={{ opacity: 0.7, marginTop: 4 }}>
          Mets le même token que dans <code>.env.local</code> (ADMIN_TOKEN).
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN…"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", flex: "1 1 320px" }}
          />
          <button
            onClick={saveToken}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          >
            Enregistrer
          </button>
          <button
            onClick={() => load(1, token)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
            disabled={!token}
          >
            Charger
          </button>
        </div>

        {savedToken && (
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Token sauvegardé (localStorage) ✅
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une demande…"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", flex: "1 1 320px" }}
        />
        <button
          onClick={() => load(1, token)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          disabled={!token}
        >
          Filtrer
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.7 }}>
        {loading ? "Chargement…" : `${total} demandes (page ${page})`}
      </div>
      {err && <div style={{ marginTop: 8, color: "crimson" }}>{err}</div>}

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {items.map((x) => (
          <div key={x.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{x.query}</div>
              <div style={{ fontWeight: 800 }}>× {x.count}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
              {x.source_language || "—"} → {x.target_language || "—"} • {x.domain || "—"}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
              last_seen: {new Date(x.last_seen_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => page > 1 && load(page - 1, token)}
          disabled={!token || page <= 1}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", opacity: page <= 1 ? 0.5 : 1 }}
        >
          ← Précédent
        </button>
        <button
          onClick={() => load(page + 1, token)}
          disabled={!token}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          Suivant →
        </button>
      </div>
    </main>
  );
}
