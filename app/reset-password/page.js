// app/reset-password/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";

export default function ResetPassword() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading"); // loading → ready
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function attemptRecovery() {
      // Try to exchange the URL code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        // Not a valid recovery flow—kick them out
        router.replace("/sign-in");
      } else {
        // We have a session from the recovery link
        setPhase("ready");
      }
    }

    attemptRecovery();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPwd,
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated! Redirecting to sign‑in…");
      setTimeout(() => router.replace("/sign-in"), 3000);
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
      <h1 className="text-2xl text-[#C4BB96] mb-4">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#A57730] py-2 rounded font-bold text-black"
        >
          Reset password
        </button>
      </form>
      {error && <p className="mt-4 text-red-400">{error}</p>}
      {message && <p className="mt-4 text-green-200">{message}</p>}
    </div>
  );
}
