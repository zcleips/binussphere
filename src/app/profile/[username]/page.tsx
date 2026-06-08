"use client";

import DarkModeToggle from "../../components/DarkModeToggle";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNotificationContext } from "../../context/NotificationContext";
import ForumSidebar from "../../components/ForumSidebar";
import { PostCard } from "../../components/PostCard";
import { Post } from "../../forum/hooks/usePosts";
import NimBadge from "@/app/components/NimBadge";

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  // Store as Post[] so we can pass directly to PostCard
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinedCategories, setJoinedCategories] = useState<JoinedCategory[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { unreadCount } = useNotificationContext();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const fetchPublicProfile = useCallback(async (uname: string) => {
    setLoading(true);

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
        author_id,
        categories(id, name, slug),
        post_attachments(storage_path, mime_type, file_size)
      `)
      .eq("author_id", profileData.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (postsData) {
      // Fetch current user's bookmarks and votes
      const { data: { user } } = await supabase.auth.getUser();
      let bookmarkedIds = new Set<string>();
      let voteMap = new Map<string, 1 | -1>();

      if (user) {
        const [{ data: bmarks }, { data: likes }] = await Promise.all([
          supabase.from("bookmarks").select("post_id").eq("user_id", user.id),
          supabase
            .from("likes")
            .select("target_id, direction")
            .eq("user_id", user.id)
            .eq("target_type", "post")
            .in("target_id", postsData.map((p: any) => p.id)),
        ]);
        if (bmarks) bookmarkedIds = new Set(bmarks.map((b: any) => b.post_id));
        if (likes) voteMap = new Map(likes.map((l: any) => [l.target_id, Number(l.direction) as 1 | -1]));
      }

      // Map raw Supabase rows → Post shape so PostCard works without changes
      const mapped: Post[] = postsData.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        like_count: p.like_count,
        comment_count: p.comment_count,
        created_at: p.created_at,
        updated_at: p.updated_at ?? p.created_at,
        edited_at: p.edited_at ?? null,
        author_id: p.author_id,
        category_id: p.categories?.id ?? "",
        is_deleted: false,
        // PostCard only needs these fields from author; we already have the full profile
        author: {
          id: profileData.id,
          username: profileData.username,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          nim: profileData.nim,
          is_verified: profileData.is_verified,
        },
        category: {
          id: p.categories?.id ?? "",
          name: p.categories?.name ?? "",
          slug: p.categories?.slug ?? "",
          description: null,
        },
        attachments: p.post_attachments ?? [],
        userVote: voteMap.get(p.id) ?? null,
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
      const sorted = Array.from(countMap.values()).sort((a, b) => b.post_count - a.post_count);
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

  // Redirect to /profile if viewing own page
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
          <Link href="/forum" className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition">
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
          <Link href="/profile" className="rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition">
            Profile
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr_300px] gap-6 px-6 py-6">
        {/* Left sidebar */}
        <ForumSidebar activePage="profile" currentUserId={currentUserId} />

        {/* Main content */}
        <section className="space-y-5">
          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                  {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">u/{profile.username}</p>

                {profile.nim && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    NIM: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.nim}</span>
                  </p>
                )}

                <div className="flex gap-5 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p><span className="font-bold text-slate-900 dark:text-slate-100">{posts.length}</span> posts</p>
                  <p><span className="font-bold text-slate-900 dark:text-slate-100">{joinedCategories.length}</span> communities</p>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Bergabung {new Date(profile.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
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
              <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada postingan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  // onDeleted is required by PostCard but won't be triggered here
                  // since currentUserId !== post.author_id (own-profile redirect handles that)
                  onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
                />
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
              <p className="mt-2 text-white/80 text-sm">Akun mahasiswa BINUS yang sudah diverifikasi.</p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-extrabold text-base mb-3">Communities</h3>
            {joinedCategories.length === 0 ? (
              <p className="text-sm text-slate-400">Belum join community apapun.</p>
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
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold text-white ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : "bg-amber-600"}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition">
                        r/{stat.category_slug}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{stat.post_count} posts</span>
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