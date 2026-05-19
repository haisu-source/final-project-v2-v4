import Link from "next/link";
import type { Action, ActionKind, CommunityEvent } from "@/lib/types";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckSquareIcon,
  GlobeIcon,
  MapPinIcon,
  MegaphoneIcon,
  ScrollIcon,
  ShareIcon,
  TargetIcon,
  UsersIcon,
} from "./icons";

interface Props {
  actions: Action[];
  events: CommunityEvent[];
}

const KIND_META: Record<ActionKind, { label: string; Icon: typeof MegaphoneIcon }> = {
  pressure: { label: "Pressure", Icon: MegaphoneIcon },
  birddog: { label: "Bird-dog", Icon: TargetIcon },
  organize: { label: "Organize", Icon: UsersIcon },
  testify: { label: "Testify", Icon: ScrollIcon },
  petition: { label: "Petition", Icon: CheckSquareIcon },
  amplify: { label: "Amplify", Icon: ShareIcon },
};

function formatEventTime(iso: string, endIso?: string): string {
  const start = new Date(iso);
  const datePart = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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
    month: "short",
    day: "numeric",
  });
  return `${datePart} – ${endDate}`;
}

export default function ActionsAndEvents({ actions, events }: Props) {
  if (actions.length === 0 && events.length === 0) return null;

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      {actions.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">
              Take action
            </h2>
            <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              Don&apos;t just read it — change it
            </span>
          </div>

          <ul className="space-y-4">
            {actions.map((a) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.Icon;
              return (
                <li
                  key={a.id}
                  className="border-l-2 border-[var(--primary)] pl-4"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                      <Icon size={11} />
                      {meta.label}
                    </span>
                    {a.target && (
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        → {a.target}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-[15px] font-semibold leading-snug text-[var(--ink)]">
                    <Link
                      href={`/action/${a.id}`}
                      className="hover:text-[var(--primary)]"
                    >
                      {a.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {a.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={`/action/${a.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      How to do this
                      <ArrowUpRightIcon size={12} />
                    </Link>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        {a.cta_label ?? "Open the original"}
                        <ArrowUpRightIcon size={12} />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {events.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">
              What&apos;s happening
            </h2>
            <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {events.length} {events.length === 1 ? "event" : "events"}
            </span>
          </div>

          <ul className="space-y-4">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                    <CalendarIcon size={12} />
                    {formatEventTime(e.starts_at, e.ends_at)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      e.is_online
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-[var(--muted-bg)] text-[var(--ink)]"
                    }`}
                  >
                    {e.is_online ? (
                      <>
                        <GlobeIcon size={10} /> Online
                      </>
                    ) : (
                      <>
                        <MapPinIcon size={10} /> In person
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-serif text-[15px] font-semibold leading-snug text-[var(--ink)]">
                  <Link
                    href={`/event/${e.id}`}
                    className="hover:text-[var(--primary)]"
                  >
                    {e.title}
                  </Link>
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  {e.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={11} />
                    {e.location}
                  </span>
                  {e.organizer && <span>by {e.organizer}</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/event/${e.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    Details + add to calendar
                    <ArrowUpRightIcon size={12} />
                  </Link>
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)]"
                    >
                      Open the original
                      <ArrowUpRightIcon size={12} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
