"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

type NotificationContextType = {
  unreadCount: number;
  resetUnread: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  resetUnread: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchCount = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", uid)
      .eq("is_read", false);
    console.log("fetchCount result:", { uid, count });
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
    console.log("NotificationContext user:", user?.id); // ← add this
      if (user) {
        setUserId(user.id);
        fetchCount(user.id);
      }
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) fetchCount(uid);
      else setUnreadCount(0);
    });

    return () => subscription.unsubscribe();
  }, [fetchCount]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`global-notif-badge-${userId}`)
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
        () => fetchCount(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCount]);

  // Call this when user visits /notifications to reset badge
  function resetUnread() {
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, resetUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}