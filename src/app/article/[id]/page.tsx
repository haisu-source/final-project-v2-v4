import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { formatDistanceToNow } from "date-fns";
import { getSupabase } from "@/lib/supabase";
import type { Action, Article, CommunityEvent, EngagementStats } from "@/lib/types";
import CommentSection from "@/components/CommentSection";
import EngagementMetrics from "@/components/EngagementMetrics";
import QRCode from "@/components/QRCode";
import ActionsAndEvents from "@/components/ActionsAndEvents";
import CatchMeUp from "./CatchMeUp";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  politics: "Politics",
  culture: "Culture",
  education: "Education",
  health: "Health",
  tech: "Tech",
};

async function loadArticle(id: string): Promise<{
  article: Article;
  stats: EngagementStats;
  actions: Action[];
  events: CommunityEvent[];
} | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  const article = data as Article;

  // Record a view for this SSR request.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anon";
  const ua = h.get("user-agent") ?? "anon";
  const viewerHash = crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
  await supabase.rpc("increment_view", {
    p_article_id: id,
    p_viewer_hash: viewerHash,
  });

  // Fetch stats, actions, events in parallel.
  const [statsRes, actionsRes, eventsRes] = await Promise.all([
    supabase.rpc("get_article_stats", { p_article_id: id }),
    supabase.from("actions").select("*").eq("article_id", id),
    // Keep the panel fresh: hide events that finished more than 12 hours
    // ago (or — if no ends_at — that started more than 12 hours ago). Today's
    // and future events still show, sorted soonest first.
    supabase
      .from("community_events")
      .select("*")
      .eq("article_id", id)
      .or(
        `ends_at.gte.${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},and(ends_at.is.null,starts_at.gte.${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()})`
      )
      .order("starts_at", { ascending: true }),
  ]);

  const statsRow = statsRes.data?.[0] ?? { views: 0, comments: 0, likes: 0 };

  return {
    article,
    stats: { views: statsRow.views, comments: statsRow.comments, likes: statsRow.likes },
    actions: (actionsRes.data as Action[]) ?? [],
    events: (eventsRes.data as CommunityEvent[]) ?? [],
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadArticle(id);
  if (!data) notFound();

  const { article, stats, actions, events } = data;
  const time = formatDistanceToNow(new Date(article.created_at), {
    addSuffix: true,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        <span className="rounded-full bg-[var(--muted-bg)] px-2 py-0.5 font-semibold text-[var(--ink)]">
          {CATEGORY_LABEL[article.category] ?? article.category}
        </span>
        <span>{article.source}</span>
        {article.location && <span>· {article.location}</span>}
        <span>· {time}</span>
      </div>

      <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
        {article.title}
      </h1>

      {article.author && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          By {article.author}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--border)] py-3">
        <EngagementMetrics stats={stats} size="md" />
        <QRCode articleId={article.id} articleTitle={article.title} />
      </div>

      <div className="mt-6 max-w-none font-serif text-[15.5px] leading-[1.75] text-[var(--ink)]">
        {article.body.split(/\n\n+/).map((p, i) => (
          <p key={i} className="mb-4">
            {p}
          </p>
        ))}
      </div>

      <ActionsAndEvents actions={actions} events={events} />

      <div className="mt-8">
        <CatchMeUp articleId={article.id} />
      </div>

      <div className="mt-10">
        <CommentSection
          articleId={article.id}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
        />
      </div>
    </article>
  );
}
