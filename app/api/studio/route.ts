import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function ilikeSafe(q: string) {
  const v = (q || "").trim();
  if (!v) return null;
  // escape % and _ for ilike
  return `%${v.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

async function listAll(sb: any, bucket: string, prefix = ""): Promise<any[]> {
  const out: any[] = [];

  async function walk(path: string) {
    const { data, error } = await sb.storage.from(bucket).list(path, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data) return;

    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id === null) {
        await walk(fullPath);
      } else {
        out.push({
          path: fullPath,
          name: item.name,
          size: item.metadata?.size ?? null,
          mimetype: item.metadata?.mimetype ?? null,
        });
      }
    }
  }

  await walk(prefix);
  return out;
}

export async function GET(req: Request) {
  const sb = supabaseServer();
  const bucket = process.env.SUPABASE_BUCKET || "lingua-audio";

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const sourceLang = url.searchParams.get("source_language") || "";
  const audioType = url.searchParams.get("audio_type") || "";
  const domain = url.searchParams.get("domain") || "";

  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") || "20")));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // 1) entries (avec filtres)
    let query = sb
      .from("entries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    const like = ilikeSafe(q);
    if (like) {
      query = query.or(`source_lemma.ilike.${like},translation_primary.ilike.${like}`);
    }
    if (sourceLang) query = query.eq("source_language", sourceLang);
    if (domain) query = query.eq("domain", domain);

    const { data: entries, error: e1, count } = await query;
    if (e1) throw e1;

    const entryIds = (entries || []).map((x: any) => x.entry_id);

    // Si aucune entrée -> répondre direct
    if (!entryIds.length) {
      return NextResponse.json({
        page,
        pageSize,
        total: count ?? 0,
        items: [],
      });
    }

    // 2) audio_items liées
    let aQuery = sb
      .from("audio_items")
      .select("*")
      .in("entry_id", entryIds)
      .order("created_at", { ascending: false });

    if (audioType) aQuery = aQuery.eq("audio_type", audioType);

    const { data: audios, error: e2 } = await aQuery;
    if (e2) throw e2;

    // 3) map audios par entry_id + publicUrl
    const byEntry: Record<string, any[]> = {};

    for (const a of audios || []) {
      const storage_path = (a.storage_path as string | null) || null;

      let publicUrl: string | null = null;
      if (storage_path) {
        const { data } = sb.storage.from(bucket).getPublicUrl(storage_path);
        publicUrl = data?.publicUrl ?? null;
      }

      const item = { ...a, publicUrl };

      if (!byEntry[a.entry_id]) byEntry[a.entry_id] = [];
      byEntry[a.entry_id].push(item);
    }

    const merged = (entries || []).map((en: any) => ({
      ...en,
      audios: byEntry[en.entry_id] || [],
    }));

    return NextResponse.json({
      page,
      pageSize,
      total: count ?? merged.length,
      items: merged,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
