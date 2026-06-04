import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function useUnreadNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    async function fetchCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    }

    fetchCount();

    // Realtime subscription — increment when new notification arrives
    const channel = supabase
      .channel(`notif-badge-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => setUnreadCount((c) => c + 1)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchCount() // re-fetch on mark-read
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}