"use client";

import { useState } from "react";
import { SparkleIcon } from "@/components/icons";

export default function CatchMeUp({ articleId }: { articleId: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (!res.ok) throw new Error("Could not summarize");
      const j = (await res.json()) as { summary: string };
      setSummary(j.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <SparkleIcon size={16} className="text-[var(--primary)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink)]">
            Catch me up
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
          {summary}
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-60"
      >
        <SparkleIcon size={16} />
        {loading ? "Reading the thread…" : "Catch me up on this discussion"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--primary)]">{error}</p>}
    </div>
  );
}
