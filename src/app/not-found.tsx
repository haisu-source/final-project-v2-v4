import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
        404
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        The article may have been removed, or the link is off by a character.
        Head back to the feed and pick up where you left off.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
        >
          Back to the feed
        </Link>
        <Link
          href="/explore"
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)]"
        >
          Try Explore
        </Link>
      </div>
    </div>
  );
}
