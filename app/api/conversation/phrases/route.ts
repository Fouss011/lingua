import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const sb = supabaseServer();
  const url = new URL(req.url);

  const domain = url.searchParams.get("domain");
  const intent = url.searchParams.get("intent");

  const { data, error } = await sb
    .from("entries")
    .select("*")
    .eq("domain", domain)
    .eq("intent", intent)
    .order("order_in_intent", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data || [] });
}
