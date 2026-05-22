"use client";

import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setSuccessMsg("");
      setErrorMsg(error.message);
      return;
    }

    setErrorMsg("");
    setSuccessMsg("Account created successfully!");

    setEmail("");
    setPassword("");

    setTimeout(() => {
      setIsSignUp(false);
      setSuccessMsg("");
    }, 1500);
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSuccessMsg("");
      setErrorMsg(error.message);
      return;
    }

    setErrorMsg("");
    window.location.href = "/home";
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center">

      {/* BACKGROUND */}
      <img
        src="/campus.jpg"
        alt="Campus"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* LOGIN CARD */}
      <section className="relative z-10 w-[420px] rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 p-10 shadow-2xl">

        {/* LOGO */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-[250px]"
          />
        </div>

        {/* TITLE */}
        <h1 className="text-white text-3xl font-bold text-center mt-8">
          {isSignUp ? "Create Account" : "Welcome Back !"}
        </h1>

        <p className="text-white/70 text-center mt-2">
          {isSignUp
            ? "Create your Binusphere account"
            : "Login to continue to Binusphere"}
        </p>

        {/* INPUTS */}
        <div className="mt-10 flex flex-col gap-5">

          <input
            type="email"
            placeholder="Binus Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/20 border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/20 border border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none"
          />

          {errorMsg && (
            <p className="text-red-400 text-sm -mt-2">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-green-400 text-sm -mt-2">
              {successMsg}
            </p>
          )}

        </div>

        {/* BUTTON */}
        <button
          onClick={isSignUp ? handleSignUp : handleLogin}
          className="w-full mt-6 rounded-2xl bg-blue-500 py-4 text-white font-bold hover:bg-blue-600 transition"
        >
          {isSignUp ? "Sign up" : "Login"}
        </button>

        {/* TOGGLE */}
        <p className="text-center text-white/70 mt-6">
          {isSignUp
            ? "Already have an account?"
            : "Don’t have an account?"}{" "}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-blue-300 cursor-pointer hover:underline"
          >
            {isSignUp ? "Login" : "Sign up"}
          </span>
        </p>

      </section>

    </main>
  );
}