import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import type { Article, Comment } from "@/lib/types";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`summarize:${clientKey(req)}`, {
    capacity: 6,
    refillPerSec: 6 / 60,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "Slow down a moment — try again in a few seconds." },
      { status: 429, headers: { "retry-after": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 400,
          stream: true,
          messages: [
            {
              role: "user",
              content: `Catch a newcomer up on this comment thread in 3-4 sentences. Keep the tone conversational. Highlight points of agreement, disagreement, and the most-cited concerns.\n\nArticle: "${article.title}" — ${article.source}\nExcerpt: ${article.excerpt}\n\nComments (${comments.length}):\n${thread}`,
            },
          ],
        });
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(encoder.encode(`\n\n[error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
