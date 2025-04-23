// app/reset-password/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";

export default function ResetPassword() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading"); 
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [providedAnswer, setProvidedAnswer] = useState("");

  useEffect(() => {
    async function fetchSecurityQuestion() {
      const { data, error } = await supabase
        .from("users")
        .select("security_question, security_answer")
        .eq("id", supabase.auth.user()?.id)
        .single();

      if (error) {
        setError("Failed to fetch security question");
      } else {
        setSecurityQuestion(data.security_question);
        setSecurityAnswer(data.security_answer);
      }
    }

    fetchSecurityQuestion();
  }, []);

  

  useEffect(() => {
    async function attemptRecovery() {
      // Try to exchange the URL code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      if (!error) {
        // We have a session from the recovery link
        setPhase("ready");
      } else {
        // Not a valid recovery flow—kick them out
        router.replace("https://frey-trade.vercel.app/sign-in");
      }
    }

    attemptRecovery();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (providedAnswer !== securityAnswer) {
      setError("Security answer is incorrect");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPwd,
    });
    if (!updateError) {
      setMessage("Password updated! Redirecting to sign-in…");
      await supabase.auth.signOut();
      router.replace("/sign-in");
    } else {
      setError(updateError.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
      <h1 className="text-2xl text-[#C4BB96] mb-4">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <p>{securityQuestion}</p>
        <input
          type="text"
          placeholder="Security answer"
          className="w-300 p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={providedAnswer}
          onChange={(e) => setProvidedAnswer(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password"
          className="w-300 p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="w-300 p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96] placeholder-[#C4BB96]"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-300 bg-[#A57730] py-2 rounded font-bold text-black"
        >
          Reset password
        </button>
      </form>
      {error && <p className="mt-4 text-red-400">{error}</p>}
      {message && <p className="mt-4 text-green-200">{message}</p>}
    </div>
  );
}
