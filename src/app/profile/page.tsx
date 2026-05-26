"use client";
import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState } from "react";
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
  likes: number;
  comments: Comment[];
};

export default function ProfilePage() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      name: "jennie_kim",
      major: "Computer Science · 2026",
      content: "Bulan depan udah skripsi 😭",
      tag: "",
      likes: 7804,
      comments: [
        {
          id: 1,
          name: "lalalisa_m",
          content: "damn, time flies :(((",
          isMine: false,
          likes: 690,
        },
      ],
    },
    {
      id: 2,
      name: "jennie_kim",
      major: "Computer Science · 2026",
      content:
        "Ada yang mau diskusi Software Engineering project? Aku lagi finalize use case + requirements.",
      tag: "#Forum",
      likes: 0,
      comments: [],
    },
  ]);

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
            <MenuItem icon="" text="Forum" href="/forum" />
            <MenuItem icon="" text="Marketplace" href="/marketplace" />
            <MenuItem icon="" text="Notifications" href="/notifications" />
            <MenuItem icon="" text="Profile" href="/profile" active />

            <Link
  href="/home?focusPost=true"
  className="mt-5 block w-full rounded-full bg-yellow-400 text-center text-slate-900 font-extrabold py-3 hover:bg-yellow-500 transition"
>
  Create Post
</Link>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-blue-500 via-blue-400 to-yellow-300"></div>

            <div className="px-6 pb-6">
              <div className="flex justify-between items-end -mt-14">
                <img
                  src="/jennie.jpeg"
                  alt="profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-900"
                />

                <button className="rounded-full border border-blue-500 text-blue-500 font-bold px-5 py-2 hover:bg-blue-50 dark:hover:bg-white/5 transition">
                  Edit Profile
                </button>
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  jennie_kim
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Computer Science · 2026
                </p>

                <p className="mt-4 text-slate-700 dark:text-slate-300">
                  Hi everyone! Active b28 student who likes to discuss DSAs !!
                </p>

                <div className="flex gap-5 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {posts.length}
                    </span>{" "}
                    posts
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      2438
                    </span>{" "}
                    followers
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      183
                    </span>{" "}
                    following
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-xl px-1 text-slate-900 dark:text-slate-100">
            Your Posts
          </h2>

          {posts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              onDeletePost={deletePost}
            />
          ))}
        </section>

        <aside className="sticky top-24 h-fit space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              Profile Stats
            </h2>
            <div className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-blue-500">12</span> total likes
              </p>
              <p>
                <span className="font-bold text-blue-500">4</span> comments
                received
              </p>
              <p>
                <span className="font-bold text-blue-500">3</span> forum
                discussions
              </p>
            </div>
          </div>

          <div className="bg-blue-500 rounded-3xl shadow-sm p-5 text-white">
            <h2 className="font-extrabold text-xl">Binusian Badge</h2>
            <p className="mt-2 text-white/80">Verified student account.</p>
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
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
      }`}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

function ProfilePostCard({
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
    <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex gap-4">
        <img
          src="/jennie.jpeg"
          alt="profile"
          className="w-12 h-12 rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {post.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {post.major}
              </p>
            </div>

            <button
              onClick={() => onDeletePost(post.id)}
              className="flex items-center gap-1 text-red-400 hover:text-red-600 text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          <p className="mt-4 text-slate-800 dark:text-slate-200 leading-relaxed">
            {post.content}
          </p>

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
                reshared
                  ? "text-blue-500"
                  : "text-slate-500 dark:text-slate-400"
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
                  liked
                    ? "fill-red-500 text-red-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              />
              <span>{likeCount}</span>
            </button>
          </div>

          {showCommentBox && (
            <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
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
                    className="w-full rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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

  return (
    <div className="flex gap-3 items-start">
      {comment.isMine ? (
        <img
          src="/jennie.jpeg"
          alt="profile"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 text-sm">
          {comment.name[0].toUpperCase()}
        </div>
      )}

      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {comment.name}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {comment.content}
          </p>
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
              likedComment
                ? "text-red-500"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Heart
              className={`w-3 h-3 ${
                likedComment
                  ? "fill-red-500 text-red-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            />
            {commentLikeCount}
          </button>

          {comment.isMine && (
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}