// app/sign-in/page.js
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase-client";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("../home");
    });
  }, [router]);

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
      router.replace("../home");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "../home" },
    });
    setLoading(false);
    if (oauthError) setError(oauthError.message);
    // Supabase will redirect back to /home with session in localStorage
  };

  return (
    <div className="bg-[#46708D] h-screen flex flex-col justify-center items-center">
      <header className="mb-10 text-center">
        <Image src="/assets/frey-trade.png" alt="Logo" width={200} height={200} />
        <h1 className="text-4xl text-[#C4BB96] mt-4">FREY TRADE</h1>
      </header>

      <main className="w-80 flex flex-col items-center">
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleEmailSignIn} className="w-full flex flex-col">
          <input
            type="email"
            placeholder="E‑MAIL"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#A57730] py-2 rounded font-bold"
          >
            {loading ? "Signing in…" : "SIGN IN"}
          </button>
        </form>

        <div className="w-full border-t border-[#C4BB96] my-2" />

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-white flex items-center justify-center py-2 rounded font-bold w-full"
        >
          {loading ? "Redirecting…" : "SIGN IN WITH GOOGLE"}
          <Image
            src="/assets/7123025_logo_google_g_icon.png"
            alt="Google"
            width={24}
            height={24}
            className="ml-2"
          />
        </button>

        <div className="w-full border-t border-[#C4BB96] my-2" />

        <p className="text-[#C4BB96]">DON’T HAVE AN ACCOUNT?</p>
        <button
          onClick={() => router.push("/sign-up")}
          className="text-[#C4BB96] border-b mt-2"
        >
          SIGN UP
        </button>
        <div className="w-full border-t border-[#C4BB96] my-2" />
        <button
          onClick={() => router.push("/forgot-password")}
          className="text-[#C4BB96] border-b mt-2">
          FORGOT PASSWORD?
          </button>
      </main>
    </div>
  );
}
