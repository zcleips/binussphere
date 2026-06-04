"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  Trash2,
  Plus,
  X,
  TrendingUp,
  Clock,
  Search,
  CheckCircle2,
  CornerDownRight,
  ImageIcon,
  AtSign,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  usePosts,
  useComments,
  useCategories,
  useCommunityMembership,
  Post,
  Comment,
} from "./hooks/usePosts";
import { useVote, useBookmark } from "./hooks/useVote";
import { notifyComment, notifyReply, notifyMentions } from "./hooks/notificationUtils";
import { useUnreadNotifications } from "../forum/hooks/useUnreadNotifications";
import SearchBar from "../components/SearchBar";
import DarkModeToggle from "../components/DarkModeToggle";
import { useNotificationContext } from "../context/NotificationContext";

// ─── helpers ────────────────────────────────────────────────────────────────

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

function Avatar({ author, size = 8 }: { author: { username: string; avatar_url: string | null }; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover`;
  if (author.avatar_url)
    return <img src={author.avatar_url} alt={author.username} className={cls} />;
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-sm`}
    >
      {author.username[0].toUpperCase()}
    </div>
  );
}

// ─── renderWithMentions ───────────────────────────────────────────────────────
// Parses @username tokens in text and renders them as highlighted links.

function renderWithMentions(text: string) {
  // Split on @username tokens (letters, digits, underscores, dots)
  const parts = text.split(/(@[\w.]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^@[\w.]+$/.test(part)) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              href={`/profile/${username}`}
              className="text-blue-500 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── MentionInput ─────────────────────────────────────────────────────────────
// A drop-in replacement for <input> / <textarea> that shows an @mention
// autocomplete dropdown as the user types.
//
// Props mirror a standard input/textarea, plus:
//   multiline  – render a <textarea> instead of <input>
//   rows       – passed to textarea

type MentionProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

type MentionInputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
};

function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  multiline = false,
  rows = 5,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionProfile[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // mentionStart: index of the '@' character currently being completed
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search Supabase profiles for matching usernames
  const searchProfiles = useCallback(async (query: string) => {
    if (!query) { setSuggestions([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .ilike("username", `${query}%`)
      .limit(6);
    setSuggestions((data as MentionProfile[]) ?? []);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart ?? newValue.length;
    onChange(newValue);

    // Detect active @mention token before cursor
    // Walk left from cursor to find '@' not preceded by \w (i.e. a fresh trigger)
    const textBeforeCursor = newValue.slice(0, cursor);
    const match = textBeforeCursor.match(/@([\w.]*)$/);

    if (match) {
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setMentionStart(atIndex);
      setShowDropdown(true);
      setActiveIndex(0);
      // Debounce the search
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchProfiles(match[1]), 150);
    } else {
      setShowDropdown(false);
      setMentionStart(null);
      setSuggestions([]);
    }
  }

  function insertMention(username: string) {
    if (mentionStart === null) return;
    // Find the end of the current token
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const tokenEnd = cursor;
    const before = value.slice(0, mentionStart);
    const after = value.slice(tokenEnd);
    const newValue = `${before}@${username} ${after}`;
    onChange(newValue);
    setShowDropdown(false);
    setSuggestions([]);
    setMentionStart(null);
    // Re-focus and place cursor after inserted mention
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const newCursor = before.length + username.length + 2; // '@' + username + ' '
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[activeIndex].username);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }
    onKeyDown?.(e);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sharedProps = {
    ref: inputRef as any,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className,
  };

  return (
    <div className="relative flex-1">
      {multiline ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input {...sharedProps} type="text" />
      )}

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 bottom-full mb-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mention seseorang</span>
          </div>
          {suggestions.map((profile, idx) => (
            <button
              key={profile.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(profile.username); }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                idx === activeIndex
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-xs shrink-0">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {profile.display_name || profile.username}
                  </span>
                  {profile.is_verified && (
                    <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-400 truncate block">@{profile.username}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vote column ─────────────────────────────────────────────────────────────

function VoteColumn({
  targetId,
  targetType,
  likeCount,
  userVote,
  vertical = true,
}: {
  targetId: string;
  targetType: "post" | "comment";
  likeCount: number;
  userVote: 1 | -1 | null;
  vertical?: boolean;
}) {
  const { likeCount: count, userVote: vote, vote: castVote } = useVote(
    targetId,
    targetType,
    likeCount,
    userVote
  );

  const base = vertical
    ? "flex flex-col items-center gap-1 min-w-[40px]"
    : "flex items-center gap-1";

  return (
    <div className={base}>
      <button
        onClick={() => castVote(1)}
        className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
          vote === 1 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"
        }`}
        aria-label="Upvote"
      >
        <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
      </button>
      <span
        className={`text-sm font-bold tabular-nums ${
          vote === 1
            ? "text-blue-500"
            : vote === -1
            ? "text-red-400"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {count}
      </span>
      <button
        onClick={() => castVote(-1)}
        className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
          vote === -1 ? "text-red-400" : "text-slate-400 dark:text-slate-500"
        }`}
        aria-label="Downvote"
      >
        <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

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
    await notifyMentions(
      `${title.trim()} ${content.trim()}`,
      "post",
      post.id,
      user.id
    );

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

          {/* ↓ MentionInput replaces plain <textarea> for content */}
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

// ─── Comment Tree ─────────────────────────────────────────────────────────────

function CommentNode({
  comment,
  currentUserId,
  depth = 0,
  onReplyAdded,
}: {
  comment: Comment;
  currentUserId: string | null;
  depth?: number;
  onReplyAdded: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { likeCount, userVote, vote } = useVote(comment.id, "comment", comment.like_count, comment.userVote ?? null);

  async function submitReply() {
    if (!replyText.trim() || !currentUserId) return;
    setSubmitting(true);
  
    const { data: inserted } = await supabase
      .from("comments")
      .insert({
        post_id: comment.post_id,
        author_id: currentUserId,
        parent_id: comment.id,
        content: replyText.trim(),
      })
      .select("id")
      .single();
  
    await notifyReply(comment.id, comment.author_id, currentUserId);
  
    if (inserted) {
      await notifyMentions(replyText.trim(), "comment", inserted.id, currentUserId);
    }
  
    setReplyText("");
    setShowReply(false);
    setSubmitting(false);
    onReplyAdded();
  }

  async function deleteComment() {
    await supabase.from("comments").update({ is_deleted: true }).eq("id", comment.id);
    onReplyAdded();
  }

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4" : ""}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <Avatar author={comment.author} size={6} />
          <Link href={`/profile/${comment.author.username}`} className="font-bold text-sm hover:underline">
            {comment.author.display_name || comment.author.username}
          </Link>
          {comment.author.is_verified && (
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
          {comment.edited_at && <span className="text-xs text-slate-400 italic">(diedit)</span>}
        </div>

        {/* ↓ renderWithMentions highlights @username tokens */}
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed ml-8">
          {renderWithMentions(comment.content)}
        </p>

        <div className="flex items-center gap-4 mt-2 ml-8">
          <div className="flex items-center gap-1">
            <button
              onClick={() => vote(1)}
              className={`p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${userVote === 1 ? "text-blue-500" : "text-slate-400"}`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{likeCount}</span>
            <button
              onClick={() => vote(-1)}
              className={`p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${userVote === -1 ? "text-red-400" : "text-slate-400"}`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {currentUserId && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-500 transition"
            >
              <CornerDownRight className="w-3.5 h-3.5" /> Reply
            </button>
          )}

          {currentUserId === comment.author_id && (
            <button
              onClick={deleteComment}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          )}
        </div>

        {/* ↓ MentionInput replaces plain <input> in reply box */}
        {showReply && (
          <div className="mt-3 ml-8 flex gap-2">
            <MentionInput
              value={replyText}
              onChange={setReplyText}
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
              placeholder="Tulis balasan... ketik @ untuk mention"
              className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 w-full"
            />
            <button
              onClick={submitReply}
              disabled={submitting}
              className="rounded-full bg-blue-500 text-white font-bold px-4 py-2 text-sm hover:bg-blue-600 transition disabled:opacity-50"
            >
              Kirim
            </button>
          </div>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentNode
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          depth={depth + 1}
          onReplyAdded={onReplyAdded}
        />
      ))}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
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
  const [expanded, setExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const { bookmarked, toggleBookmark } = useBookmark(post.id, post.userBookmarked);
  const { comments, loading: commentsLoading } = useComments(expanded ? post.id : "");
  const [newComment, setNewComment] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  function highlight(text: string) {
    if (!searchKeyword.trim()) return <>{renderWithMentions(text)}</>;
    const parts = text.split(new RegExp(`(${searchKeyword})`, "gi"));
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === searchKeyword.toLowerCase() ? (
            <strong key={i} className="font-extrabold text-blue-500">{p}</strong>
          ) : (
            // Still render @mentions within non-highlighted segments
            <span key={i}>{renderWithMentions(p)}</span>
          )
        )}
      </>
    );
  }

  async function handleDeletePost() {
    await supabase.from("posts").update({ is_deleted: true }).eq("id", post.id);
    onDeleted();
  }

  async function handleReport() {
    setShowReport(false);
    setReportDone(true);
    setTimeout(() => setReportDone(false), 2500);
  }

  async function submitComment() {
    if (!newComment.trim() || !currentUserId) return;
  
    const { data: inserted } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        author_id: currentUserId,
        content: newComment.trim(),
      })
      .select("id")
      .single();
  
    await notifyComment(post.id, post.author_id, currentUserId);
  
    if (inserted) {
      await notifyMentions(newComment.trim(), "comment", inserted.id, currentUserId);
    }
  
    setNewComment("");
    setCommentKey((k) => k + 1);
  }

  const firstAttachment = post.attachments?.[0];
  const imageUrl = firstAttachment ? getPublicUrl(firstAttachment.storage_path) : null;

  return (
    <>
      <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center py-4 px-3 gap-1 rounded-l-2xl">
            <VoteColumn
              targetId={post.id}
              targetType="post"
              likeCount={post.like_count}
              userVote={post.userVote ?? null}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 min-w-0">
            {/* Meta */}
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
              {post.author.is_verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              )}
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.edited_at && (
                <span className="text-xs text-slate-400 italic">(diedit)</span>
              )}
            </div>

            {/* Title */}
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug mb-1">
              {highlight(post.title)}
            </h2>

            {/* Content — @mentions are clickable links */}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
              {highlight(post.content)}
            </p>

            {/* Image attachment */}
            {imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="Post attachment"
                  className="max-h-80 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-zoom-in"
                  onClick={() => setLightboxImg(imageUrl)}
                />
              </div>
            )}

            {/* Actions */}
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
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>

              {currentUserId === post.author_id ? (
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-full transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-full transition"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                  {showReport && (
                    <div className="absolute left-0 top-8 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden z-20">
                      {["Abusive", "Hate speech", "Nudity", "Others"].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleReport()}
                          className="block w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {reportDone && (
              <p className="mt-2 text-xs text-blue-500 font-semibold">Laporan terkirim ✓</p>
            )}

            {/* Comment section */}
            {expanded && (
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                {currentUserId ? (
                  <div className="flex gap-2 mb-4">
                    {/* ↓ MentionInput replaces plain <input> in comment box */}
                    <MentionInput
                      value={newComment}
                      onChange={setNewComment}
                      onKeyDown={(e) => e.key === "Enter" && submitComment()}
                      placeholder="Tulis komentar... ketik @ untuk mention"
                      className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 w-full"
                    />
                    <button
                      onClick={submitComment}
                      className="rounded-full bg-blue-500 text-white font-bold px-4 py-2 text-sm hover:bg-blue-600 transition"
                    >
                      Kirim
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-4">
                    <Link href="/" className="text-blue-500 font-bold hover:underline">Login</Link> untuk berkomentar.
                  </p>
                )}

                {commentsLoading ? (
                  <p className="text-sm text-slate-400">Memuat komentar...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada komentar. Jadilah yang pertama!</p>
                ) : (
                  <div key={commentKey} className="divide-y divide-slate-100 dark:divide-slate-800">
                    {comments.map((c) => (
                      <CommentNode
                        key={c.id}
                        comment={c}
                        currentUserId={currentUserId}
                        onReplyAdded={() => setCommentKey((k) => k + 1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Lightbox */}
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
    () => categories.filter((category) => joinedCategoryIds.includes(category.id)),
    [categories, joinedCategoryIds]
  );
  const discoverCategories = useMemo(
    () => categories.filter((category) => !joinedCategoryIds.includes(category.id)),
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
        <aside className="sticky top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" active />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" badge={unreadCount} />
            <MenuItem text="Profile" href="/profile" />

            <button
              onClick={() => {
                if (!currentUserId) { window.location.href = "/"; return; }
                setShowCreate(true);
              }}
              className="mt-5 w-full rounded-full bg-yellow-400 text-slate-900 font-extrabold py-3 hover:bg-yellow-500 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Buat Post
            </button>
          </div>

          {/* Communities */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 mb-3 px-1">Communities</h3>
            <button
              onClick={() => setFeedView("followed")}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition mb-1 ${
                feedView === "followed" ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Followed
            </button>
            <button
              onClick={() => setFeedView("explore")}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition mb-4 ${
                feedView === "explore" ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Explore
            </button>

            <p className="px-1 mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">My Communities</p>
            {joinedCategories.length === 0 ? (
              <p className="px-1 mb-4 text-xs leading-relaxed text-slate-400">
                Join communities to build your followed feed.
              </p>
            ) : (
              joinedCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/community/${c.slug}`}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition mb-1"
                >
                  r/{c.slug}
                </Link>
              ))
            )}

            <p className="px-1 mt-4 mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">Discover</p>
            {discoverCategories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Link
                  href={`/community/${c.slug}`}
                  className="min-w-0 flex-1 text-sm font-semibold text-slate-600 dark:text-slate-400 truncate"
                >
                  r/{c.slug}
                </Link>
                <button
                  onClick={() => {
                    if (!currentUserId) { window.location.href = "/"; return; }
                    if (isJoined(c.id)) {
                      leave(c.id);
                    } else {
                      join(c.id);
                    }
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    isJoined(c.id)
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      : "bg-yellow-400 text-slate-900 hover:bg-yellow-500"
                  }`}
                >
                  {isJoined(c.id) ? "Joined" : "Join"}
                </button>
              </div>
            ))}
            {discoverCategories.length === 0 && (
              <p className="px-1 text-xs text-slate-400">You joined every community.</p>
            )}
          </div>
        </aside>

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
          {/* Community info */}
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

          {/* Rules */}
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

          {/* Marketplace CTA */}
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

      {/* Create Post Modal */}
      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onSuccess={handlePostCreated} />
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