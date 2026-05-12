export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-8">
        <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--muted-bg)] sm:h-12" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[var(--muted-bg)]" />
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-[var(--muted-bg)]"
          />
        ))}
      </div>

      <FeedSkeleton title="Trending" />
      <FeedSkeleton title="Recent" />
    </div>
  );
}

function FeedSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-serif text-2xl font-semibold text-[var(--ink)]">
        {title}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="aspect-[16/9] w-full animate-pulse bg-[var(--muted-bg)]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="flex gap-3 pt-2">
          <div className="h-3 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
        </div>
      </div>
    </div>
  );
}
