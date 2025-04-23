"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";

export default function ResetPassword() {
  const [phase, setPhase] = useState("verifying"); // verifying | ready | error
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function verifySession() {
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        setError("Invalid or expired recovery link.");
        setPhase("error");
      } else {
        setPhase("ready");
      }
    }

    verifySession();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPwd,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated! Redirecting...");
      setTimeout(() => {
        supabase.auth.signOut();
        router.replace("/sign-in");
      }, 2000);
    }
  };

  if (phase === "verifying") {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#46708D] text-[#C4BB96]">
        Verifying link...
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#46708D] text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
      <h1 className="text-2xl text-[#C4BB96] mb-4">Choose a new password</h1>
      <form onSubmit={handleReset} className="w-full max-w-sm">
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
          Reset Password
        </button>
      </form>
      {error && <p className="mt-4 text-red-400">{error}</p>}
      {message && <p className="mt-4 text-green-200">{message}</p>}
    </div>
  );
}
