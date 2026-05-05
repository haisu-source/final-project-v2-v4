"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon, SparkleIcon } from "./icons";

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  relevance: string;
}

interface Result {
  analysis: string;
  relatedArticles: RelatedArticle[];

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
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (!res.ok) {
        throw new Error("Request failed");
      }
      const j = (await res.json()) as Result;
      setResult(j);
    } catch (e) {
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

      {!result && !loading && (
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

      {loading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-[var(--muted-bg)]" />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
              {result.analysis}
            </p>
          </div>

          {result.relatedArticles.length > 0 && (
            <div>
              <h2 className="mb-2 font-serif text-lg font-semibold text-[var(--ink)]">
                Related coverage
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.relatedArticles.map((a) => (
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
