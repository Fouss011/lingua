"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DomainPage({ params }: any) {
  const [intents, setIntents] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/conversation/intents?domain=${params.domain}`)
      .then((r) => r.json())
      .then((j) => setIntents(j.intents || []));
  }, [params.domain]);

  return (
    <main style={{ padding: 20 }}>
      <h1>{params.domain}</h1>

      {intents.map((i) => (
        <Link key={i} href={`/conversation/${params.domain}/${i}`}>
          <button style={{ width: "100%", padding: 14, marginTop: 8 }}>
            {i}
          </button>
        </Link>
      ))}
    </main>
  );
}
