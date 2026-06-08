"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  Search,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  usePosts,
  useCategories,
  useCommunityMembership,
} from "./hooks/usePosts";
import { useCategories as useCategoriesAlias } from "./hooks/usePosts";
import { notifyMentions } from "./hooks/notificationUtils";
import SearchBar from "../components/SearchBar";
import DarkModeToggle from "../components/DarkModeToggle";
import { useNotificationContext } from "../context/NotificationContext";
import ForumSidebar from "../components/ForumSidebar";
import { PostCard, MentionInput } from "../components/PostCard";
import { X, ImageIcon } from "lucide-react";

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { categories } = useCategories();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Judul tidak boleh kosong";
    else if (title.trim().length < 5) e.title = "Judul minimal 5 karakter";
    else if (title.length > 300) e.title = "Judul terlalu panjang (maks 300)";
    if (!content.trim()) e.content = "Konten tidak boleh kosong";
    else if (content.trim().length < 10) e.content = "Konten minimal 10 karakter";
    if (!categoryId) e.category = "Kategori harus dipilih";
    if (file && !ALLOWED_TYPES.includes(file.type)) e.file = "Format tidak didukung (JPEG, PNG, GIF, WEBP)";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErrors({ general: "Kamu harus login dulu" }); setSubmitting(false); return; }

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({ author_id: user.id, category_id: categoryId, title: title.trim(), content: content.trim() })
      .select()
      .single();

    if (postError || !post) {
      setErrors({ general: postError?.message || "Gagal membuat post" });
      setSubmitting(false);
      return;
    }

    if (file) {
      const path = `posts/${post.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
      if (!uploadError) {
        await supabase.from("post_attachments").insert({
          post_id: post.id,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
        });
      }
    }

    await notifyMentions(`${title.trim()} ${content.trim()}`, "post", post.id, user.id);

    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-extrabold">Buat Post Baru</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errors.general && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-2">{errors.general}</p>
          )}

          <div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100"
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1 ml-1">{errors.category}</p>}
          </div>

          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul post (minimal 5 karakter)"
              maxLength={300}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <div className="flex justify-between mt-1">
              {errors.title ? <p className="text-xs text-red-500 ml-1">{errors.title}</p> : <span />}
              <span className="text-xs text-slate-400">{title.length}/300</span>
            </div>
          </div>

          <div>
            <MentionInput
              value={content}
              onChange={setContent}
              placeholder="Isi konten post — ketik @ untuk mention seseorang"
              multiline
              rows={5}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
            />
            {errors.content && <p className="text-xs text-red-500 mt-1 ml-1">{errors.content}</p>}
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition"
            >
              <ImageIcon className="w-4 h-4" />
              {file ? file.name : "Lampirkan gambar (opsional)"}
            </button>
            {file && (
              <div className="mt-2 relative inline-block">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="max-h-40 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <button
                  onClick={() => setFile(null)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-full px-5 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {submitting ? "Memposting..." : "Publikasikan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

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

export default function ForumPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [feedView, setFeedView] = useState<"followed" | "explore">("explore");
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [, setRefreshKey] = useState(0);
  const autoSelectedFeed = useRef(false);
  const { unreadCount } = useNotificationContext();

  const { categories } = useCategories();
  const {
    joinedCategoryIds,
    loading: membershipsLoading,
    join,
    leave,
    isJoined,
  } = useCommunityMembership(currentUserId);
  const followedFeedIds = feedView === "followed" ? joinedCategoryIds : undefined;
  const { posts, loading, error, refetch } = usePosts(undefined, sort, searchKeyword, followedFeedIds);
  const joinedCategories = useMemo(
    () => categories.filter((c) => joinedCategoryIds.includes(c.id)),
    [categories, joinedCategoryIds]
  );
  const discoverCategories = useMemo(
    () => categories.filter((c) => !joinedCategoryIds.includes(c.id)),
    [categories, joinedCategoryIds]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
      refetch();
    });

    return () => subscription.unsubscribe();
  }, [refetch]);

  useEffect(() => {
    autoSelectedFeed.current = false;
  }, [currentUserId]);

  useEffect(() => {
    if (membershipsLoading || autoSelectedFeed.current) return;
    autoSelectedFeed.current = true;
    setFeedView(currentUserId && joinedCategoryIds.length > 0 ? "followed" : "explore");
  }, [currentUserId, joinedCategoryIds.length, membershipsLoading]);

  function handlePostCreated() {
    setRefreshKey((k) => k + 1);
    refetch();
  }

  const hasPosts = posts.length > 0;

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        <SearchBar posts={[]} onSearch={setSearchKeyword} />
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
        <ForumSidebar
          activePage="forum"
          currentUserId={currentUserId}
          onCreatePost={() => setShowCreate(true)}
          showCommunities
          feedView={feedView}
          onFeedViewChange={setFeedView}
        />

        {/* Feed */}
        <section>
          {/* Sort bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-2 mb-4">
            <button
              onClick={() => setSort("newest")}
              className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full transition ${
                sort === "newest" ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="w-4 h-4" /> Terbaru
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full transition ${
                sort === "popular" ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Terpopuler
            </button>

            <span className="ml-auto text-sm font-semibold text-slate-500">
              {feedView === "followed" ? "Followed feed" : "Explore feed"}
            </span>

            {searchKeyword && (
              <span className="text-sm text-slate-500">
                Hasil untuk: <strong className="text-blue-500">{searchKeyword}</strong>
              </span>
            )}
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {loading || membershipsLoading ? (
              [1, 2, 3].map((i) => <PostSkeleton key={i} />)
            ) : error ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <p className="text-slate-500 mb-2">Gagal memuat posts.</p>
                <button onClick={refetch} className="text-blue-500 font-bold hover:underline">Coba lagi</button>
              </div>
            ) : !hasPosts && !loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-400">
                  {searchKeyword ? "Tidak ada hasil" : feedView === "followed" ? "Followed feed masih kosong" : "Belum ada post"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchKeyword
                    ? `Tidak ditemukan post dengan "${searchKeyword}"`
                    : feedView === "followed"
                    ? "Join community lain atau buka Explore untuk menemukan diskusi baru."
                    : "Jadilah yang pertama posting!"}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={`${post.id}-${currentUserId ?? "guest"}`}
                  post={post}
                  currentUserId={currentUserId}
                  searchKeyword={searchKeyword}
                  onDeleted={refetch}
                />
              ))
            )}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-blue-500 rounded-3xl p-5 text-white">
            <h2 className="font-extrabold text-lg">Binusphere Forum</h2>
            <p className="mt-2 text-white/80 text-sm leading-relaxed">
              Forum diskusi resmi untuk mahasiswa BINUS. Join communities, share, diskusi, dan bantu satu sama lain!
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/20 rounded-2xl py-2">
                <p className="font-extrabold text-lg">{posts.length}+</p>
                <p className="text-xs text-white/70">Posts</p>
              </div>
              <div className="bg-white/20 rounded-2xl py-2">
                <p className="font-extrabold text-lg">{categories.length}</p>
                <p className="text-xs text-white/70">Communities</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!currentUserId) { window.location.href = "/"; return; }
                setShowCreate(true);
              }}
              className="mt-4 w-full rounded-full bg-yellow-400 text-slate-900 font-bold py-2.5 hover:bg-yellow-500 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Buat Post
            </button>
          </div>

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

          {/* <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
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
          </div> */}
        </aside>
      </section>

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onSuccess={handlePostCreated} />
      )}
    </main>
  );
}