"use client";

// "Pick up where you left off" — reads from localStorage so it works for
// signed-out visitors too, with zero new backend. Uses useSyncExternalStore
// (no setState-in-effect, no hydration flash) and listens for both the
// native `storage` event (cross-tab) and our custom one (same-tab writes
// from RecordReadingHistory and the Clear button below).

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const KEY = "presshub:reading-history";
const CHANGE_EVENT = "presshub:history-changed";

export interface HistoryItem {
  id: string;
  title: string;
  source: string;
  category: string;
  location?: string;
  viewedAt: string; // ISO
}

function readSnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is HistoryItem =>
        x && typeof x.id === "string" && typeof x.viewedAt === "string"
    );
  } catch {
    return [];
  }
}

// useSyncExternalStore requires referentially-stable snapshots when the
// underlying data hasn't changed, or React loops. Cache the JSON-equal
// last snapshot and reuse it.
let cachedRaw: string | null = null;
let cachedItems: HistoryItem[] = [];

function getSnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  cachedItems = readSnapshot().sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );
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

function clearHistory() {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // private mode or storage disabled — nothing to clear
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  politics: "Politics",
  culture: "Culture",
  education: "Education",
  health: "Health",
  tech: "Tech",
};

export default function ReadingHistory() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  if (items.length === 0) return null;
  const top = items.slice(0, 6);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">
          Pick up where you left off
        </h2>
        <button
          onClick={clearHistory}
          className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--primary)]"
        >
          Clear
        </button>
      </div>

      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3">
        {top.map((it) => (
          <li
            key={it.id}
            className="min-w-[260px] shrink-0 snap-start sm:min-w-0 sm:shrink"
          >
            <Link
              href={`/article/${it.id}`}
              className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                {CATEGORY_LABEL[it.category] ?? it.category}
              </p>
              <h3 className="mt-1 line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-[var(--ink)]">
                {it.title}
              </h3>
              <p className="mt-auto pt-3 text-[11px] text-[var(--muted)]">
                {it.source}
                {" · read "}
                {formatDistanceToNow(new Date(it.viewedAt), {
                  addSuffix: true,
                })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
