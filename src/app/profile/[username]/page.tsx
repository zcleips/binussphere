"use client";

import DarkModeToggle from "../../components/DarkModeToggle";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Bookmark,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useBookmark } from "../../forum/hooks/useVote";
import { useUnreadNotifications } from "../../forum/hooks/useUnreadNotifications";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  nim: string | null;
  is_verified: boolean;
  created_at: string;
};

type PublicPost = {
  id: string;
  title: string;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  edited_at: string | null;
  category: { name: string; slug: string };
  attachments?: { storage_path: string }[];
  userBookmarked?: boolean;
};

type JoinedCategory = {
  id: string;
  name: string;
  slug: string;
};

type ActivityStat = {
  category_name: string;
  category_slug: string;
  post_count: number;
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

function getPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PublicPostCard({ post }: { post: PublicPost }) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const { bookmarked, toggleBookmark } = useBookmark(post.id, post.userBookmarked ?? false);
  const firstAttachment = post.attachments?.[0];
  const imageUrl = firstAttachment ? getPublicUrl(firstAttachment.storage_path) : null;

  return (
    <>
      <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center py-4 px-3 gap-1 rounded-l-2xl">
            <ChevronUp className="w-5 h-5 text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
            <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
              {post.like_count}
            </span>
            <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Link
                href={`/community/${post.category.slug}`}
                className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition"
              >
                r/{post.category.slug}
              </Link>
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.edited_at && (
                <span className="text-xs text-slate-400 italic">(diedit)</span>
              )}
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
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full">
                <MessageSquare className="w-4 h-4" />
                {post.comment_count} Komentar
              </span>
              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition ${
                  bookmarked
                    ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-yellow-500" : ""}`} />
                {bookmarked ? "Disimpan" : "Simpan"}
              </button>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/forum/post/${post.id}`
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [joinedCategories, setJoinedCategories] = useState<JoinedCategory[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { unreadCount } = useNotificationContext();


  // Get logged-in user so we can redirect to /profile if viewing own page
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const fetchPublicProfile = useCallback(async (uname: string) => {
    setLoading(true);

    // Fetch profile by username
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", uname)
      .single();

    if (!profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Fetch public posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        id, title, content, like_count, comment_count, created_at, edited_at,
        categories(name, slug),
        post_attachments(storage_path)
      `)
      .eq("author_id", profileData.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (postsData) {
      // Fetch current user's bookmarks so the bookmark button reflects correct state
      const { data: { user } } = await supabase.auth.getUser();
      let bookmarkedIds = new Set<string>();
      if (user) {
        const { data: bmarks } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", user.id);
        if (bmarks) bookmarkedIds = new Set(bmarks.map((b: any) => b.post_id));
      }

      const mapped = postsData.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        like_count: p.like_count,
        comment_count: p.comment_count,
        created_at: p.created_at,
        edited_at: p.edited_at,
        category: p.categories,
        attachments: p.post_attachments ?? [],
        userBookmarked: bookmarkedIds.has(p.id),
      }));
      setPosts(mapped);

      // Build activity stats
      const countMap = new Map<string, ActivityStat>();
      postsData.forEach((p: any) => {
        if (!p.categories) return;
        const key = p.categories.slug;
        if (!countMap.has(key)) {
          countMap.set(key, {
            category_name: p.categories.name,
            category_slug: p.categories.slug,
            post_count: 0,
          });
        }
        countMap.get(key)!.post_count++;
      });
      const sorted = Array.from(countMap.values()).sort(
        (a, b) => b.post_count - a.post_count
      );
      setActivityStats(sorted.slice(0, 3));
    }

    // Fetch joined communities
    const { data: memberships } = await supabase
      .from("community_members")
      .select("category_id, categories(id, name, slug)")
      .eq("user_id", profileData.id);

    if (memberships) {
      const cats = memberships
        .map((m: any) => m.categories)
        .filter(Boolean) as JoinedCategory[];
      setJoinedCategories(cats);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (username) fetchPublicProfile(username);
  }, [username, fetchPublicProfile]);

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (profile && currentUserId && profile.id === currentUserId) {
      window.location.href = "/profile";
    }
  }, [profile, currentUserId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat profil...</div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2 font-bold text-lg">
            Profil tidak ditemukan.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            User <strong>u/{username}</strong> tidak ada.
          </p>
          <Link
            href="/forum"
            className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition"
          >
            Kembali ke Forum
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link
            href="/messages"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center transition"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
          <Link
            href="/profile"
            className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition"
          >
            Profile
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr_300px] gap-6 px-6 py-6">
        {/* Left sidebar */}
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" badge={unreadCount} />
            <MenuItem text="Profile" href="/profile" />
          </div>
        </aside>

        {/* Main content */}
        <section className="space-y-5">
          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Banner */}
            <div className="h-36 bg-gradient-to-r from-blue-500 via-blue-400 to-yellow-300" />

            <div className="px-6 pb-6">
              <div className="flex justify-between items-end -mt-14">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-900"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-yellow-100 dark:bg-yellow-900 border-4 border-white dark:border-slate-900 flex items-center justify-center font-extrabold text-yellow-600 dark:text-yellow-400 text-4xl">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">
                  u/{profile.username}
                </p>

                {profile.nim && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    NIM:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {profile.nim}
                    </span>
                  </p>
                )}

                <div className="flex gap-5 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {posts.length}
                    </span>{" "}
                    posts
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {joinedCategories.length}
                    </span>{" "}
                    communities
                  </p>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Bergabung{" "}
                  {new Date(profile.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Posts */}
          <h2 className="font-extrabold text-xl px-1 text-slate-900 dark:text-slate-100">
            Postingan dari u/{profile.username}
          </h2>

          {posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="font-bold text-slate-600 dark:text-slate-400">
                Belum ada postingan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PublicPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="sticky top-24 h-fit space-y-4">
          {profile.is_verified && (
            <div className="bg-blue-500 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="font-extrabold text-lg">Binusian Terverifikasi</h2>
              </div>
              <p className="mt-2 text-white/80 text-sm">
                Akun mahasiswa BINUS yang sudah diverifikasi.
              </p>
            </div>
          )}

          {/* Communities */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-extrabold text-base mb-3">Communities</h3>
            {joinedCategories.length === 0 ? (
              <p className="text-sm text-slate-400">
                Belum join community apapun.
              </p>
            ) : (
              <div className="space-y-1">
                {joinedCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/community/${c.slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-extrabold text-blue-500">
                      {c.name[0].toUpperCase()}
                    </div>
                    r/{c.slug}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Most active in */}
          {activityStats.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-extrabold text-base mb-3">Paling Aktif Di</h3>
              <div className="space-y-3">
                {activityStats.map((stat, i) => (
                  <Link
                    key={stat.category_slug}
                    href={`/community/${stat.category_slug}`}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold text-white ${
                          i === 0
                            ? "bg-yellow-400"
                            : i === 1
                            ? "bg-slate-400"
                            : "bg-amber-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition">
                        r/{stat.category_slug}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {stat.post_count} posts
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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