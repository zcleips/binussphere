"use client";
import DarkModeToggle from "../components/DarkModeToggle";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type Chat = {
  id: number;
  name: string;
  major: string;
  lastMessage: string;
  time: string;
  messages: {
    sender: "me" | "them";
    text: string;
  }[];
};

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      name: "lalalisa_m",
      major: "Computer Science · 2026",
      lastMessage: "Nanti aku send contoh use case diagramnya ya.",
      time: "2m",
      messages: [
        { sender: "them", text: "Hai, kamu jadi ambil SE project BinusSphere?" },
        { sender: "me", text: "Iya, lagi bikin forum + marketplace." },
        { sender: "them", text: "Nanti aku send contoh use case diagramnya ya." },
      ],
    },
    {
      id: 2,
      name: "roses_are_rosie",
      major: "Information Systems · 2025",
      lastMessage: "Bukunya masih available kok.",
      time: "20m",
      messages: [
        { sender: "me", text: "Hi, buku Algorithm Design masih ada?" },
        { sender: "them", text: "Bukunya masih available kok." },
      ],
    },
    {
      id: 3,
      name: "sooyaa__",
      major: "Cyber Security · 2024",
      lastMessage: "Deadline GSLC besok ya jangan lupa.",
      time: "1h",
      messages: [
        { sender: "them", text: "Deadline GSLC besok ya jangan lupa." },
      ],
    },
  ]);

  const [selectedChatId, setSelectedChatId] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)!;

  function sendMessage() {
    if (!newMessage.trim()) return;

    setChats(
      chats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              lastMessage: newMessage,
              time: "now",
              messages: [...chat.messages, { sender: "me", text: newMessage }],
            }
          : chat
      )
    );

    setNewMessage("");
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
            className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-500 dark:text-blue-400 flex items-center justify-center transition"
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

      <section className="max-w-7xl mx-auto grid grid-cols-[240px_1fr] gap-6 px-6 py-6">
        <aside className="sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <MenuItem text="Home" href="/home" />
            <MenuItem text="Forum" href="/forum" />
            <MenuItem text="Marketplace" href="/marketplace" />
            <MenuItem text="Notifications" href="/notifications" />
            <MenuItem text="Profile" href="/profile" />

            <Link
  href="/home?focusPost=true"
  className="mt-5 block w-full rounded-full bg-yellow-400 text-center text-slate-900 font-extrabold py-3 hover:bg-yellow-500 transition"
>
  Create Post
</Link>
          </div>
        </aside>

        <section className="grid grid-cols-[330px_1fr] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[650px]">
          <div className="border-r border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Messages
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Direct messages from Binusians.
              </p>
            </div>

            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-4 flex gap-3 border-b border-slate-100 dark:border-slate-800 transition ${
                  selectedChatId === chat.id
                    ? "bg-blue-50 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Link href={`/profile/${chat.name}`}>
  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 cursor-pointer hover:opacity-90 transition">
    {chat.name[0].toUpperCase()}
  </div>
</Link>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <Link href={`/profile/${chat.name}`}>
  <p className="font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer">
    {chat.name}
  </p>
</Link>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {chat.time}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {chat.major}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Link href={`/profile/${selectedChat.name}`}>
  <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600 cursor-pointer hover:opacity-90 transition">
    {selectedChat.name[0].toUpperCase()}
  </div>
</Link>

              <div>
                <Link href={`/profile/${selectedChat.name}`}>
  <h2 className="font-extrabold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer">
    {selectedChat.name}
  </h2>
</Link>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedChat.major}
                </p>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
              {selectedChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[65%] px-4 py-3 rounded-3xl text-sm ${
                      message.sender === "me"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              <button
                onClick={sendMessage}
                className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function MenuItem({
  text,
  href,
  active = false,
}: {
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
      {text}
    </Link>
  );
}