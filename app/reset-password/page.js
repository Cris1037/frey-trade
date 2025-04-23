// app/reset-password/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";

export default function ResetPassword() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading → ready
  const [session, setSession] = useState(null);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [providedAnswer, setProvidedAnswer] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 1) Consume the magic-link token and establish a session
  useEffect(() => {
    async function consumeLink() {
      const { data, error } = await supabase.auth.getSessionFromUrl({
        storeSession: true, // ensures it’s stored in localStorage
      });
      if (error || !data.session) {
        // invalid or expired link → back to sign-in
        router.replace("/sign-in");
        return;
      }
      setSession(data.session);
      setStatus("ready");
    }
    consumeLink();
  }, [router]);

  // 2) Once session is ready, fetch the user’s security question
  useEffect(() => {
    if (status !== "ready" || !session) return;

    async function loadQuestion() {
      const userId = session.user.id;
      const { data, error } = await supabase
        .from("users")
        .select("security_question, security_answer")
        .eq("id", userId)
        .single();

      if (error) {
        setError("Could not load security question.");
      } else {
        setSecurityQuestion(data.security_question);
        setSecurityAnswer(data.security_answer);
      }
    }
    loadQuestion();
  }, [status, session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (providedAnswer !== securityAnswer) {
      setError("Security answer is incorrect.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPwd,
    });
    if (updateErr) {
      setError(updateErr.message);
    } else {
      setMessage("Password updated! Redirecting to sign-in…");
      // clear session so they must sign in again
      await supabase.auth.signOut();
      router.replace("/sign-in");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#46708D]">
        <p className="text-[#C4BB96]">Verifying link…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
      <h1 className="text-2xl text-[#C4BB96] mb-4">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        {securityQuestion && (
          <>
            <p className="text-[#C4BB96] mb-2">{securityQuestion}</p>
            <input
              type="text"
              placeholder="Answer"
              className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
              value={providedAnswer}
              onChange={(e) => setProvidedAnswer(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
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
