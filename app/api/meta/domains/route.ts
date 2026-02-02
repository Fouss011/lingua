import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// ✅ Empêche Next/Netlify de mettre en cache cette route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sb = supabaseServer();

  try {
    const { data, error } = await sb
      .from("entries")
      .select("domain")
      .not("domain", "is", null)
      .limit(10000);

    if (error) throw error;

    const domains = Array.from(
      new Set((data || []).map((x: any) => String(x.domain || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    // ✅ no-store explicite côté HTTP
    return NextResponse.json(
      { domains },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
