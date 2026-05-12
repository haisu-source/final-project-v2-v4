"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon, SparkleIcon } from "./icons";

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  relevance: string;
}

const SUGGESTIONS = [
  "What's the housing debate about right now?",
  "How are seniors dealing with AI misinformation?",
  "What's happening with charter schools in DC?",
  "Where can I read about community health in Atlanta?",
];

export default function AIExplorer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setAnalysis("");
    setRelated([]);
    setHasResult(true);

    try {
      const res = await fetch("/api/ai/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Request failed");
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed) as
              | { type: "text"; value: string }
              | { type: "related"; articles: RelatedArticle[] }
              | { type: "error"; message: string };
            if (msg.type === "text") {
              setAnalysis((prev) => prev + msg.value);
            } else if (msg.type === "related") {
              setRelated(msg.articles);
            } else if (msg.type === "error") {
              setError(msg.message);
            }
          } catch {
            // ignore partial line
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--ink)]">
          Explore
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Ask a question, and we&apos;ll thread together relevant community
          reporting.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What's happening in your community?"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-3 text-sm text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SparkleIcon size={16} />
          {loading ? "Thinking…" : "Explore"}
        </button>
      </form>

      {!hasResult && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                ask(s);
              }}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-[var(--primary)]">{error}</p>}

      {hasResult && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {analysis ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                {analysis}
                {loading && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 -translate-y-px animate-pulse bg-[var(--primary)] align-middle" />
                )}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--muted-bg)]" />
                <div className="h-3 w-full animate-pulse rounded bg-[var(--muted-bg)]" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--muted-bg)]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--muted-bg)]" />
              </div>
            )}
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="mb-2 font-serif text-lg font-semibold text-[var(--ink)]">
                Related coverage
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((a) => (
                  <Link
                    key={a.id}
                    href={`/article/${a.id}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]"
                  >
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {a.source} · {a.category}
                    </div>
                    <h3 className="mt-1 font-serif text-base font-semibold text-[var(--ink)]">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {a.relevance}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
