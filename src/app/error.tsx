"use client";

// Root error boundary. Catches any uncaught error thrown from a server or
// client component below the root layout (Supabase outage, Groq failure,
// rendering bug) and shows a non-default page with a way back.

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in Vercel runtime logs so we can chase real incidents.
    console.error("[presshub] root error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
        Something broke
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
        We hit a snag loading this page.
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        It&apos;s on us — try again, or head back to the feed. If this keeps
        happening, screenshot this page and let us know.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-[var(--muted)]">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)]"
        >
          Back to the feed
        </Link>
      </div>
    </div>
  );
}
