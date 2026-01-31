"use client";

import { useEffect, useState } from "react";

export default function IntentPage({ params }: any) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/conversation/phrases?domain=${params.domain}&intent=${params.intent}`)
      .then((r) => r.json())
      .then((j) => setRows(j.items || []));
  }, [params]);

  return (
    <main style={{ padding: 20 }}>
      <h2>{params.intent}</h2>

      {rows.map((r: any, i: number) => (
        <div key={r.entry_id} style={{ marginBottom: 14 }}>
          <b>{i + 1}. {r.translation_primary}</b>
          {r.audio_url && (
            <audio controls src={r.audio_url} style={{ width: "100%", marginTop: 6 }} />
          )}
        </div>
      ))}
    </main>
  );
}
