import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const sb = supabaseServer();

  try {
    // On récupère des domaines (limit large, suffisant pour ton dataset)
    const { data, error } = await sb
      .from("entries")
      .select("domain")
      .not("domain", "is", null)
      .limit(10000);

    if (error) throw error;

    const domains = Array.from(
      new Set((data || []).map((x: any) => String(x.domain || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ domains });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
