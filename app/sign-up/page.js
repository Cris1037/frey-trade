
//app/sign-up/page.js
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase-client";

export default function SignUp() {
  const router = useRouter();
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secQ, setSecQ] = useState("");
  const [secA, setSecA] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1) Supabase Auth signUp
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("../home");
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "../home" },
    });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="bg-[#46708D] h-screen flex flex-col justify-center items-center">
      <header className="mb-10 text-center">
        <Image src="/assets/frey-trade.png" alt="Logo" width={200} height={200} />
        <h1 className="text-4xl text-[#C4BB96] mt-4">FREY TRADE</h1>
      </header>

      <main className="w-80 flex flex-col items-center">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSignUp} className="w-full flex flex-col">
          <input
            type="text"
            placeholder="FIRST NAME"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="LAST NAME"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
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
          <input
            placeholder="SECURITY QUESTION"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={secQ}
            onChange={(e) => setSecQ(e.target.value)}
            required
          />
          <input
            placeholder="SECURITY ANSWER"
            className="p-2 mb-4 border-2 border-[#A57730] rounded text-center text-[#C4BB96]"
            value={secA}
            onChange={(e) => setSecA(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#A57730] py-2 rounded font-bold"
          >
            {loading ? "Signing up…" : "SIGN UP"}
          </button>
        </form>

        <div className="w-full border-t border-[#C4BB96] my-5" />

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="bg-white flex items-center justify-center py-2 rounded font-bold w-full"
        >
          {loading ? "Redirecting…" : "SIGN UP WITH GOOGLE"}
          <Image
            src="/assets/7123025_logo_google_g_icon.png"
            alt="Google"
            width={24}
            height={24}
            className="ml-2"
          />
        </button>
      </main>
    </div>
  );
}
