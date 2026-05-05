import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Article, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: Category[] = [
  "politics",
  "culture",
  "education",
  "health",
  "tech",
];

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") ?? "recent";
  const categoryParam = req.nextUrl.searchParams.get("category");
  const category =
    categoryParam && (VALID_CATEGORIES as string[]).includes(categoryParam)
      ? (categoryParam as Category)
      : null;

  const location = req.nextUrl.searchParams.get("location");

  const supabase = getSupabase();
  const query = supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query.eq("category", category);
  }
  if (location) {
    query.ilike("location", `%${location}%`);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const articles = (data as Article[]) ?? [];

  // Fetch engagement stats for each article via RPC.
  const decorated = await Promise.all(
    articles.map(async (a) => {
      const { data: statsData } = await supabase.rpc("get_article_stats", {
        p_article_id: a.id,
      });
      const row = statsData?.[0] ?? { views: 0, comments: 0, likes: 0 };
      return { ...a, stats: { views: row.views, comments: row.comments, likes: row.likes } };
    })
  );

  if (sort === "trending") {
    decorated.sort((a, b) => {
      const score = (x: typeof a) => {
        const ageDays =
          (Date.now() - new Date(x.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        const raw = x.stats.views + 4 * x.stats.comments + 2 * x.stats.likes;
        return raw / Math.max(1, ageDays + 1);
      };
      return score(b) - score(a);
    });
  }

  return Response.json({ articles: decorated });
}
