import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { Article, Category, EngagementStats } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "politics", label: "Politics" },
  { value: "culture", label: "Culture" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "tech", label: "Tech" },
];

const VALID_CATEGORIES: Category[] = [
  "politics",
  "culture",
  "education",
  "health",
  "tech",
];

type FeedItem = Article & { stats: EngagementStats };

async function fetchFeed(
  sort: string,
  category: string | null,
  location: string | null
): Promise<FeedItem[]> {
  const supabase = getSupabase();
  const query = supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query.eq("category", category);
  }
  if (location) {
    query.ilike("location", `%${location}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  const articles = (data as Article[]) ?? [];

  const decorated: FeedItem[] = await Promise.all(
    articles.map(async (a) => {
      const { data: statsData } = await supabase.rpc("get_article_stats", {
        p_article_id: a.id,
      });
      const row = statsData?.[0] ?? { views: 0, comments: 0, likes: 0 };
      return {
        ...a,
        stats: { views: row.views, comments: row.comments, likes: row.likes },
      };
    })
  );

  if (sort === "trending") {
    decorated.sort((a, b) => {
      const score = (x: FeedItem) => {
        const ageDays =
          (Date.now() - new Date(x.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        const raw = x.stats.views + 4 * x.stats.comments + 2 * x.stats.likes;
        return raw / Math.max(1, ageDays + 1);
      };
      return score(b) - score(a);
    });
  } else {
    decorated.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return decorated;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; location?: string }>;
}) {
  const sp = await searchParams;
  const activeCategory = sp.category ?? "all";
  const activeLocation = sp.location ?? null;

  const cat =
    activeCategory !== "all" &&
    (VALID_CATEGORIES as string[]).includes(activeCategory)
      ? activeCategory
      : null;

  // Fetch available locations for the filter pills.
  const supabase = getSupabase();
  const { data: locData } = await supabase
    .from("articles")
    .select("location")
    .not("location", "is", null);
  const locations = Array.from(
    new Set((locData ?? []).map((r: { location: string }) => r.location).filter(Boolean))
  ).sort() as string[];

  const [trending, recent] = await Promise.all([
    fetchFeed("trending", cat, activeLocation),
    fetchFeed("recent", cat, activeLocation),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          The community, in conversation.
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Read what your local paper printed this week, then weigh in on what it
          means for your block. PressHub bridges the page to the stoop.
        </p>
      </section>

      {locations.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Location
          </span>
          {[{ value: null, label: "All" }, ...locations.map((l) => ({ value: l, label: l }))].map(
            (loc) => {
              const isActive =
                (loc.value === null && !activeLocation) ||
                loc.value === activeLocation;
              const params = new URLSearchParams();
              if (loc.value) params.set("location", loc.value);
              if (cat) params.set("category", cat);
              const href = params.toString() ? `/?${params}` : "/";
              return (
                <Link
                  key={loc.label}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]"
                  }`}
                >
                  {loc.label}
                </Link>
              );
            }
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const isActive =
            (c.value === "all" && activeCategory === "all") ||
            c.value === activeCategory;
          const params = new URLSearchParams();
          if (c.value !== "all") params.set("category", c.value);
          if (activeLocation) params.set("location", activeLocation);
          const href = params.toString() ? `/?${params}` : "/";
          return (
            <Link
              key={c.value}
              href={href}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <Section title="Trending" articles={trending} />
      <Section title="Recent" articles={recent} />
    </div>
  );
}

function Section({
  title,
  articles,
}: {
  title: string;
  articles: (Article & { stats: EngagementStats })[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-serif text-2xl font-semibold text-[var(--ink)]">
        {title}
      </h2>
      {articles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
          No articles in this category yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
