"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldDark = saved === "dark";

    document.documentElement.classList.toggle("dark", shouldDark);
    setDark(shouldDark);
  }, []);

  function toggleDarkMode() {
    const next = !dark;

    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-yellow-300 flex items-center justify-center transition"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}