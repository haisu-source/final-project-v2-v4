"use client";

import { useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import type { Comment as CommentType } from "@/lib/types";
import { HeartIcon, ReplyIcon, FlagIcon } from "./icons";
import CommentInput from "./CommentInput";

interface Props {
  comment: CommentType;
  articleId: string;
  depth?: number;
  onChanged?: () => void;
}

export default function Comment({
  comment,
  articleId,
  depth = 0,
  onChanged,
}: Props) {
  const { isSignedIn } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState<boolean>(!!comment.liked_by_me);
  const [likeCount, setLikeCount] = useState<number>(comment.like_count ?? 0);
  const [animate, setAnimate] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "done">(
    "idle"
  );
  const requestSeqRef = useRef(0);

  const initial = (comment.user_name?.[0] ?? "?").toUpperCase();
  const time = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });

  async function toggleLike() {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }
    setAnimate(true);
    setTimeout(() => setAnimate(false), 250);

    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    const seq = ++requestSeqRef.current;
    try {
      const res = await fetch("/api/likes", {
        method: prevLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: comment.id }),
      });
      if (!res.ok) throw new Error("like failed");
      const j = (await res.json()) as { liked: boolean; count: number };
      // Only apply if this is still the latest click — otherwise a newer
      // optimistic update is the source of truth.
      if (seq === requestSeqRef.current) {
        setLiked(j.liked);
        setLikeCount(j.count);
      }
    } catch {
      if (seq === requestSeqRef.current) {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    }
  }

  async function report() {
    if (reportState !== "idle") return;
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }
    if (
      !window.confirm(
        "Report this comment to PressHub moderators? They'll review it shortly."
      )
    ) {
      return;
    }
    setReportState("sending");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: comment.id }),
      });
      if (!res.ok && res.status !== 409) throw new Error("Failed to report");
      setReportState("done");
    } catch {
      setReportState("idle");
      window.alert("Couldn't submit the report. Please try again.");
    }
  }

  return (
    <div
      className={
        depth === 0
          ? "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          : "mt-3 border-l-2 border-[var(--border)] pl-4"
      }
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--muted-bg)] font-serif text-sm font-semibold text-[var(--ink)]">
          {comment.user_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.user_avatar}
              alt={comment.user_name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--ink)]">
              {comment.user_name}
            </span>
            <span className="text-xs text-[var(--muted)]">{time}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ink)]">
            {comment.body}
          </p>

          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1 text-xs transition-transform ${
                liked
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              } ${animate ? "scale-125" : ""}`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <HeartIcon size={14} filled={liked} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={() => setShowReply((s) => !s)}
              className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <ReplyIcon size={14} />
              <span>Reply</span>
            </button>
            <button
              onClick={report}
              disabled={reportState !== "idle"}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-60"
              aria-label="Report comment"
            >
              <FlagIcon size={14} />
              <span>
                {reportState === "done"
                  ? "Reported"
                  : reportState === "sending"
                    ? "Sending…"
                    : "Report"}
              </span>
            </button>
          </div>

          {showReply && (
            <div className="mt-3">
              <CommentInput
                articleId={articleId}
                parentId={comment.id}
                placeholder={`Reply to ${comment.user_name}…`}
                compact
                onPosted={() => {
                  setShowReply(false);
                  onChanged?.();
                }}
              />
            </div>
          )}

          {comment.children && comment.children.length > 0 && (
            <div className="mt-3">
              {comment.children.map((child) => (
                <Comment
                  key={child.id}
                  comment={child}
                  articleId={articleId}
                  depth={depth + 1}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
