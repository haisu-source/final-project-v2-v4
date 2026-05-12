"use client";

import { useState } from "react";
import { SparkleIcon } from "@/components/icons";

export default function CatchMeUp({ articleId }: { articleId: string }) {
  const [streaming, setStreaming] = useState(false);
  const [summary, setSummary] = useState("");
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setStarted(true);
    setStreaming(true);
    setError(null);
    setSummary("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not summarize");
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setSummary((prev) => prev + chunk);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setStreaming(false);
    }
  }

  if (started) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <SparkleIcon size={16} className="text-[var(--primary)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink)]">
            Catch me up
          </span>
        </div>
        {summary ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
            {summary}
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 -translate-y-px animate-pulse bg-[var(--primary)] align-middle" />
            )}
          </p>
        ) : streaming ? (
          <div className="space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--border)]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border)]" />
          </div>
        ) : null}
        {error && <p className="mt-2 text-xs text-[var(--primary)]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={streaming}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-60"
      >
        <SparkleIcon size={16} />
        Catch me up on this discussion
      </button>
      {error && <p className="mt-2 text-xs text-[var(--primary)]">{error}</p>}
    </div>
  );
}
