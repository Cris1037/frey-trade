"use client";

import { useState } from "react";
import Image from "next/image";

import { supabase } from "../_utils/supabase-client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://frey-trade.vercel.app/reset-password',
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "If that email exists, you’ll receive a reset link in your inbox."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
        <header className="mb-10 text-center">
      <Image src="/assets/frey-trade.png" alt="Logo" width={200} height={200} />
      </header>
      <h1 className="text-2xl text-[#C4BB96] mb-6">Forgot your password?</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#A57730] py-2 rounded font-bold text-black"
        >
          Send reset link
        </button>
      </form>
      {message && <p className="mt-4 text-green-200">{message}</p>}
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}