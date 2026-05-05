"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    load();
  }, [load]);

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
        <p className="text-sm text-[var(--muted)]">Loading discussion...</p>
      )}
      {!loading && tree.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No comments yet. Be the first.
        </p>
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
