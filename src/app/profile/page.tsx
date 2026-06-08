"use client";

import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  CheckCircle2,
  Bookmark,
  LogOut,
  Pencil,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePosts } from "../forum/hooks/usePosts";
import { useNotificationContext } from "../context/NotificationContext";
import ForumSidebar from "../components/ForumSidebar";
import EditProfileModal from "../components/EditProfileModal";
import { PostCard } from "../components/PostCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  nim: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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

export default function ProfilePage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [joinedCategories, setJoinedCategories] = useState<JoinedCategory[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [postRefreshKey, setPostRefreshKey] = useState(0);
  const { unreadCount } = useNotificationContext();

  const { posts, loading: postsLoading, refetch: refetchPosts } = usePosts(
    undefined,
    "newest",
    undefined,
    undefined
  );

  const myPosts = posts.filter((p) => p.author_id === currentUserId);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setProfile(data as Profile);

    const { data: memberships } = await supabase
      .from("community_members")
      .select("category_id, categories(id, name, slug)")
      .eq("user_id", userId);

    if (memberships) {
      const cats = memberships
        .map((m: any) => m.categories)
        .filter(Boolean) as JoinedCategory[];
      setJoinedCategories(cats);
    }

    const { data: userPosts } = await supabase
      .from("posts")
      .select("category_id, categories(name, slug)")
      .eq("author_id", userId)
      .eq("is_deleted", false);

    if (userPosts) {
      const countMap = new Map<string, ActivityStat>();
      userPosts.forEach((p: any) => {
        if (!p.categories) return;
        const key = p.category_id;
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

    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchProfile(user.id);
      } else {
        setProfileLoading(false);
      }
    });
  }, [fetchProfile]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function handleProfileSaved(updated: Profile) {
    setProfile(updated);
    if (currentUserId) fetchProfile(currentUserId);
  }

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat profil...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Kamu belum login.</p>
          <Link href="/" className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition">
            Login
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

                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 rounded-full border border-blue-500 text-blue-500 font-bold px-5 py-2 hover:bg-blue-50 dark:hover:bg-white/5 transition"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profil
                </button>
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
                  <p><span className="font-bold text-slate-900 dark:text-slate-100">{myPosts.length}</span> posts</p>
                  <p><span className="font-bold text-slate-900 dark:text-slate-100">{joinedCategories.length}</span> communities</p>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Bergabung {new Date(profile.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                </p>
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-xl px-1 text-slate-900 dark:text-slate-100">
            Postingan Saya
          </h2>

          {postsLoading ? (
            <div className="text-sm text-slate-400 px-1">Memuat postingan...</div>
          ) : myPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada postingan.</p>
              <Link href="/forum" className="mt-3 inline-flex rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition text-sm">
                Buat post pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myPosts.map((post) => (
                <PostCard
                  key={`${post.id}-${postRefreshKey}`}
                  post={post}
                  currentUserId={currentUserId}
                  onDeleted={() => { setPostRefreshKey((k) => k + 1); refetchPosts(); }}
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

          <Link
            href="/bookmarks"
            className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition">Postingan Tersimpan</p>
              <p className="text-xs text-slate-400">Lihat semua bookmark kamu</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-3xl border border-red-200 dark:border-red-900/50 text-red-500 font-bold px-5 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </aside>
      </section>

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </main>
  );
}