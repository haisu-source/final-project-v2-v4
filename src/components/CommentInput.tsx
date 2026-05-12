"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

interface Props {
  articleId: string;
  parentId?: string | null;
  placeholder?: string;
  onPosted?: () => void;
  compact?: boolean;
}

export default function CommentInput({
  articleId,
  parentId = null,
  placeholder,
  onPosted,
  compact,
}: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          body: body.trim(),
          parent_id: parentId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed to post");
      }
      setBody("");
      onPosted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  }

  const wrapperClass = compact
    ? ""
    : "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4";

  if (!isLoaded) {
    return (
      <div className={wrapperClass}>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={wrapperClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[var(--muted)]">
            Sign in to join the conversation.
          </p>
          <Link
            href="/sign-in"
            className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary-dark)]"
          >
            Sign in to comment
          </Link>
        </div>
      </div>
    );
  }

  const MAX = 1000;
  const remaining = MAX - body.length;
  const counterClass =
    remaining < 0
      ? "text-[var(--primary)] font-semibold"
      : remaining <= 100
        ? "text-amber-600 dark:text-amber-400"
        : "text-[var(--muted)]";
  const overLimit = remaining < 0;

  return (
    <div className={wrapperClass}>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? "Add to the conversation…"}
          rows={compact ? 2 : 3}
          maxLength={MAX + 200}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
        />
        {error && <p className="text-xs text-[var(--primary)]">{error}</p>}
        <div className="flex items-center justify-between">
          <span className={`text-xs tabular-nums ${counterClass}`}>
            {overLimit
              ? `${Math.abs(remaining)} over`
              : `${body.length}/${MAX}`}
          </span>
          <button
            type="submit"
            disabled={submitting || !body.trim() || overLimit}
            className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
