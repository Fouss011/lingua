import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  return expected && token === expected;
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") || "20")));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = sb
      .from("missing_requests")
      .select("*", { count: "exact" })
      .order("count", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .range(from, to);

    if (q) query = query.ilike("query", `%${q}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      page,
      pageSize,
      total: count ?? (data?.length || 0),
      items: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
