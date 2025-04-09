// app/signin/page.jsx  (or pages/signin.jsx if using the pages/ router)
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "./_utils/supabase-client"; // Adjust the import path as necessary

export default function SignIn() {
  const router = useRouter();

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // for demonstration: fetched users
  const [users, setUsers] = useState([]);

  // error / loading states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already signed in, redirect to home
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  // Example: fetch all users (protected API) once signed in
  useEffect(() => {
    async function loadUsers() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Call your protected API route to fetch users
      const res = await fetch("/api/users", {
        headers: { user_id: session.user.id },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    }
    loadUsers();
  }, []);

  // Email/password sign in
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      router.replace("/");
    }
  };

  // Google OAuth sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    setLoading(false);
    if (oauthError) setError(oauthError.message);
    // Supabase will redirect automatically on success
  };

  return (
    <div className="bg-[#46708D] h-screen w-screen flex flex-col justify-center items-center">
      <header className="flex flex-col items-center mb-10 relative">
        <Image
          src="/assets/frey-trade.png"
          alt="Frey Trade Logo"
          width={200}
          height={200}
        />
        <h1 className="text-4xl text-[#C4BB96] absolute top-3/4 transform -translate-y-1/2 translate-x-8 w-75">
          FREY TRADE
        </h1>
      </header>

      <main className="flex flex-col items-center mb-40">
        {error && (
          <p className="text-red-400 mb-4">
            {error}
          </p>
        )}

        <form
          onSubmit={handleEmailSignIn}
          className="flex flex-col items-center"
        >
          <input
            type="email"
            placeholder="E‑MAIL"
            className="p-4 w-80 h-10 border-[#A57730] border-2 rounded-md mb-5 text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            className="p-4 w-80 h-10 border-[#A57730] border-2 rounded-md mb-5 text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-[#A57730] text-black font-bold py-2 px-4 rounded-md w-80"
            disabled={loading}
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <div className="w-80 border-t border-[#C4BB96] my-5" />

        <button
          onClick={handleGoogleSignIn}
          className="bg-white text-black font-bold p-2 rounded-md w-80 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? "Redirecting…" : "SIGN IN WITH GOOGLE"}
          <Image
            src="/assets/7123025_logo_google_g_icon.png"
            alt="Google Icon"
            width={24}
            height={24}
            className="ml-2"
          />
        </button>

        <div className="w-80 border-t border-[#C4BB96] my-5" />

        <p className="text-[#C4BB96]">DON’T HAVE AN ACCOUNT?</p>
        <button
          onClick={() => router.push("/pages/sign-up")}
          className="text-[#C4BB96] border-b-2 mt-2"
        >
          SIGN UP
        </button>
      </main>

      {/* Example: Display fetched users */}
      {users.length > 0 && (
        <section className="absolute bottom-4 text-sm text-[#C4BB96]">
          <p>Other users in system:</p>
          <ul>
            {users.map((u) => (
              <li key={u.id}>{u.email}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
