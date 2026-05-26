"use client";
import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState, useRef } from "react";
import { Heart, Flag, Trash2, MessageCircle } from "lucide-react";

type Comment = {
  id: number;
  name: string;
  content: string;
  isMine: boolean;
  likes: number;
};

type Post = {
  id: number;
  name: string;
  major: string;
  content: string;
  tag: string;
  isMine: boolean;
  likes: number;
  comments: Comment[];
};

export default function HomePage() {
 const postBoxRef = useRef<HTMLTextAreaElement>(null);

function focusPostBox() {
  postBoxRef.current?.focus();

  postBoxRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}
const [posts, setPosts] = useState<Post[]>([
  {
    id: 1,
    name: "janeausten56",
    major: "Computer Science · 2026",
    content:
      "Menurut kalian mending enrichment internship atau study abroad?",
    tag: "#FORUM",
    isMine: false,
    likes: 1066,
    comments: [
      {
        id: 1,
        name: "jennie_kim",
        content:
          "Kalau targetnya kerja setelah lulus, menurutku internship lebih worth it.",
        isMine: true,
        likes: 389,
      },
      {
        id: 2,
        name: "franz__kafka_",
        content:
          "Study abroad bagus kalau mau exposure dan networking internasional sih.",
        isMine: false,
        likes: 46,
      },
    ],
  },
  {
    id: 2,
    name: "albert_camus",
    major: "Cyber Security · 2024",
    content:
      "Ada yang punya tips survive semester padat sambil ikut organisasi?",
    tag: "#FORUM",
    isMine: false,
    likes: 89,
    comments: [
      {
        id: 1,
        name: "lalalisa_m",
        content:
          "Time blocking wajib banget. Jangan tunggu deadline baru ngerjain.",
        isMine: false,
        likes: 34,
      },
      {
        id: 2,
        name: "jennie_kim",
        content:
          "Aku biasanya pilih prioritas: tugas nilai besar dulu, baru urusan organisasi.",
        isMine: true,
        likes: 23,
      },
    ],
  },
  {
    id: 3,
    name: "fyodordostoevsky",
    major: "Computer Science · 2025",
    content:
      "Buat yang udah ambil Machine Learning, lebih susah project atau exam?",
    tag: "#FORUM",
    isMine: false,
    likes: 908,
    comments: [
      {
        id: 1,
        name: "roses_are_rosie",
        content:
          "Project lebih makan waktu, tapi exam lebih bikin panik kalau konsepnya belum kuat.",
        isMine: false,
        likes: 50,
      },
    ],
  },
]);

  const [newPost, setNewPost] = useState("");

  function deletePost(postId: number) {
    setPosts(posts.filter((post) => post.id !== postId));
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Binusphere" className="w-[170px]" />

        <div className="w-[420px]">
          <input
            placeholder="Search BinusSphere"
            className="w-full rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

<div className="flex items-center gap-3">
  <DarkModeToggle />
  <Link
    href="/messages"
    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center transition"
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

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr_320px] gap-6 px-6 py-6">
        <aside className="sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem icon="" text="Home" href="/home" />
            <MenuItem icon="" text="Forum" href="/forum" active />
            <MenuItem icon="" text="Marketplace" href="/marketplace" />
            <MenuItem icon="" text="Notifications" href="/notifications" />
            <MenuItem icon="" text="Profile" href="/profile" />

            <button
  onClick={focusPostBox}
  className="mt-5 w-full rounded-full bg-yellow-400 text-slate-900 font-extrabold py-3 hover:bg-yellow-500 transition"
>
  Create Post
</button>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex gap-4">
              <Link href="/profile">
  <img
    src="/jennie.jpeg"
    alt="profile"
    className="w-14 h-14 rounded-full object-cover cursor-pointer hover:opacity-90 transition"
  />
</Link>

              <div className="flex-1">
<textarea
  ref={postBoxRef}
  placeholder="What’s happening around BINUS?"
  className="w-full resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-600 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:"
  rows={3}
/>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      if (!newPost.trim()) return;

                      const newItem: Post = {
                        id: Date.now(),
                        name: "jennie_kim",
                        major: "Computer Science · 2026",
                        content: newPost,
                        tag: "#FORUM",
                        isMine: true,
                        likes: 0,
                        comments: [],
                      };

                      setPosts([newItem, ...posts]);
                      setNewPost("");
                    }}
                    className="rounded-full bg-blue-500 text-white font-bold px-6 py-2 hover:bg-blue-600 transition"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeletePost={deletePost}
            />
          ))}
        </section>

        <aside className="sticky top-24 h-fit space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-extrabold text-xl">Trending</h2>

            <div className="mt-4 space-y-4">
              <Trend tag="#Binusian" posts="1.2k posts" />
              <Trend tag="#Marketplace" posts="428 posts" />
              <Trend tag="#SoftwareEngineering" posts="214 posts" />
              <Trend tag="#MachineLearning" posts="189 posts" />
            </div>
          </div>

          <div className="bg-blue-500 rounded-3xl shadow-sm p-5 text-white">
            <h2 className="font-extrabold text-xl">Campus Marketplace</h2>
            <p className="mt-2 text-white/80">
              Buy, sell, and trade safely with verified Binusians.
            </p>
            <button className="mt-4 rounded-full bg-yellow-400 text-slate-900 font-bold px-5 py-2">
              Explore
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MenuItem({
  icon,
  text,
  href,
  active = false,
}: {
  icon: string;
  text: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold cursor-pointer transition ${
        active
          ? "bg-blue-500 text-white"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

function PostCard({
  post,
  onDeletePost,
}: {
  post: Post;
  onDeletePost: (postId: number) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const [reshared, setReshared] = useState(false);
  const [reshareCount, setReshareCount] = useState(0);

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState<Comment[]>(post.comments);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  function submitReport(reason: string) {
    setShowReportMenu(false);
    setReportMsg(`Report submitted: ${reason}`);

    setTimeout(() => {
      setReportMsg("");
    }, 2000);
  }

  function addComment() {
    if (!newComment.trim()) return;

    const newItem: Comment = {
      id: Date.now(),
      name: "jennie_kim",
      content: newComment,
      isMine: true,
      likes: 0,
    };

    setCommentList([...commentList, newItem]);
    setNewComment("");
  }

  function deleteComment(commentId: number) {
    setCommentList(commentList.filter((comment) => comment.id !== commentId));
  }

  return (
    <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 relative">
      {reportMsg && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md">
          {reportMsg}
        </div>
      )}

      <div className="flex gap-4">
        {post.isMine ? (
          <img
            src="/jennie.jpeg"
            alt="profile"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 text-lg">
            {post.name[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{post.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{post.major}</p>
            </div>

            {post.isMine ? (
              <button
                onClick={() => onDeletePost(post.id)}
                className="flex items-center gap-1 text-red-400 hover:text-red-600 text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 text-sm font-semibold"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>

                {showReportMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden z-20">
                    {["Abusive", "Hate speech", "Nudity", "Others"].map(
                      (reason) => (
                        <button
                          key={reason}
                          onClick={() => submitReport(reason)}
                          className="block w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {reason}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-4 text-slate-800 dark:text-slate-200 leading-relaxed">{post.content}</p>

          {post.tag && (
            <p className="mt-3 text-blue-500 font-bold">{post.tag}</p>
          )}

          <div className="mt-5 flex gap-8 text-slate-500 dark:text-slate-400 font-semibold">
            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex items-center gap-2"
            >
              <span>🗨</span>
              <span>{commentList.length}</span>
            </button>

            <button
              onClick={() => {
                setReshareCount(reshared ? reshareCount - 1 : reshareCount + 1);
                setReshared(!reshared);
              }}
              className={`flex items-center gap-2 transition ${
                reshared ? "text-blue-500" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span>↻</span>
              <span>{reshareCount}</span>
            </button>

            <button
              onClick={() => {
                setLikeCount(liked ? likeCount - 1 : likeCount + 1);
                setLiked(!liked);
              }}
              className="flex items-center gap-2"
            >
              <Heart
                className={`w-5 h-5 transition ${
                  liked ? "fill-red-500 text-red-500" : "text-slate-500 dark:text-slate-400"
                }`}
              />
              <span>{likeCount}</span>
            </button>
          </div>

          {showCommentBox && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex gap-3">
                <img
                  src="/jennie.jpeg"
                  alt="profile"
                  className="w-9 h-9 rounded-full object-cover"
                />

                <div className="flex-1">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400"
                  />

                  <button
                    onClick={addComment}
                    className="mt-3 rounded-full bg-blue-500 text-white font-bold px-5 py-2 hover:bg-blue-600 transition"
                  >
                    Comment
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {commentList.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onDeleteComment={deleteComment}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentCard({
  comment,
  onDeleteComment,
}: {
  comment: Comment;
  onDeleteComment: (commentId: number) => void;
}) {
  const [likedComment, setLikedComment] = useState(false);
  const [commentLikeCount, setCommentLikeCount] = useState(comment.likes);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  function submitReport(reason: string) {
    setShowReportMenu(false);
    setReportMsg(`Report submitted: ${reason}`);

    setTimeout(() => {
      setReportMsg("");
    }, 1500);
  }

  return (
    <div className="flex gap-3 items-start relative">
      {reportMsg && (
        <div className="absolute -top-2 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          {reportMsg}
        </div>
      )}

      {comment.isMine ? (
  <Link href="/profile">
    <img
      src="/jennie.jpeg"
      alt="profile"
      className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-90 transition"
    />
  </Link>
      ) : (
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 text-sm">
          {comment.name[0].toUpperCase()}
        </div>
      )}

      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
          {comment.isMine ? (
  <Link href="/profile">
    <p className="font-bold text-sm hover:underline cursor-pointer">
      {comment.name}
    </p>
  </Link>
) : (
  <p className="font-bold text-sm">{comment.name}</p>
)}
          <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
        </div>

        <div className="flex gap-4 mt-1 ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button
            onClick={() => {
              setCommentLikeCount(
                likedComment ? commentLikeCount - 1 : commentLikeCount + 1
              );
              setLikedComment(!likedComment);
            }}
            className={`flex items-center gap-1 ${
              likedComment ? "text-red-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Heart
              className={`w-3 h-3 ${
                likedComment ? "fill-red-500 text-red-500" : "text-slate-500 dark:text-slate-400"
              }`}
            />
            {commentLikeCount}
          </button>

          {comment.isMine ? (
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="hover:text-red-500"
              >
                Report
              </button>

              {showReportMenu && (
                <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-20">
                  {["Abusive", "Hate speech", "Nudity", "Others"].map(
                    (reason) => (
                      <button
                        key={reason}
                        onClick={() => submitReport(reason)}
                        className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-100"
                      >
                        {reason}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Trend({ tag, posts }: { tag: string; posts: string }) {
  return (
    <div>
      <p className="font-bold text-blue-500">{tag}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{posts}</p>
    </div>
  );
}