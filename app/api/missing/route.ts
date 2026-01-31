import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function normStr(v: any) {
  // Toujours string non-null ('' si vide)
  const s = (v === null || v === undefined) ? "" : String(v);
  return s.trim();
}

export async function POST(req: Request) {
  const sb = supabaseServer();

  try {
    const body = await req.json();

    const query = normStr(body?.query).toLowerCase(); // conseillé
    const source_language = normStr(body?.source_language); // '' si vide
    const target_language = normStr(body?.target_language || "fr");
    const domain = normStr(body?.domain);

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Upsert sur (query, source_language, target_language, domain)
    // Puis incrément count ensuite (simple & fiable)
    const now = new Date().toISOString();

    const { data: row, error: e1 } = await sb
      .from("missing_requests")
      .upsert(
        {
          query,
          source_language,
          target_language,
          domain,
          last_seen_at: now
        },
        { onConflict: "query,source_language,target_language,domain" }
      )
      .select("*")
      .single();

    if (e1) throw e1;

    // Incrément count
    const { data: updated, error: e2 } = await sb
      .from("missing_requests")
      .update({
        count: (row?.count || 1) + 1,
        last_seen_at: now
      })
      .eq("id", row.id)
      .select("*")
      .single();

    if (e2) throw e2;

    return NextResponse.json({ ok: true, item: updated, mode: "upsert+inc" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
