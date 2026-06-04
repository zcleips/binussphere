"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Share2,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import DarkModeToggle from "../components/DarkModeToggle";
import { supabase } from "../lib/supabase";
import { Post } from "../forum/hooks/usePosts";
import { useVote, useBookmark } from "../forum/hooks/useVote";
import { useNotificationContext } from "../context/NotificationContext";

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

function getPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Bookmarked Post Card ─────────────────────────────────────────────────────

function BookmarkedPostCard({
  post,
  currentUserId,
  onUnbookmarked,
}: {
  post: Post;
  currentUserId: string | null;
  onUnbookmarked: (postId: string) => void;
}) {
  const { likeCount, userVote, vote } = useVote(post.id, "post", post.like_count, post.userVote ?? null);
  const { bookmarked, toggleBookmark } = useBookmark(post.id, true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const firstAttachment = post.attachments?.[0];
  const imageUrl = firstAttachment ? getPublicUrl(firstAttachment.storage_path) : null;

  async function handleToggleBookmark() {
    await toggleBookmark();
    onUnbookmarked(post.id);
  }

  return (
    <>
      <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center py-4 px-3 gap-1 rounded-l-2xl">
            <button
              onClick={() => vote(1)}
              className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === 1 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}
              aria-label="Upvote"
            >
              <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <span className={`text-sm font-bold tabular-nums ${userVote === 1 ? "text-blue-500" : userVote === -1 ? "text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
              {likeCount}
            </span>
            <button
              onClick={() => vote(-1)}
              className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === -1 ? "text-red-400" : "text-slate-400 dark:text-slate-500"}`}
              aria-label="Downvote"
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Link
                href={`/community/${post.category.slug}`}
                className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition"
              >
                r/{post.category.slug}
              </Link>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                dipost oleh{" "}
                <Link href={`/profile/${post.author.username}`} className="hover:underline font-semibold">
                  u/{post.author.username}
                </Link>
              </span>
              {post.author.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.edited_at && <span className="text-xs text-slate-400 italic">(diedit)</span>}
            </div>

            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug mb-1">
              {post.title}
            </h2>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
              {post.content}
            </p>

            {imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="Post attachment"
                  className="max-h-60 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-zoom-in"
                  onClick={() => setLightboxImg(imageUrl)}
                />
              </div>
            )}

            <div className="flex items-center gap-1 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5">
                <MessageSquare className="w-4 h-4" />
                {post.comment_count} Komentar
              </span>

              <button
                onClick={handleToggleBookmark}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
              >
                <Bookmark className="w-4 h-4 fill-yellow-500" />
                Hapus Bookmark
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>

              {currentUserId === post.author_id && (
                <button
                  onClick={async () => {
                    await supabase.from("posts").update({ is_deleted: true }).eq("id", post.id);
                    onUnbookmarked(post.id);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-full transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition"
            onClick={() => setLightboxImg(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImg}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

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
        <aside className="sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" badge={unreadCount} />
            <MenuItem text="Bookmarks" href="/bookmarks" active />
            <MenuItem text="Profile" href="/profile" />
          </div>
        </aside>

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
                <BookmarkedPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
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