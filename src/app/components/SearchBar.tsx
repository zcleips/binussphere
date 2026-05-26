"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type SearchBarProps = {
  posts: {
    content: string;
    tag: string;
    name: string;
  }[];
  onSearch: (keyword: string) => void;
};

export default function SearchBar({ posts, onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = posts
    .filter((post) => {
      const text = `${post.content} ${post.tag} ${post.name}`.toLowerCase();
      return keyword.trim() && text.includes(keyword.toLowerCase());
    })
    .slice(0, 5);

  function submitSearch(value: string) {
    onSearch(value);
    setKeyword(value);
    setShowSuggestions(false);
  }

  return (
    <div className="relative w-[420px]">
      <input
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitSearch(keyword);
        }}
        placeholder="Search BinusSphere"
        className="w-full rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-400"
      />

      

      {showSuggestions && keyword.trim() && (
        <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden z-[999]">
          {suggestions.length > 0 ? (
            suggestions.map((post, index) => (
              <button
                key={index}
                onClick={() => submitSearch(post.content)}
                className="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {post.content}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {post.tag} · @{post.name}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <button
              onClick={() => submitSearch(keyword)}
              className="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  Search for “{keyword}”
                </span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}