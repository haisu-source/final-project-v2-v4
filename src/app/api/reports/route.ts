import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to report a comment." }, { status: 401 });
  }

  const limit = rateLimit(`report:${clientKey(req, userId)}`, {
    capacity: 10,
    refillPerSec: 10 / 60,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "Too many reports. Try again shortly." },
      { status: 429 }
    );
  }

  const { comment_id, reason } = (await req.json()) as {
    comment_id?: string;
    reason?: string;
  };
  if (!comment_id) {
    return Response.json({ error: "comment_id required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("reports").insert({
    comment_id,
    reporter_id: userId,
    reason: reason?.slice(0, 500) ?? null,
  });

  // Unique violation = already reported by this user. Treat as success-ish.
  if (error && error.code === "23505") {
    return Response.json({ ok: true, already: true }, { status: 409 });
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
