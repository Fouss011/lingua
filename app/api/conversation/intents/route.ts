import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const sb = supabaseServer();
  const url = new URL(req.url);

  const domain = url.searchParams.get("domain") || "";

  const { data, error } = await sb
    .from("entries")
    .select("intent")
    .eq("domain", domain);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const intents = [...new Set((data || []).map((x: any) => x.intent))];

  return NextResponse.json({ intents });
}
