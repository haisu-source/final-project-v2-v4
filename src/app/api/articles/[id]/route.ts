import { getSupabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: statsData } = await supabase.rpc("get_article_stats", {
    p_article_id: id,
  });
  const row = statsData?.[0] ?? { views: 0, comments: 0, likes: 0 };

  return Response.json({
    article: data as Article,
    stats: { views: row.views, comments: row.comments, likes: row.likes },
  });
}
