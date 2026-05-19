"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment as CommentType } from "@/lib/types";
import { buildCommentTree } from "@/lib/comment-tree";
import Comment from "./Comment";
import CommentInput from "./CommentInput";

interface Props {
  articleId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export default function CommentSection({
  articleId,
  supabaseUrl,
  supabaseKey,
}: Props) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/comments?articleId=${articleId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const j = (await res.json()) as { comments: CommentType[] };
      setComments(j.comments);
    }
    setLoading(false);
  }, [articleId]);

  // Initial fetch. Inlined (instead of calling `load()` directly in the effect
  // body) so the lint rule that flags synchronous setState-in-effect stays
  // satisfied — every setState here lives behind an await, and a cancellation
  // guard prevents writes after unmount or articleId change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/comments?articleId=${articleId}`, {
        cache: "no-store",
      });
      if (cancelled) return;
      if (res.ok) {
        const j = (await res.json()) as { comments: CommentType[] };
        if (cancelled) return;
        setComments(j.comments);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    let unmounted = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      if (unmounted) return;
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const channel = client
        .channel(`comments:${articleId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
            filter: `article_id=eq.${articleId}`,
          },
          () => {
            load();
          }
        )
        .subscribe();
      cleanup = () => {
        client.removeChannel(channel);
      };
    })();
    return () => {
      unmounted = true;
      if (cleanup) cleanup();
    };
  }, [articleId, load, supabaseKey, supabaseUrl]);

  const tree = buildCommentTree(comments, 2);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">
          Discussion
          <span className="ml-2 text-sm font-normal text-[var(--muted)]">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </h2>
      </div>

      <CommentInput articleId={articleId} onPosted={load} />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--muted-bg)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-[var(--muted-bg)]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[var(--muted-bg)]" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--muted-bg)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && tree.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--ink)]">
            No comments yet.
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Be the first to weigh in on what this means for your block.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tree.map((c) => (
          <Comment
            key={c.id}
            comment={c}
            articleId={articleId}
            onChanged={load}
          />
        ))}
      </div>
    </section>
  );
}
