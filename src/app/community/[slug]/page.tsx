"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ImageIcon,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import DarkModeToggle from "../../components/DarkModeToggle";
import SearchBar from "../../components/SearchBar";
import { supabase } from "../../lib/supabase";
import {
  Post,
  SortOption,
  useCategory,
  useCommunityMembership,
  usePosts,
} from "../../forum/hooks/usePosts";
import { useBookmark, useVote } from "../../forum/hooks/useVote";
import { useNotificationContext } from "../../context/NotificationContext";
import { notifyMentions } from "../../forum/hooks/notificationUtils";

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

function CommunityPostCard({
  post,
  currentUserId,
  searchKeyword,
  onDeleted,
}: {
  post: Post;
  currentUserId: string | null;
  searchKeyword: string;
  onDeleted: () => void;
}) {
  const { likeCount, userVote, vote } = useVote(post.id, "post", post.like_count, post.userVote ?? null);
  const { bookmarked, toggleBookmark } = useBookmark(post.id, post.userBookmarked);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const firstAttachment = post.attachments?.[0];
  const imageUrl = firstAttachment ? getPublicUrl(firstAttachment.storage_path) : null;

  function highlight(text: string) {
    if (!searchKeyword.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${searchKeyword})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === searchKeyword.toLowerCase() ? (
            <strong key={index} className="font-extrabold text-blue-500">{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  }

  async function handleDeletePost() {
    await supabase.from("posts").update({ is_deleted: true }).eq("id", post.id);
    onDeleted();
  }

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex">
          <div className="flex min-w-[52px] flex-col items-center gap-1 bg-slate-50 px-3 py-4 dark:bg-slate-800/50">
            <button
              onClick={() => vote(1)}
              className={`rounded p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === 1 ? "text-blue-500" : "text-slate-400"}`}
              aria-label="Upvote"
            >
              <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <span className={`text-sm font-bold tabular-nums ${userVote === 1 ? "text-blue-500" : userVote === -1 ? "text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
              {likeCount}
            </span>
            <button
              onClick={() => vote(-1)}
              className={`rounded p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${userVote === -1 ? "text-red-400" : "text-slate-400"}`}
              aria-label="Downvote"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="min-w-0 flex-1 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-500">r/{post.category.slug}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                dipost oleh{" "}
                <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">
                  u/{post.author.username}
                </Link>
              </span>
              {post.author.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.edited_at && <span className="text-xs text-slate-400 italic">(diedit)</span>}
            </div>

            <h2 className="mb-1 text-base font-bold leading-snug text-slate-900 dark:text-slate-100">
              {highlight(post.title)}
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {highlight(post.content)}
            </p>

            {imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="Post attachment"
                  className="max-h-80 w-full cursor-zoom-in rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                  onClick={() => setLightboxImg(imageUrl)}
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1">
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count} Komentar
              </span>
              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  bookmarked
                    ? "bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-yellow-500" : ""}`} />
                {bookmarked ? "Disimpan" : "Simpan"}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/${post.category.slug}`)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Share2 className="h-4 w-4" />
                Bagikan
              </button>
              {currentUserId === post.author_id && (
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
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

function PostSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex">
        <div className="w-12 bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 space-y-3 p-4">
          <div className="h-5 w-36 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
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
      className={`flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition ${
        active
          ? "bg-blue-500 text-white"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span>{text}</span>
      {badge > 0 && (
        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
          active ? "bg-white/30 text-white" : "bg-blue-500 text-white"
        }`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function CommunityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const { unreadCount } = useNotificationContext();
  const { category, memberCount, loading: categoryLoading, refetch: refetchCategory } = useCategory(slug);
  const { joinedCategoryIds, loading: membershipLoading, join, leave, isJoined } = useCommunityMembership(currentUserId);
  const { posts, loading: postsLoading, error, refetch } = usePosts(slug, sort, searchKeyword);

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

  async function toggleMembership() {
    if (!category) return;
    if (!currentUserId) { window.location.href = "/"; return; }
    if (isJoined(category.id)) {
      await leave(category.id);
    } else {
      await join(category.id);
    }
    refetchCategory();
  }

  async function submitPost() {
    if (!category || !currentUserId || submitting) return;

    if (title.trim().length < 5 || content.trim().length < 10) {
      setComposerError("Judul minimal 5 karakter dan konten minimal 10 karakter.");
      return;
    }
    if (file && !ALLOWED_TYPES.includes(file.type)) {
      setComposerError("Format file tidak didukung (JPEG, PNG, GIF, WEBP).");
      return;
    }

    setSubmitting(true);
    setComposerError("");

    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: currentUserId,
        category_id: category.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError || !post) {
      setComposerError(insertError?.message || "Gagal membuat post.");
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

    await notifyMentions(
      `${title.trim()} ${content.trim()}`,
      "post",
      post.id,
      currentUserId
    );

    setTitle("");
    setContent("");
    setFile(null);
    setSubmitting(false);
    refetch();
  }

  const joined = category ? isJoined(category.id) : false;
  const loading = categoryLoading || membershipLoading;

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <Link href="/forum">
          <img src="/logo.png" alt="Binusphere" className="w-[170px]" />
        </Link>
        <SearchBar posts={[]} onSearch={setSearchKeyword} />
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link
            href="/messages"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-100 hover:text-blue-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <MessageSquare className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="rounded-full bg-blue-500 px-5 py-2 font-bold text-white transition hover:bg-blue-600">
            Profile
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl grid-cols-[240px_1fr_300px] gap-6 px-6 py-6">
        <aside className="sticky top-24 h-fit">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" active />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" badge={unreadCount} />
            <MenuItem text="Profile" href="/profile" />
          </div>
        </aside>

        <section className="space-y-4">
          {loading ? (
            <div className="h-56 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
          ) : !category ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h1 className="font-extrabold text-slate-700 dark:text-slate-200">Community not found</h1>
              <Link href="/forum" className="mt-3 inline-flex rounded-full bg-blue-500 px-5 py-2 font-bold text-white">
                Back to forum
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="h-28 bg-blue-500" />
                <div className="px-6 pb-6">
                  <div className="-mt-10 flex items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-yellow-400 text-4xl font-extrabold text-slate-900 dark:border-slate-900">
                        {category.name[0]?.toUpperCase()}
                      </div>
                      <div className="pb-2">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{category.name}</h1>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">r/{category.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMembership}
                      className={`mb-2 rounded-full px-6 py-2 font-bold transition ${
                        joined
                          ? "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {joined ? "Joined" : "Join"}
                    </button>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {category.description || "A BINUSPHERE community for focused discussions and campus updates."}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <Users className="h-4 w-4 text-blue-500" />
                    {memberCount + (joined && !joinedCategoryIds.includes(category.id) ? 1 : 0)} members
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
                    {category.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`Post title for r/${category.slug}`}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share something with this community..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />

                    <div>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-500 transition dark:text-slate-400"
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
                    </div>

                    {composerError && <p className="text-sm font-semibold text-red-500">{composerError}</p>}

                    <div className="flex justify-end">
                      <button
                        onClick={submitPost}
                        disabled={!currentUserId || submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 font-extrabold text-slate-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        {submitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setSort("newest")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                    sort === "newest" ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <Clock className="h-4 w-4" /> Terbaru
                </button>
                <button
                  onClick={() => setSort("popular")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                    sort === "popular" ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" /> Terpopuler
                </button>
              </div>

              <div className="space-y-3">
                {postsLoading ? (
                  [1, 2, 3].map((item) => <PostSkeleton key={item} />)
                ) : error ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="mb-2 text-slate-500">Gagal memuat posts.</p>
                    <button onClick={refetch} className="font-bold text-blue-500 hover:underline">Coba lagi</button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                    <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="font-bold text-slate-600 dark:text-slate-400">
                      {searchKeyword ? "Tidak ada hasil" : "Belum ada post di community ini"}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <CommunityPostCard
                      key={`${post.id}-${currentUserId ?? "guest"}`}
                      post={post}
                      currentUserId={currentUserId}
                      searchKeyword={searchKeyword}
                      onDeleted={refetch}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <aside className="sticky top-24 h-fit space-y-4">
          <div className="rounded-3xl bg-blue-500 p-5 text-white">
            <h2 className="text-lg font-extrabold">About Community</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Dedicated space for focused BINUSPHERE discussions.
            </p>
            <Link
              href="/forum"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-500"
            >
              Back to Forum
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}