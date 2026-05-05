import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  relevance: string;
}

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query?: string };
  if (!query || !query.trim()) {
    return Response.json({ error: "query required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  const articles = (data as Article[]) ?? [];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const corpus = articles
    .map(
      (a) =>
        `[id=${a.id}] [${a.category}] "${a.title}" — ${a.source} (${a.location ?? ""})\n${a.body.slice(0, 700)}`
    )
    .join("\n\n---\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `You are a community news analyst for PressHub. Given the following articles from community newspapers, answer the reader's question. Connect dots between stories where it helps.

Articles:
${corpus}

Reader question: "${query}"

Respond as raw JSON with this shape (no markdown fences):
{"analysis":"<2-3 paragraphs>","relatedArticles":[{"id":"...","title":"...","source":"...","category":"...","relevance":"<one sentence>"}]}
Include up to 3 related articles. Use only ids that exist in the list above.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
    const parsed = JSON.parse(cleaned) as {
      analysis: string;
      relatedArticles: RelatedArticle[];
    };
    return Response.json(parsed);
  } catch {
    return Response.json({
      analysis:
        "I had trouble formatting the response. Please try a different phrasing.",
      relatedArticles: [],
    });
  }
}
