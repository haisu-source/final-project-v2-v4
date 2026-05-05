import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import type { Article, Comment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { articleId } = (await req.json()) as { articleId?: string };
  if (!articleId) {
    return Response.json({ error: "articleId required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const [{ data: a }, { data: c }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", articleId).single(),
    supabase
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true }),
  ]);
  const article = (a as Article) ?? null;
  const comments = (c as Comment[]) ?? [];

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const thread = comments
    .slice(0, 60)
    .map((c) => `${c.user_name}: ${c.body}`)
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Catch a newcomer up on this comment thread in 3-4 sentences. Keep the tone conversational. Highlight points of agreement, disagreement, and the most-cited concerns.

Article: "${article.title}" — ${article.source}
Excerpt: ${article.excerpt}

Comments (${comments.length}):
${thread}`,
      },
    ],
  });

  const summary =
    completion.choices[0]?.message?.content || "Could not generate a summary.";

  return Response.json({ summary });
}
