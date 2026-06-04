import { supabase } from "../../lib/supabase";

const MILESTONES = [10, 25, 50, 100, 250, 500];

export function getCrossedMilestone(oldCount: number, newCount: number): number | null {
  const crossed = MILESTONES.find((m) => oldCount < m && newCount >= m);
  return crossed ?? null;
}

export async function notifyLikeMilestone(
  targetType: "post" | "comment",
  targetId: string,
  recipientId: string,
  actorId: string,
  milestone: number
) {
  if (recipientId === actorId) return;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("type", `${targetType}_like_milestone`)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("recipient_id", recipientId)
    .contains("metadata", { milestone });

  if ((count ?? 0) > 0) return;

  await supabase.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type: `${targetType}_like_milestone`,  // "post_like_milestone" or "comment_like_milestone"
    target_type: targetType,               // "post" or "comment"
    target_id: targetId,
    is_read: false,
    metadata: { milestone },
  });
}

export async function notifyComment(
  postId: string,
  postAuthorId: string,
  actorId: string
) {
  if (postAuthorId === actorId) return;

  const { data, error } = await supabase.from("notifications").insert({
    recipient_id: postAuthorId,
    actor_id: actorId,
    type: "post_commented",  // ✅ notification type
    target_type: "post",     // ✅ what's being targeted
    target_id: postId,
    is_read: false,
  });

  console.log("notifyComment result:", { data, error });
}

export async function notifyReply(
  commentId: string,
  commentAuthorId: string,
  actorId: string
) {
  if (commentAuthorId === actorId) return;

  const { error } = await supabase.from("notifications").insert({
    recipient_id: commentAuthorId,
    actor_id: actorId,
    type: "comment_replied",  // ✅ notification type
    target_type: "comment",   // ✅ what's being targeted
    target_id: commentId,
    is_read: false,
  });

  if (error) console.error("notifyReply error:", error);
}

export async function notifyMentions(
  content: string,
  sourceType: "post" | "comment",
  sourceId: string,
  actorId: string
) {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g);
  if (!matches) return;

  const usernames = [...new Set(matches.map((m) => m.slice(1)))];

  for (const username of usernames) {
    const { data: mentioned } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!mentioned || mentioned.id === actorId) continue;

    const { error: mentionError } = await supabase.from("mentions").insert({
      mentioned_user_id: mentioned.id,
      source_type: sourceType,
      source_id: sourceId,
    });
    if (mentionError) console.error("mentions insert error:", mentionError);

    const { error } = await supabase.from("notifications").insert({
      recipient_id: mentioned.id,
      actor_id: actorId,
      type: "mentioned",       // ✅ notification type
      target_type: sourceType, // ✅ "post" or "comment"
      target_id: sourceId,
      is_read: false,
    });
    if (error) console.error("notifyMentions error:", error);
  }
}