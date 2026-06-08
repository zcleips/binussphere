"use client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCategories, useCommunityMembership } from "../forum/hooks/usePosts";
import { useNotificationContext } from "../context/NotificationContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivePage = "forum" | "notifications" | "profile" | "bookmarks" | "community";

type Props = {
  activePage: ActivePage;
  /** Pass the current community slug when activePage === "community" */
  activeCommunitySlug?: string;
  /** If the parent already resolved the user id, pass it in to avoid a double fetch */
  currentUserId?: string | null;
  /** Show "Buat Post" button — pass handler to enable it */
  onCreatePost?: () => void;
  /**
   * Show the Communities section (Followed/Explore toggle + My Communities + Discover).
   * Only needed on Forum and Community pages. Defaults to false.
   */
  showCommunities?: boolean;
  /** Controlled feed view — only used when showCommunities=true */
  feedView?: "followed" | "explore";
  onFeedViewChange?: (view: "followed" | "explore") => void;
};

// ─── MenuItem ─────────────────────────────────────────────────────────────────

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
            active ? "bg-white/30 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ─── ForumSidebar ─────────────────────────────────────────────────────────────

export default function ForumSidebar({
  activePage,
  activeCommunitySlug,
  currentUserId: userIdProp,
  onCreatePost,
  showCommunities = false,
  feedView,
  onFeedViewChange,
}: Props) {
  const { unreadCount } = useNotificationContext();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(userIdProp ?? null);

  // Resolve user id if not provided by parent
  useEffect(() => {
    if (userIdProp !== undefined) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setResolvedUserId(user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setResolvedUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, [userIdProp]);

  // Keep in sync when parent's prop changes
  useEffect(() => {
    if (userIdProp !== undefined) setResolvedUserId(userIdProp);
  }, [userIdProp]);

  const { categories } = useCategories();
  const { joinedCategoryIds, join, leave, isJoined } = useCommunityMembership(
    showCommunities ? resolvedUserId : null
  );

  const joinedCategories = useMemo(
    () => categories.filter((c) => joinedCategoryIds.includes(c.id)),
    [categories, joinedCategoryIds]
  );
  const discoverCategories = useMemo(
    () => categories.filter((c) => !joinedCategoryIds.includes(c.id)),
    [categories, joinedCategoryIds]
  );

  function handleCreatePost() {
    if (!resolvedUserId) { window.location.href = "/"; return; }
    onCreatePost?.();
  }

  function handleJoinLeave(categoryId: string) {
    if (!resolvedUserId) { window.location.href = "/"; return; }
    isJoined(categoryId) ? leave(categoryId) : join(categoryId);
  }

  return (
    <aside className="sticky top-24 h-fit space-y-4">
      {/* Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
        <MenuItem text="Forum"         href="/forum"         active={activePage === "forum"} />
        <MenuItem text="Notifications" href="/notifications" active={activePage === "notifications"} badge={unreadCount} />
        <MenuItem text="Profile"       href="/profile"       active={activePage === "profile"} />
        <MenuItem text="Bookmarks"     href="/bookmarks"     active={activePage === "bookmarks"} />

        {onCreatePost && (
          <button
            onClick={handleCreatePost}
            className="mt-5 w-full rounded-full bg-yellow-400 text-slate-900 font-extrabold py-3 hover:bg-yellow-500 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Buat Post
          </button>
        )}
      </div>

      {/* Communities — only on Forum / Community pages */}
      {showCommunities && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 mb-3 px-1">
            Communities
          </h3>

          {/* Followed / Explore toggle */}
          {onFeedViewChange && (
            <>
              <button
                onClick={() => onFeedViewChange("followed")}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition mb-1 ${
                  feedView === "followed"
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Followed
              </button>
              <button
                onClick={() => onFeedViewChange("explore")}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition mb-4 ${
                  feedView === "explore"
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Explore
              </button>
            </>
          )}

          <p className="px-1 mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            My Communities
          </p>

          {joinedCategories.length === 0 ? (
            <p className="px-1 mb-4 text-xs leading-relaxed text-slate-400">
              Join communities to build your followed feed.
            </p>
          ) : (
            joinedCategories.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.slug}`}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition mb-1 ${
                  activePage === "community" && activeCommunitySlug === c.slug
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                r/{c.slug}
              </Link>
            ))
          )}

          <p className="px-1 mt-4 mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Discover
          </p>

          {discoverCategories.length === 0 ? (
            <p className="px-1 text-xs text-slate-400">You joined every community.</p>
          ) : (
            discoverCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Link
                  href={`/community/${c.slug}`}
                  className="min-w-0 flex-1 text-sm font-semibold text-slate-600 dark:text-slate-400 truncate"
                >
                  r/{c.slug}
                </Link>
                <button
                  onClick={() => handleJoinLeave(c.id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    isJoined(c.id)
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      : "bg-yellow-400 text-slate-900 hover:bg-yellow-500"
                  }`}
                >
                  {isJoined(c.id) ? "Joined" : "Join"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}