import Groq from "groq-sdk";
import { getSupabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  relevance: string;
}

export async function POST(req: Request) {
  const limit = rateLimit(`explore:${clientKey(req)}`, {
    capacity: 8,
    refillPerSec: 8 / 60,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "Slow down a moment — try again in a few seconds." },
      { status: 429, headers: { "retry-after": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const analysisStream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are a community news analyst for PressHub. Write a 2-3 paragraph plain-text analysis that connects the dots across the provided articles to answer the reader's question. No headings, no markdown, no JSON.",
            },
            {
              role: "user",
              content: `Articles:\n${corpus}\n\nReader question: "${query}"`,
            },
          ],
        });

        for await (const chunk of analysisStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) send({ type: "text", value: text });
        }

        const relatedRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'Reply with one JSON object {"relatedArticles":[{"id":string,"title":string,"source":string,"category":string,"relevance":string}]}. Up to 3 entries. Use only article ids present in the user message.',
            },
            {
              role: "user",
              content: `Articles:\n${corpus}\n\nReader question: "${query}"`,
            },
          ],
        });

        const parsed = parseRelated(relatedRes.choices[0]?.message?.content ?? "");
        send({ type: "related", articles: parsed });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function parseRelated(text: string): RelatedArticle[] {
  const candidates = [text, text.match(/\{[\s\S]*\}/)?.[0] ?? ""];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const parsed = JSON.parse(c) as { relatedArticles?: RelatedArticle[] };
      if (Array.isArray(parsed.relatedArticles)) return parsed.relatedArticles.slice(0, 3);
    } catch {
      // try next
    }
  }
  return [];
}
