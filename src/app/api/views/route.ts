import { headers } from "next/headers";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function viewerHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export async function POST(req: Request) {
  const { article_id } = (await req.json()) as { article_id?: string };
  if (!article_id) {
    return Response.json({ error: "article_id required" }, { status: 400 });
  }

  const hash = await viewerHash();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("increment_view", {
    p_article_id: article_id,
    p_viewer_hash: hash,
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, views: data ?? 0 });
}
