import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const sb = supabaseServer();
  const url = new URL(req.url);

  const domain = (url.searchParams.get("domain") || "").trim();
  if (!domain) {
    return NextResponse.json(
      { intents: [] },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  try {
    const { data, error } = await sb
      .from("entries")
      .select("intent")
      .eq("domain", domain);

    if (error) throw error;

    const cleaned = (data || [])
      .map((x: any) => String(x?.intent ?? "").trim())
      .filter(Boolean);

    const intents = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));

    // fallback si vide
    const out = intents.length ? intents : ["general"];

    return NextResponse.json(
      { intents: out },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
