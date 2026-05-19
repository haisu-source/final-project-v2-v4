import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Action, ActionKind, Article } from "@/lib/types";
import {
  ArrowUpRightIcon,
  CheckSquareIcon,
  MegaphoneIcon,
  ScrollIcon,
  ShareIcon,
  TargetIcon,
  UsersIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const KIND_META: Record<
  ActionKind,
  { label: string; tagline: string; Icon: typeof MegaphoneIcon }
> = {
  pressure: {
    label: "Pressure",
    tagline:
      "Pack a hearing, show up where a vote happens, make the seat-count visible.",
    Icon: MegaphoneIcon,
  },
  birddog: {
    label: "Bird-dog",
    tagline:
      "Contact specific named officials with a short, repeated, polite ask.",
    Icon: TargetIcon,
  },
  organize: {
    label: "Organize",
    tagline: "Join the coalition doing the slow work — phone banks, training, doors.",
    Icon: UsersIcon,
  },
  testify: {
    label: "Testify",
    tagline:
      "Get on the public record. Written or live — both end up on every staffer's desk.",
    Icon: ScrollIcon,
  },
  petition: {
    label: "Petition",
    tagline: "Sign the demand. Names add weight; targeted names add more weight.",
    Icon: CheckSquareIcon,
  },
  amplify: {
    label: "Amplify",
    tagline:
      "Carry the work into a room you already host — a class, a church, a chat thread.",
    Icon: ShareIcon,
  },
};

async function loadAction(id: string): Promise<{
  action: Action;
  article: Pick<Article, "id" | "title" | "source">;
} | null> {
  const supabase = getSupabase();
  const { data: a } = await supabase
    .from("actions")
    .select("*")
    .eq("id", id)
    .single();
  if (!a) return null;
  const action = a as Action;
  const { data: art } = await supabase
    .from("articles")
    .select("id, title, source")
    .eq("id", action.article_id)
    .single();
  if (!art) return null;
  return { action, article: art as Pick<Article, "id" | "title" | "source"> };
}

export default async function ActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAction(id);
  if (!data) notFound();
  const { action, article } = data;
  const meta = KIND_META[action.kind];
  const Icon = meta.Icon;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/article/${article.id}`}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--primary)]"
      >
        ← Back to {article.source}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          <Icon size={13} />
          {meta.label}
        </span>
        {action.target && (
          <span className="text-xs font-medium text-[var(--muted)]">
            → {action.target}
          </span>
        )}
      </div>

      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
        {action.title}
      </h1>

      <p className="mt-3 text-sm italic text-[var(--muted)]">{meta.tagline}</p>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          What this is
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]">
          {action.description}
        </p>
      </div>

      {action.target && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Power holder
          </h2>
          <p className="mt-2 font-serif text-lg font-semibold text-[var(--ink)]">
            {action.target}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This action is aimed at moving them — not the public conversation in general.
          </p>
        </div>
      )}

      {action.url && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
          >
            {action.cta_label ?? "Take this on"}
            <ArrowUpRightIcon size={14} />
          </a>
          <Link
            href={`/article/${article.id}`}
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)]"
          >
            Or keep reading the article
          </Link>
        </div>
      )}

      <div className="mt-10 border-t border-[var(--border)] pt-5">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">From the story</p>
        <Link
          href={`/article/${article.id}`}
          className="mt-1 block font-serif text-lg font-semibold text-[var(--ink)] hover:text-[var(--primary)]"
        >
          {article.title}
        </Link>
        <p className="mt-1 text-sm text-[var(--muted)]">{article.source}</p>
      </div>
    </article>
  );
}
