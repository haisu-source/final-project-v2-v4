import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Article, CommunityEvent } from "@/lib/types";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  GlobeIcon,
  MapPinIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

function formatLong(iso: string, endIso?: string | null): string {
  const start = new Date(iso);
  const datePart = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endIso) return `${datePart} · ${timePart}`;
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart} – ${endTime}`;
  }
  const endDate = end.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${datePart} – ${endDate}`;
}

function relativeFromNow(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const minutes = Math.round(abs / 60000);
  if (minutes < 60) return ms >= 0 ? `in ${minutes} min` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return ms >= 0 ? `in ${hours} hr` : `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return ms >= 0 ? `in ${days} day${days === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"} ago`;
}

async function loadEvent(id: string): Promise<{
  event: CommunityEvent;
  article: Pick<Article, "id" | "title" | "source">;
} | null> {
  const supabase = getSupabase();
  const { data: e } = await supabase
    .from("community_events")
    .select("*")
    .eq("id", id)
    .single();
  if (!e) return null;
  const event = e as CommunityEvent;
  const { data: art } = await supabase
    .from("articles")
    .select("id, title, source")
    .eq("id", event.article_id)
    .single();
  if (!art) return null;
  return { event, article: art as Pick<Article, "id" | "title" | "source"> };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadEvent(id);
  if (!data) notFound();
  const { event, article } = data;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/article/${article.id}`}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--primary)]"
      >
        ← Back to {article.source}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            event.is_online
              ? "bg-emerald-100 text-emerald-900"
              : "bg-[var(--muted-bg)] text-[var(--ink)]"
          }`}
        >
          {event.is_online ? (
            <>
              <GlobeIcon size={10} /> Online
            </>
          ) : (
            <>
              <MapPinIcon size={10} /> In person
            </>
          )}
        </span>
        <span className="font-medium text-[var(--ink)]">
          {relativeFromNow(event.starts_at)}
        </span>
      </div>

      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
        {event.title}
      </h1>

      {event.organizer && (
        <p className="mt-2 text-sm text-[var(--muted)]">by {event.organizer}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <CalendarIcon size={12} /> When
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--ink)]">
            {formatLong(event.starts_at, event.ends_at)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <MapPinIcon size={12} /> Where
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-snug text-[var(--ink)]">
            {event.location}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          What to expect
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]">
          {event.description}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={`/api/event/${event.id}/ics`}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
        >
          <CalendarIcon size={14} />
          Add to calendar
        </a>
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Details + RSVP
            <ArrowUpRightIcon size={14} />
          </a>
        )}
      </div>

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
