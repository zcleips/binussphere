"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Post } from "../../hooks/usePosts";
import { PostCard } from "../../../components/PostCard";
import DarkModeToggle from "../../../components/DarkModeToggle";
import ForumSidebar from "../../../components/ForumSidebar";
import { useNotificationContext } from "../../../context/NotificationContext";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="bg-slate-100 dark:bg-slate-800 w-12 rounded-l-2xl min-h-[160px]" />
        <div className="flex-1 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="flex gap-2 mt-2">
            <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { unreadCount } = useNotificationContext();

  const fetchPost = useCallback(async (id: string, userId: string | null) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, nim, is_verified),
        category:categories!posts_category_id_fkey(id, name, slug, description),
        attachments:post_attachments(storage_path, mime_type, file_size)
      `)
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch user's vote and bookmark state if logged in
    let userVote: 1 | -1 | null = null;
    let userBookmarked = false;

    if (userId) {
      const [{ data: like }, { data: bookmark }] = await Promise.all([
        supabase
          .from("likes")
          .select("direction")
          .eq("user_id", userId)
          .eq("target_type", "post")
          .eq("target_id", id)
          .maybeSingle(),
        supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", userId)
          .eq("post_id", id)
          .maybeSingle(),
      ]);

      if (like) userVote = Number(like.direction) as 1 | -1;
      if (bookmark) userBookmarked = true;
    }

    setPost({ ...data, userVote, userBookmarked } as Post);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const uid = user?.id ?? null;
      setCurrentUserId(uid);
      if (postId) fetchPost(postId, uid);
    });
  }, [postId, fetchPost]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <Link href="/forum">
          <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        </Link>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link
            href="/messages"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center transition"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <Link href="/profile" className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition">
            Profile
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr_300px] gap-6 px-6 py-6">
        {/* Left sidebar */}
        <ForumSidebar activePage="forum" currentUserId={currentUserId} />

        {/* Main content */}
        <section className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          {loading ? (
            <PostSkeleton />
          ) : notFound || !post ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="font-bold text-slate-600 dark:text-slate-400 text-lg mb-2">
                Post tidak ditemukan.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Post ini mungkin sudah dihapus atau tidak tersedia.
              </p>
              <Link
                href="/forum"
                className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition text-sm"
              >
                Kembali ke Forum
              </Link>
            </div>
          ) : (
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onDeleted={() => router.push("/forum")}
              defaultExpanded
            />
          )}
        </section>

        {/* Right sidebar */}
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-extrabold text-base mb-3">Aturan Forum</h3>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {[
                "Hormati sesama Binusian",
                "Posting di community yang tepat",
                "Dilarang spam & promosi",
                "Konten harus relevan",
                "Dilarang plagiarisme",
              ].map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-blue-500 shrink-0">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-extrabold text-base">Campus Marketplace</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Jual & beli barang dengan sesama Binusian terverifikasi.
            </p>
            <Link
              href="/marketplace"
              className="mt-3 inline-flex items-center justify-center w-full rounded-full bg-yellow-400 text-slate-900 font-bold px-5 py-2.5 hover:bg-yellow-500 transition text-sm"
            >
              Explore Marketplace
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}