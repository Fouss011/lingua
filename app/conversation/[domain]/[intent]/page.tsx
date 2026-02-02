"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function IntentPage({ params }: any) {
  const domain = params?.domain || "";
  const intent = params?.intent || "";

  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const u = new URLSearchParams({ domain, intent });
      if (q.trim()) u.set("q", q.trim());
      const r = await fetch(`/api/conversation/phrases?${u.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");
      setRows(Array.isArray(j.items) ? j.items : []);
    } catch (e: any) {
      setRows([]);
      setErr(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, intent]);

  const countLabel = useMemo(() => {
    if (loading) return "Chargement…";
    return `${rows.length} phrases`;
  }, [rows.length, loading]);

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/conversation/${encodeURIComponent(domain)}`} style={{ textDecoration: "none" }}>
          <button style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid var(--inputBorder)", background: "var(--inputBg)", color: "var(--fg)", cursor: "pointer", fontWeight: 800 }}>
            ← Intentions
          </button>
        </Link>

        <Link href="/conversation" style={{ textDecoration: "none" }}>
          <button style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid var(--inputBorder)", background: "var(--inputBg)", color: "var(--fg)", cursor: "pointer" }}>
            Domaines
          </button>
        </Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "14px 0 6px" }}>{intent}</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une phrase…"
          style={{ flex: "1 1 260px", padding: 10, borderRadius: 12, border: "1px solid var(--inputBorder)", background: "var(--inputBg)", color: "var(--fg)", minWidth: 220 }}
        />
        <button
          onClick={load}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid var(--inputBorder)", background: "var(--inputBg)", color: "var(--fg)", cursor: "pointer", fontWeight: 800 }}
        >
          Rechercher
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.78 }}>{countLabel}</div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {rows.map((r: any, i: number) => (
          <div key={r.entry_id || i} style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 16, padding: 14 }}>
            <div style={{ fontWeight: 900, lineHeight: 1.35 }}>{i + 1}. {r.translation_primary}</div>

            {r.source_lemma && (
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                {r.source_language ? `${r.source_language} • ` : ""}{r.source_lemma}
              </div>
            )}

            {r.audio_url ? (
              <audio controls src={r.audio_url} style={{ width: "100%", marginTop: 10 }} />
            ) : (
              <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>(pas d’audio)</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
