"use client";

import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  CheckCircle2,
  Camera,
  Bookmark,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Trash2,
  LogOut,
  Pencil,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePosts, Post } from "../forum/hooks/usePosts";
import { useBookmark } from "../forum/hooks/useVote";
import { useUnreadNotifications } from "../forum/hooks/useUnreadNotifications";
import { useNotificationContext } from "../context/NotificationContext";

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

// ─── Post card (profile view) ─────────────────────────────────────────────────

function ProfilePostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.like_count);
  const [userVote, setUserVote] = useState<1 | -1 | null>(post.userVote ?? null);
  const { bookmarked, toggleBookmark } = useBookmark(post.id, post.userBookmarked ?? false);
  const firstAttachment = post.attachments?.[0];
  const imageUrl = firstAttachment ? getPublicUrl(firstAttachment.storage_path) : null;
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  async function handleVote(direction: 1 | -1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isUnvoting = userVote === direction;
    if (isUnvoting) {
      setLocalLikes((c) => c - direction);
      setUserVote(null);
      await supabase.from("likes").delete()
        .eq("user_id", user.id).eq("target_type", "post").eq("target_id", post.id);
    } else {
      setLocalLikes((c) => c + direction - (userVote ?? 0));
      setUserVote(direction);
      await supabase.from("likes").upsert(
        { user_id: user.id, target_type: "post", target_id: post.id, direction },
        { onConflict: "user_id,target_type,target_id" }
      );
    }
  }

  async function handleDelete() {
    await supabase.from("posts").update({ is_deleted: true }).eq("id", post.id);
    onDeleted();
  }

  return (
    <>
      <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center py-4 px-3 gap-1">
            <button
              onClick={() => handleVote(1)}
              className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === 1 ? "text-blue-500" : "text-slate-400"}`}
            >
              <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <span className={`text-sm font-bold tabular-nums ${userVote === 1 ? "text-blue-500" : userVote === -1 ? "text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
              {localLikes}
            </span>
            <button
              onClick={() => handleVote(-1)}
              className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === -1 ? "text-red-400" : "text-slate-400"}`}
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Link
                href={`/community/${post.category.slug}`}
                className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full hover:bg-blue-200 transition"
              >
                r/{post.category.slug}
              </Link>
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
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition"
              >
                <MessageSquare className="w-4 h-4" />
                {post.comment_count} Komentar
              </button>
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
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-full transition"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
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
          <button className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition" onClick={() => setLightboxImg(null)}>
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

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username);
  const [nim, setNim] = useState(profile.nim ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    if (username.trim().length < 3) { setError("Username minimal 3 karakter."); return; }
    if (username.trim().length > 30) { setError("Username maksimal 30 karakter."); return; }

    setSubmitting(true);
    setError("");

    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const path = `avatars/${profile.id}/${Date.now()}_${avatarFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("attachments").upload(path, avatarFile, { upsert: true });
      if (uploadErr) {
        setError("Gagal upload foto profil: " + uploadErr.message);
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      avatar_url = data.publicUrl;
    }

    const { data, error: updateErr } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        display_name: displayName.trim() || null,
        nim: nim.trim() || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateErr || !data) {
      setError(updateErr?.message || "Gagal menyimpan profil.");
      setSubmitting(false);
      return;
    }

    onSaved(data as Profile);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-extrabold">Edit Profil</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div>
            <label className="font-bold text-sm block mb-2">Foto Profil</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-2xl">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="text-sm font-semibold text-blue-500 hover:underline"
              >
                Ganti foto
              </button>
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setAvatarFile(f);
                if (f) setAvatarPreview(URL.createObjectURL(f));
              }}
            />
          </div>

          {/* Display name */}
          <div>
            <label className="font-bold text-sm block mb-2">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan (opsional)"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Username */}
          <div>
            <label className="font-bold text-sm block mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              maxLength={30}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">{username.length}/30</p>
          </div>

          {/* NIM */}
          <div>
            <label className="font-bold text-sm block mb-2">NIM</label>
            <input
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Nomor Induk Mahasiswa"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-full px-5 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" badge={unreadCount} />
            <MenuItem text="Bookmarks" href="/bookmarks" />
            <MenuItem text="Profile" href="/profile" active />
          </div>
        </aside>

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
                  {profile.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">u/{profile.username}</p>

                {profile.nim && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    NIM: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.nim}</span>
                  </p>
                )}

                <div className="flex gap-5 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{myPosts.length}</span> posts
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{joinedCategories.length}</span> communities
                  </p>
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
                <ProfilePostCard
                  key={`${post.id}-${postRefreshKey}`}
                  post={post}
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