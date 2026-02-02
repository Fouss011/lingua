import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const sb = supabaseServer();
  const url = new URL(req.url);

  const bucket = process.env.SUPABASE_BUCKET || "lingua-audio";

  const domain = (url.searchParams.get("domain") || "").trim();
  const intent = (url.searchParams.get("intent") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();

  if (!domain) return NextResponse.json({ items: [] });

  try {
    let query = sb
      .from("entries")
      .select(
        "entry_id,domain,source_language,source_lemma,translation_primary,example_source,example_target,created_at"
      )
      .eq("domain", domain);

    if (q) {
      const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      query = query.or(`source_lemma.ilike.${like},translation_primary.ilike.${like}`);
    }

    if (intent && intent !== "general") {
      query = query.eq("intent", intent);
    }

    let { data: entries, error } = await query.order("order_in_intent", { ascending: true });

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("does not exist") || msg.includes("column")) {
        const r2 = await sb
          .from("entries")
          .select(
            "entry_id,domain,source_language,source_lemma,translation_primary,example_source,example_target,created_at"
          )
          .eq("domain", domain)
          .order("created_at", { ascending: false })
          .limit(300);

        if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });
        entries = r2.data || [];
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const ids = (entries || []).map((x: any) => x.entry_id).filter(Boolean);
    if (!ids.length) return NextResponse.json({ items: [] });

    const { data: audios, error: e2 } = await sb
      .from("audio_items")
      .select("audio_id,entry_id,language,audio_type,storage_path,status")
      .in("entry_id", ids)
      .order("created_at", { ascending: false });

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    const firstAudioByEntry: Record<string, any> = {};
    for (const a of audios || []) {
      if (!a?.entry_id) continue;
      if (firstAudioByEntry[a.entry_id]) continue;

      const storage_path = (a.storage_path as string | null) || null;
      let audio_url: string | null = null;

      if (storage_path) {
        const { data } = sb.storage.from(bucket).getPublicUrl(storage_path);
        audio_url = data?.publicUrl ?? null;
      }

      firstAudioByEntry[a.entry_id] = { audio_url };
    }

    const items = (entries || []).map((en: any) => ({
      ...en,
      audio_url: firstAudioByEntry[en.entry_id]?.audio_url ?? null,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
