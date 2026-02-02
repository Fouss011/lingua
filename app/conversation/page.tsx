"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ConversationHome() {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/meta/domains", { cache: "no-store" });
        const j = await r.json();
        setDomains(Array.isArray(j.domains) ? j.domains : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      {/* mini nav */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/" style={btnStyle}>Apprendre</Link>
        <Link href="/conversation" style={btnStyle}>Conversation</Link>
        <Link href="/favorites" style={btnStyle}>Favoris</Link>
        <Link href="/requests" style={btnStyle}>Demandes</Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "14px 0 0" }}>
        Mode Conversation
      </h1>
      <p style={{ opacity: 0.75, marginTop: 8 }}>
        Domaine → Intention → Phrases audio
      </p>

      {loading ? (
        <div style={{ marginTop: 12, opacity: 0.8 }}>Chargement…</div>
      ) : (
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {domains.map((d) => (
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
                  fontWeight: 900,
                  textAlign: "left",
                }}
              >
                {d}
              </button>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/" style={{ color: "inherit", opacity: 0.85 }}>
          ← Retour Apprendre
        </Link>
      </div>
    </main>
  );
}
