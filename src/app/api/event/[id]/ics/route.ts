import { getSupabase } from "@/lib/supabase";
import type { CommunityEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

// Minimal RFC-5545 escape for TEXT values: backslashes, commas, semicolons,
// and newlines.
function ics(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDate(iso: string): string {
  // 2026-05-19T17:00:00Z -> 20260519T170000Z (UTC, Zulu).
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("community_events")
    .select("*")
    .eq("id", id)
    .single();
  const event = data as CommunityEvent | null;
  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  // Default to a one-hour block when the event has no explicit end.
  const start = event.starts_at;
  const end =
    event.ends_at ??
    new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000).toISOString();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PressHub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@presshub`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${ics(event.title)}`,
    `DESCRIPTION:${ics(event.description)}`,
    `LOCATION:${ics(event.location)}`,
    event.organizer ? `ORGANIZER;CN=${ics(event.organizer)}:MAILTO:noreply@presshub.local` : "",
    event.url ? `URL:${ics(event.url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  // RFC 5545 wants CRLF line endings.
  const body = lines.join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="presshub-event-${event.id}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
