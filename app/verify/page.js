"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../_utils/firebase-client";
import { applyActionCode } from "firebase/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    if (!oobCode) {
      setMessage("Invalid or missing verification link.");
      setStatus("error");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setMessage("Your email has been verified.");
        setStatus("success");
      })
      .catch(() => {
        setMessage("Verification failed or link has expired.");
        setStatus("error");
      });
  }, [searchParams]);

  return (
    <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)] text-center">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-8 h-8 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
          <span className="text-[var(--text-dim)] text-sm">Verifying your email…</span>
        </div>
      )}

      {status === "success" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-[var(--clr-green)]/10 border border-[var(--clr-green)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--clr-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-2">Email verified!</h2>
          <p className="text-[var(--text-dim)] text-sm mb-6">{message}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
          >
            Go to Sign In
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--clr-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-2">Verification failed</h2>
          <p className="text-[var(--text-dim)] text-sm mb-6">{message}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="text-[var(--clr-blue-lt)] hover:text-[var(--clr-blue-lt)] text-sm font-medium transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmail() {
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
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
