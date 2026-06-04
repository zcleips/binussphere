"use client";
import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Heart,
  MessageSquare,
  CornerDownRight,
  AtSign,
  TrendingUp,
  CheckCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNotificationContext } from "../context/NotificationContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: { milestone?: number } | null;
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null;
  target_type: string | null;
  target_id: string | null;
};

type RawNotification = Omit<Notification, "actor"> & {
  actor: { username: string; display_name: string | null; avatar_url: string | null }[] | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function notifIcon(type: string) {
  if (type.includes("like_milestone"))
    return (
      <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-red-500" />
      </div>
    );
  if (type === "post_commented")
    return (
      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-blue-500" />
      </div>
    );
  if (type === "comment_replied")
    return (
      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <CornerDownRight className="w-5 h-5 text-blue-500" />
      </div>
    );
  if (type === "mentioned")
    return (
      <div className="w-11 h-11 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <AtSign className="w-5 h-5 text-yellow-600" />
      </div>
    );
  return (
    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <Heart className="w-5 h-5 text-slate-400" />
    </div>
  );
}

function notifText(notif: Notification): string {
  const actor = notif.actor?.display_name || notif.actor?.username || "Someone";
  switch (notif.type) {
    case "post_like_milestone":
      return `Your post reached ${notif.metadata?.milestone} upvotes!`;
    case "comment_like_milestone":
      return `Your comment reached ${notif.metadata?.milestone} upvotes!`;
    case "post_commented":
      return `${actor} commented on your post.`;
    case "comment_replied":
      return `${actor} replied to your comment.`;
    case "mentioned":
      return `${actor} mentioned you.`;
    default:
      return "New notification.";
  }
}

function notifLink(notif: Notification): string {
  if (notif.target_type === "post" && notif.target_id)
    return `/forum/post/${notif.target_id}`;
  if (notif.target_type === "comment" && notif.target_id)
    return `/forum`;
  return "/forum";
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Local counts derived from fetched list — used in the page header + summary
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const likeCount = notifications.filter((n) => n.type.includes("like_milestone")).length;
  const commentCount = notifications.filter(
    (n) => n.type === "post_commented" || n.type === "comment_replied"
  ).length;
  const mentionCount = notifications.filter((n) => n.type === "mentioned").length;

  // Global context — used for sidebar badge across all pages
  const { unreadCount: sidebarUnreadCount, resetUnread } = useNotificationContext();

  // Reset the global badge as soon as the user lands on this page
  useEffect(() => {
    resetUnread();
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select(`
        id, type, is_read, created_at, metadata, target_type, target_id,
        actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const mapped = (data as RawNotification[]).map((n) => ({
        ...n,
        actor: Array.isArray(n.actor) ? (n.actor[0] ?? null) : n.actor,
      }));
      setNotifications(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchNotifications(user.id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchNotifications]);

  async function markAllRead() {
    if (!currentUserId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", currentUserId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markOneRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link
            href="/messages"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center transition"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
          <Link href="/profile" className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition">
            Profile
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr_300px] gap-6 px-6 py-6">
        {/* Left sidebar */}
        <aside className="sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" active badge={sidebarUnreadCount} />
            <MenuItem text="Profile" href="/profile" />
          </div>
        </aside>

        {/* Main content */}
        <section className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">Notifications</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-600 transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold text-slate-600 dark:text-slate-400">
                  Belum ada notifikasi.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Notifikasi akan muncul saat ada yang berinteraksi dengan postinganmu.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notifLink(notif)}
                  onClick={() => !notif.is_read && markOneRead(notif.id)}
                  className={`flex gap-4 p-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition last:border-0 ${
                    !notif.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {notifIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {notif.type.includes("like_milestone") ? (
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {notifText(notif)}
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {notif.actor?.display_name || notif.actor?.username || "Someone"}
                          </span>{" "}
                          {notif.type === "post_commented" && "commented on your post."}
                          {notif.type === "comment_replied" && "replied to your comment."}
                          {notif.type === "mentioned" && "mentioned you."}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Right sidebar — Activity Summary */}
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-extrabold text-lg mb-4">Activity Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <TrendingUp className="w-4 h-4 text-red-400" />
                  Milestone reached
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{likeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Comments & replies
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{commentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <AtSign className="w-4 h-4 text-yellow-500" />
                  Mentions
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{mentionCount}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MenuItem({
  text,
  href,
  active = false,
  badge = 0,
}: {
  text: string;
  href: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold cursor-pointer transition ${
        active
          ? "bg-blue-500 text-white"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
      }`}
    >
      <span>{text}</span>
      {badge > 0 && (
        <span
          className={`text-xs font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
            active
              ? "bg-white/30 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}