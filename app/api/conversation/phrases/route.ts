import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function noCacheHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export async function GET(req: Request) {
  const sb = supabaseServer();
  const url = new URL(req.url);

  const bucket = process.env.SUPABASE_BUCKET || "lingua-audio";

  const domain = (url.searchParams.get("domain") || "").trim();
  const intent = (url.searchParams.get("intent") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();

  if (!domain) {
    return NextResponse.json({ items: [] }, { headers: noCacheHeaders() });
  }

  try {
    // 1) charger les entrées
    let query = sb
      .from("entries")
      .select(
        "entry_id,domain,source_language,target_language,source_lemma,translation_primary,example_source,example_target,created_at,intent,order_in_intent,entry_kind"
      )
      .eq("domain", domain);

    // Filtrer par intent si présent (sauf general)
    if (intent && intent !== "general") query = query.eq("intent", intent);

    // ✅ Important: conversation = PHRASES uniquement
    // Certains anciens enregistrements ont entry_kind NULL -> on les exclut,
    // sauf si tu veux les garder. Ici on respecte ton choix: PHRASES only.
    query = query.eq("entry_kind", "phrase");

    if (q) {
      const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      query = query.or(`example_target.ilike.${like},translation_primary.ilike.${like},example_source.ilike.${like},source_lemma.ilike.${like}`);
    }

    // Tri par order_in_intent puis created_at
    const { data: entries, error } = await query
      .order("order_in_intent", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const ids = (entries || []).map((x: any) => x.entry_id).filter(Boolean);
    if (!ids.length) return NextResponse.json({ items: [] }, { headers: noCacheHeaders() });

    // 2) charger les audios pour ces entries
    const { data: audios, error: e2 } = await sb
      .from("audio_items")
      .select("audio_id,entry_id,language,audio_type,storage_path,status")
      .in("entry_id", ids)
      .eq("status", "uploaded")
      .order("created_at", { ascending: false });

    if (e2) throw e2;

    // ✅ Choix audio: pour une phrase, on préfère audio_type='example'
    // sinon on prend le premier audio dispo
    const audioByEntry: Record<string, string | null> = {};

    for (const a of audios || []) {
      const entryId = a.entry_id;
      if (!entryId) continue;

      const storage_path = a.storage_path as string | null;
      if (!storage_path) continue;

      const { data } = sb.storage.from(bucket).getPublicUrl(storage_path);
      const publicUrl = data?.publicUrl ?? null;

      // On remplit d'abord avec 'example', sinon fallback
      if (!audioByEntry[entryId]) {
        audioByEntry[entryId] = publicUrl;
      } else {
        // si on a déjà un audio mais que celui-ci est "example", on remplace
        if ((a.audio_type || "").toLowerCase() === "example") {
          audioByEntry[entryId] = publicUrl;
        }
      }
    }

    // 3) réponse finale avec fallbacks texte
    const items = (entries || []).map((en: any) => {
      // Pour une phrase : le FR est plutôt example_target,
      // translation_primary peut être null chez toi.
      const fr =
        (en.example_target && String(en.example_target).trim()) ||
        (en.translation_primary && String(en.translation_primary).trim()) ||
        "";

      const mina =
        (en.example_source && String(en.example_source).trim()) ||
        (en.source_lemma && String(en.source_lemma).trim()) ||
        "";

      return {
        ...en,
        text_fr: fr,
        text_src: mina,
        audio_url: audioByEntry[en.entry_id] ?? null,
      };
    });

    return NextResponse.json({ items }, { headers: noCacheHeaders() });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
