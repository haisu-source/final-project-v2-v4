export default function ArticleLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--muted-bg)]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted-bg)]" />
      </div>

      <div className="space-y-3">
        <div className="h-9 w-full animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-[var(--muted-bg)]" />
      </div>

      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-[var(--muted-bg)]" />

      <div className="mt-5 flex items-center justify-between border-y border-[var(--border)] py-3">
        <div className="flex gap-4">
          <div className="h-4 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[var(--muted-bg)]" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-[var(--muted-bg)]" />
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[var(--muted-bg)]"
            style={{ width: `${75 + ((i * 7) % 25)}%` }}
          />
        ))}
      </div>

      <div className="mt-10 space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-[var(--muted-bg)]" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-[var(--muted-bg)]" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-[var(--muted-bg)]" />
      </div>
    </article>
  );
}
