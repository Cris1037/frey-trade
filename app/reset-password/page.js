"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/utils/firebase-client";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [phase, setPhase] = useState("verifying"); // verifying | ready | done | error
  const [email, setEmail] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing reset link. Please request a new one.");
      setPhase("error");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setPhase("ready");
      })
      .catch(() => {
        setError("This reset link is invalid or has expired.");
        setPhase("error");
      });
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    if (newPwd.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPwd);
      setPhase("done");
      setTimeout(() => router.replace("/sign-in"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)]">

      {phase === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-8 h-8 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
          <span className="text-[var(--text-dim)] text-sm">Verifying link…</span>
        </div>
      )}

      {phase === "error" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--clr-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-2">Link invalid</h2>
          <p className="text-[var(--text-dim)] text-sm mb-5">{error}</p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="text-[var(--clr-blue-lt)] hover:text-[var(--clr-blue-lt)] text-sm font-medium transition-colors"
          >
            Request a new link →
          </button>
        </div>
      )}

      {phase === "ready" && (
        <>
          <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-1">Reset Password</h2>
          <p className="text-[var(--text-dim)] text-sm mb-6">
            Setting new password for <span className="text-[var(--clr-blue-lt)]">{email}</span>
          </p>

          {error && (
            <div className="mb-5 p-3 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-xl text-[var(--clr-salmon)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all text-sm"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all text-sm"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            >
              {loading ? "Updating…" : "Reset Password"}
            </button>
          </form>
        </>
      )}

      {phase === "done" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[var(--clr-green)]/10 border border-[var(--clr-green)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--clr-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-2">Password updated!</h2>
          <p className="text-[var(--text-dim)] text-sm">Redirecting you to sign in…</p>
        </div>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[var(--clr-blue)]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--clr-gold)]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--clr-blue-lt)] via-[var(--clr-gold)] to-[var(--clr-blue-lt)] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
        </div>
        <Suspense fallback={
          <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
