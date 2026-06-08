"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Bookmark } from "lucide-react";
import DarkModeToggle from "../components/DarkModeToggle";
import { supabase } from "../lib/supabase";
import { Post } from "../forum/hooks/usePosts";
import { useNotificationContext } from "../context/NotificationContext";
import ForumSidebar from "../components/ForumSidebar";
import { PostCard } from "../components/PostCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="bg-slate-100 dark:bg-slate-800 w-12 rounded-l-2xl" />
        <div className="flex-1 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookmarksPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount } = useNotificationContext();

  const fetchBookmarks = useCallback(async (userId: string) => {
    setLoading(true);

    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!bookmarks || bookmarks.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = bookmarks.map((b) => b.post_id);

    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified),
        category:categories!posts_category_id_fkey(id, name, slug, description)
      `)
      .in("id", postIds)
      .eq("is_deleted", false);

    if (!postsData) { setLoading(false); return; }

    const { data: attachments } = await supabase
      .from("post_attachments")
      .select("*")
      .in("post_id", postIds);

    const attachmentMap = new Map<string, any[]>();
    (attachments || []).forEach((a) => {
      if (!attachmentMap.has(a.post_id)) attachmentMap.set(a.post_id, []);
      attachmentMap.get(a.post_id)!.push(a);
    });

    const { data: likes } = await supabase
      .from("likes")
      .select("target_id, direction")
      .eq("user_id", userId)
      .eq("target_type", "post")
      .in("target_id", postIds);

    const voteMap = new Map<string, 1 | -1>(
      (likes || []).map((l) => [l.target_id, Number(l.direction) as 1 | -1])
    );

    const postMap = new Map(postsData.map((p) => [p.id, p]));
    const ordered = postIds
      .map((id) => postMap.get(id))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        userVote: voteMap.get(p.id) ?? null,
        userBookmarked: true,
        attachments: attachmentMap.get(p.id) ?? [],
      }));

    setPosts(ordered as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchBookmarks(user.id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchBookmarks]);

  function handleUnbookmarked(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <Link href="/forum">
          <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        </Link>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link href="/profile" className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition">
            Profile
          </Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <ForumSidebar activePage="bookmarks" currentUserId={currentUserId} />

        {/* Content */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Postingan Tersimpan</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{posts.length} post tersimpan</p>
            </div>
          </div>

          {!currentUserId && !loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="font-bold text-slate-600 dark:text-slate-400 mb-3">Kamu harus login dulu.</p>
              <Link href="/" className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition text-sm">
                Login
              </Link>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada postingan tersimpan.</p>
              <p className="text-sm text-slate-400 mt-1">Klik "Simpan" di postingan manapun untuk menyimpannya di sini.</p>
              <Link href="/forum" className="mt-4 inline-flex rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition text-sm">
                Jelajahi Forum
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onDeleted={() => handleUnbookmarked(post.id)}
                  onUnbookmarked={handleUnbookmarked}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}