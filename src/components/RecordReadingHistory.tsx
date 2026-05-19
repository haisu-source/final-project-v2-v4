"use client";

// No-render side-effect component placed on the article page. Writes a
// compact entry into the same localStorage key that ReadingHistory reads,
// then fires the custom change event so the home page picks it up next
// time the visitor lands there (or live, if the tab is still open).

import { useEffect } from "react";
import type { HistoryItem } from "./ReadingHistory";

const KEY = "presshub:reading-history";
const CHANGE_EVENT = "presshub:history-changed";
const MAX = 20;

interface Props {
  article: {
    id: string;
    title: string;
    source: string;
    category: string;
    location?: string | null;
  };
}

export default function RecordReadingHistory({ article }: Props) {
  // Dependencies are primitive fields, not the article object — avoids
  // re-running on each render of the parent server component.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const arr: HistoryItem[] = raw ? JSON.parse(raw) : [];
      const filtered = arr.filter((it) => it && it.id !== article.id);
      filtered.unshift({
        id: article.id,
        title: article.title,
        source: article.source,
        category: article.category,
        location: article.location ?? undefined,
        viewedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(
        KEY,
        JSON.stringify(filtered.slice(0, MAX))
      );
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Private mode, quota exceeded, or storage disabled — silently skip.
    }
  }, [article.id, article.title, article.source, article.category, article.location]);

  return null;
}
