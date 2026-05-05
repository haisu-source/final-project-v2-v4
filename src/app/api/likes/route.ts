import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comment_id } = (await req.json()) as { comment_id?: string };
  if (!comment_id) {
    return Response.json({ error: "comment_id required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("comment_id", comment_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert({ comment_id, user_id: userId });
  }

  const { count } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", comment_id);

  return Response.json({ liked: !existing, count: count ?? 0 });
}

export const POST = handle;
export const DELETE = handle;
