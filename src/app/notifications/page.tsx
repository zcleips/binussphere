"use client";
import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { MessageCircle, Heart, Reply, Mail } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "like",
      user: "lalalisa_m",
      text: "liked your post about BinusSphere homepage.",
      time: "2m ago",
    },
    {
      id: 2,
      type: "reply",
      user: "roses_are_rosie",
      text: "replied to your comment: “UI-nya clean banget.”",
      time: "14m ago",
    },
    {
      id: 3,
      type: "dm",
      user: "sooyaa__",
      text: "sent you a direct message.",
      time: "28m ago",
    },
    {
      id: 4,
      type: "like",
      user: "kevin_cs",
      text: "liked your marketplace post.",
      time: "1h ago",
    },
  ];

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
            <MenuItem
              icon=""
              text="Notifications"
              href="/notifications"
              active
            />
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Notifications
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Likes, replies, and messages from other Binusians.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex gap-4 p-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    notif.type === "like"
                      ? "bg-red-100 text-red-500"
                      : notif.type === "reply"
                      ? "bg-blue-100 text-blue-500"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {notif.type === "like" && (
                    <Heart className="w-5 h-5 fill-red-500" />
                  )}
                  {notif.type === "reply" && <Reply className="w-5 h-5" />}
                  {notif.type === "dm" && <Mail className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {notif.user}
                    </span>{" "}
                    {notif.text}
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    {notif.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="sticky top-24 h-fit space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              Activity Summary
            </h2>
            <div className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-blue-500">2</span> new likes
              </p>
              <p>
                <span className="font-bold text-blue-500">1</span> new reply
              </p>
              <p>
                <span className="font-bold text-blue-500">1</span> new DM
              </p>
            </div>
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