"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  Trash2,
  X,
  CheckCircle2,
  CornerDownRight,
  AtSign,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useComments, Post, Comment } from "../forum/hooks/usePosts";
import { useVote, useBookmark } from "../forum/hooks/useVote";
import {
  notifyComment,
  notifyReply,
  notifyMentions,
} from "../forum/hooks/notificationUtils";
import NimBadge from "./NimBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function getPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  author,
  size = 8,
}: {
  author: { username: string; avatar_url: string | null };
  size?: number;
}) {
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

export function renderWithMentions(text: string) {
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

export function MentionInput({
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
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const textBeforeCursor = newValue.slice(0, cursor);
    const match = textBeforeCursor.match(/@([\w.]*)$/);

    if (match) {
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setMentionStart(atIndex);
      setShowDropdown(true);
      setActiveIndex(0);
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
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const newValue = `${before}@${username} ${after}`;
    onChange(newValue);
    setShowDropdown(false);
    setSuggestions([]);
    setMentionStart(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const newCursor = before.length + username.length + 2;
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestions[activeIndex].username); return; }
      if (e.key === "Escape") { setShowDropdown(false); return; }
    }
    onKeyDown?.(e);
  }

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

  const sharedProps = { ref: inputRef as any, value, onChange: handleChange, onKeyDown: handleKeyDown, placeholder, className };

  return (
    <div className="relative flex-1">
      {multiline ? <textarea {...sharedProps} rows={rows} /> : <input {...sharedProps} type="text" />}

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
                idx === activeIndex ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-7 h-7 rounded-full object-cover shrink-0" />
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
                  {profile.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />}
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

// ─── VoteColumn ───────────────────────────────────────────────────────────────

export function VoteColumn({
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
    userVote,
  );

  const base = vertical
    ? "flex flex-col items-center gap-1 min-w-[40px]"
    : "flex items-center gap-1";

  return (
    <div className={base}>
      <button
        onClick={() => castVote(1)}
        className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${vote === 1 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}
        aria-label="Upvote"
      >
        <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
      </button>
      <span className={`text-sm font-bold tabular-nums ${vote === 1 ? "text-blue-500" : vote === -1 ? "text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
        {count}
      </span>
      <button
        onClick={() => castVote(-1)}
        className={`p-1 rounded transition hover:bg-slate-100 dark:hover:bg-slate-800 ${vote === -1 ? "text-red-400" : "text-slate-400 dark:text-slate-500"}`}
        aria-label="Downvote"
      >
        <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── CommentNode ──────────────────────────────────────────────────────────────

export function CommentNode({
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

    await notifyReply(comment.id, comment.author_id, currentUserId, comment.post_id);

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
          {comment.author.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
          <NimBadge nim={comment.author.nim} />
          <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
          {comment.edited_at && <span className="text-xs text-slate-400 italic">(diedit)</span>}
        </div>

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

// ─── PostCard ─────────────────────────────────────────────────────────────────

export type PostCardProps = {
  post: Post;
  currentUserId: string | null;
  searchKeyword?: string;
  /** Start with comments already expanded — used on the dedicated post page */
  defaultExpanded?: boolean;
  /** Called after the post is deleted */
  onDeleted: () => void;
  /** Called after the post is unbookmarked (used on bookmarks page) */
  onUnbookmarked?: (postId: string) => void;
};

export function PostCard({
  post,
  currentUserId,
  searchKeyword = "",
  defaultExpanded = false,
  onDeleted,
  onUnbookmarked,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
            <span key={i}>{renderWithMentions(p)}</span>
          )
        )}
      </>
    );
  }

  async function handleToggleBookmark() {
    await toggleBookmark();
    // If an unbookmark handler is provided (bookmarks page), notify parent
    if (!bookmarked && onUnbookmarked) {
      // bookmarked is still true here (state hasn't updated), so "not bookmarked after toggle" = was bookmarked
    }
    if (bookmarked && onUnbookmarked) {
      onUnbookmarked(post.id);
    }
  }

  async function handleDeletePost() {
    await supabase.from("posts").update({ is_deleted: true }).eq("id", post.id);
    onDeleted();
    onUnbookmarked?.(post.id);
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
      .insert({ post_id: post.id, author_id: currentUserId, content: newComment.trim() })
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
              {post.author.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
              <NimBadge nim={post.author.nim} />
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.edited_at && <span className="text-xs text-slate-400 italic">(diedit)</span>}
            </div>

            {/* Title */}
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug mb-1">
              {highlight(post.title)}
            </h2>

            {/* Content */}
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
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition ${
                  bookmarked
                    ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
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
                          onClick={handleReport}
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