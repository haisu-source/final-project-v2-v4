import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import type { Comment } from "@/lib/types";
import { moderateComment } from "@/lib/moderation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return Response.json({ error: "articleId required" }, { status: 400 });
  }

  const { userId } = await auth();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const comments = (data as Comment[]) ?? [];

  // Annotate with like_count and liked_by_me.
  const commentIds = comments.map((c) => c.id);
  const { data: likes } = await supabase
    .from("likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds.length > 0 ? commentIds : ["__none__"]);

  const likesByComment = new Map<string, { count: number; myLike: boolean }>();
  for (const like of likes ?? []) {
    const entry = likesByComment.get(like.comment_id) ?? { count: 0, myLike: false };
    entry.count++;
    if (userId && like.user_id === userId) entry.myLike = true;
    likesByComment.set(like.comment_id, entry);
  }

  const annotated = comments.map((c) => {
    const info = likesByComment.get(c.id);
    return {
      ...c,
      like_count: info?.count ?? 0,
      liked_by_me: info?.myLike ?? false,
    };
  });

  return Response.json({ comments: annotated });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`comment:${clientKey(req, userId)}`, {
    capacity: 5,
    refillPerSec: 5 / 30,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "You're posting too quickly. Take a breath and try again." },
      { status: 429 }
    );
  }

  const user = await currentUser();
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName.charAt(0)}.`
      : user?.firstName ??
        user?.username ??
        user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
        "Reader";
  const userAvatar = user?.imageUrl ?? null;

  const body = (await req.json()) as {
    article_id?: string;
    body?: string;
    parent_id?: string | null;
  };

  if (!body.article_id || !body.body || !body.body.trim()) {
    return Response.json(
      { error: "article_id and body required" },
      { status: 400 }
    );
  }

  if (body.body.length > 1200) {
    return Response.json(
      { error: "Comment is too long. Please keep it under 1000 characters." },
      { status: 400 }
    );
  }

  const trimmed = body.body.trim().slice(0, 1000);

  const guard = moderateComment(trimmed);
  if (!guard.ok) {
    return Response.json({ error: guard.reason }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      article_id: body.article_id,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      body: trimmed,
      parent_id: body.parent_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ comment: data as Comment }, { status: 201 });
}
