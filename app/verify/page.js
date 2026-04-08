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
    <div className="bg-[#0D1626]/70 backdrop-blur-2xl border border-[#1E3A5F]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)] text-center">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
          <span className="text-[#475569] text-sm">Verifying your email…</span>
        </div>
      )}

      {status === "success" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-[#10B981]/10 border border-[#10B981]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-2">Email verified!</h2>
          <p className="text-[#475569] text-sm mb-6">{message}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
          >
            Go to Sign In
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-2">Verification failed</h2>
          <p className="text-[#475569] text-sm mb-6">{message}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="text-[#60A5FA] hover:text-[#93C5FD] text-sm font-medium transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#3B82F6]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#60A5FA] via-[#D4AF37] to-[#60A5FA] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
        </div>
        <Suspense fallback={
          <div className="bg-[#0D1626]/70 backdrop-blur-2xl border border-[#1E3A5F]/40 rounded-2xl p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
