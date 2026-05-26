"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Bell, BellRing, Mail, MoreHorizontal } from "lucide-react";
import DarkModeToggle from "../../components/DarkModeToggle";

const users: Record<string, any> = {
  lalalisa_m: {
    name: "lalalisa_m",
    major: "Computer Science · 2026",
    bio: "Software Engineering enthusiast. Currently learning UI/UX and system design.",
    avatar: "L",
    posts: 12,
    followers: 1420,
    following: 210,
  },
  roses_are_rosie: {
    name: "roses_are_rosie",
    major: "Information Systems · 2025",
    bio: "Marketplace, notes, books, and campus life.",
    avatar: "R",
    posts: 8,
    followers: 980,
    following: 156,
  },
  sooyaa__: {
    name: "sooyaa__",
    major: "Cyber Security · 2024",
    bio: "Cyber security student. CTF, ML, and deadline reminders.",
    avatar: "S",
    posts: 15,
    followers: 1210,
    following: 188,
  },
};

export default function OtherProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const user = users[username] || {
    name: username,
    major: "BINUS Student",
    bio: "No bio yet.",
    avatar: username[0]?.toUpperCase() || "U",
    posts: 0,
    followers: 0,
    following: 0,
  };

  const [following, setFollowing] = useState(false);
  const [bellOn, setBellOn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notice, setNotice] = useState("");

  function submitAction(text: string) {
    setShowMenu(false);
    setNotice(text);

    setTimeout(() => {
      setNotice("");
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Binusphere" className="w-[170px]" />

        <input
          placeholder="Search BinusSphere"
          className="w-[420px] rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <div className="flex items-center gap-3">
          <DarkModeToggle />

          <Link
            href="/messages"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center transition"
          >
            <Mail className="w-5 h-5" />
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
            <MenuItem icon="" text="Home" href="/home"/>
            <MenuItem icon="" text="Forum" href="/forum" />
            <MenuItem icon="" text="Marketplace" href="/marketplace" />
            <MenuItem icon="" text="Notifications" href="/notifications" />
            <MenuItem icon="" text="Profile" href="/profile" />
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
                <div className="w-28 h-28 rounded-full bg-yellow-100 flex items-center justify-center font-extrabold text-yellow-600 text-4xl border-4 border-white dark:border-slate-900">
                  {user.avatar}
                </div>

                <div className="flex items-center gap-3 relative">
                  {notice && (
                    <p className="absolute -top-9 right-0 text-sm bg-blue-500 text-white px-3 py-1 rounded-full shadow">
                      {notice}
                    </p>
                  )}

                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 rounded-full border border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 flex items-center justify-center transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-32 top-12 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden z-20">
                      <button
                        onClick={() => submitAction("Report submitted")}
                        className="block w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => submitAction("User blocked")}
                        className="block w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Block
                      </button>
                    </div>
                  )}

                  <Link
                    href={`/messages?chat=${user.name}`}
                    className="w-10 h-10 rounded-full border border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 flex items-center justify-center transition"
                  >
                    <Mail className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={() => setBellOn(!bellOn)}
                    className={`w-10 h-10 rounded-full border border-blue-400 flex items-center justify-center transition ${
                      bellOn
                        ? "bg-blue-500 text-white"
                        : "text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {bellOn ? (
                      <BellRing className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => setFollowing(!following)}
                    className={`rounded-full font-bold px-6 py-2 transition ${
                      following
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {user.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  {user.major}
                </p>

                <p className="mt-4 text-slate-700 dark:text-slate-300">
                  {user.bio}
                </p>

                <div className="flex gap-5 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {user.posts}
                    </span>{" "}
                    posts
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {user.followers}
                    </span>{" "}
                    followers
                  </p>
                  <p>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {user.following}
                    </span>{" "}
                    following
                  </p>
                </div>
              </div>
            </div>
          </div>

          <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 text-lg">
                {user.avatar}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {user.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {user.major}
                </p>
                <p className="mt-4 text-slate-800 dark:text-slate-200">
                  This is one of {user.name}'s public posts.
                </p>
              </div>
            </div>
          </article>
        </section>

        <aside className="sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              About
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Student profile on Binusphere.
            </p>
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
  icon: string
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
      {text}
    </Link>
  );
}