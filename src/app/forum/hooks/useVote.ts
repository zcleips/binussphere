import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { getCrossedMilestone, notifyLikeMilestone } from "./notificationUtils";

export function useVote(
  targetId: string,
  targetType: "post" | "comment",
  initialCount: number,
  initialVote: 1 | -1 | null
) {
  const [likeCount, setLikeCount] = useState(initialCount);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialVote);

  async function vote(direction: 1 | -1) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const isUnvoting = userVote === direction;
    const oldCount = likeCount;

    if (isUnvoting) {
      const newCount = likeCount - direction;
      setLikeCount(newCount);
      setUserVote(null);
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
    } else {
      const newCount = likeCount + direction - (userVote ?? 0);
      setLikeCount(newCount);
      setUserVote(direction);

      await supabase.from("likes").upsert(
        {
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          direction,
        },
        { onConflict: "user_id,target_type,target_id" }
      );

      // Only check milestones on upvotes
      if (direction === 1) {
        const milestone = getCrossedMilestone(oldCount, newCount);
        if (milestone) {
          // Fetch the author of the target
          const table = targetType === "post" ? "posts" : "comments";
          const authorField = "author_id";
          const { data: target } = await supabase
            .from(table)
            .select(authorField)
            .eq("id", targetId)
            .single();

          if (target) {
            await notifyLikeMilestone(
              targetType,
              targetId,
              target.author_id,
              user.id,
              milestone
            );
          }
        }
      }
    }
  }

  return { likeCount, userVote, vote };
}

export function useBookmark(postId: string, initialBookmarked: boolean = false) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  async function toggleBookmark() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (bookmarked) {
      setBookmarked(false);
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
    } else {
      setBookmarked(true);
      await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, post_id: postId });
    }
  }

  return { bookmarked, toggleBookmark };
}