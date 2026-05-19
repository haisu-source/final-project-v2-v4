"use client";

// Full reading history. Reads the same localStorage key as the home page
// "Pick up where you left off" strip, but shows everything (up to the 20
// stored entries), in a fuller list. Per-browser, signed-in or not.

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const KEY = "presshub:reading-history";
const CHANGE_EVENT = "presshub:history-changed";

interface HistoryItem {
  id: string;
  title: string;
  source: string;
  category: string;
  location?: string;
  viewedAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  politics: "Politics",
  culture: "Culture",
  education: "Education",
  health: "Health",
  tech: "Tech",
};

let cachedRaw: string | null = null;
let cachedItems: HistoryItem[] = [];

function getSnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedItems = (Array.isArray(parsed) ? parsed : [])
      .filter(
        (x: HistoryItem) =>
          x && typeof x.id === "string" && typeof x.viewedAt === "string"
      )
      .sort(
        (a: HistoryItem, b: HistoryItem) =>
          new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      );
  } catch {
    cachedItems = [];
  }
  return cachedItems;
}

function getServerSnapshot(): HistoryItem[] {
  return [];
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

function clearAll() {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

function removeOne(id: string) {
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const next = arr.filter((it) => it && it.id !== id);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export default function HistoryPage() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
          Your reading history
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--primary)]"
          >
            Clear all
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-[var(--muted)]">
        Stored locally in this browser. Up to your 20 most recent reads.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="font-serif text-lg font-semibold text-[var(--ink)]">
            Nothing here yet.
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Read an article and it shows up here automatically.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
          >
            Back to the feed
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                  {CATEGORY_LABEL[it.category] ?? it.category}
                </p>
                <Link
                  href={`/article/${it.id}`}
                  className="mt-1 block font-serif text-[17px] font-semibold leading-snug text-[var(--ink)] hover:text-[var(--primary)]"
                >
                  {it.title}
                </Link>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  {it.source}
                  {it.location ? ` · ${it.location}` : ""}
                  {" · read "}
                  {formatDistanceToNow(new Date(it.viewedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <button
                onClick={() => removeOne(it.id)}
                aria-label="Remove from history"
                className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)] opacity-0 transition-opacity hover:text-[var(--primary)] group-hover:opacity-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
