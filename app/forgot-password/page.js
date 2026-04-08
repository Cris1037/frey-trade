"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/utils/firebase-client";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: email, 2: security question, 3: done
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [storedAnswer, setStoredAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("No account found with that email address.");
        return;
      }
      const userData = snap.docs[0].data();
      setSecurityQuestion(userData.security_question);
      setStoredAnswer(userData.security_answer);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (userAnswer.trim().toLowerCase() !== storedAnswer.trim().toLowerCase()) {
        setError("Incorrect answer. Please try again.");
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#3B82F6]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0D1626] border border-[#1E3A5F]/50 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Image src="/assets/3384357_57661.svg" alt="Logo" width={48} height={48} priority />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#60A5FA] via-[#D4AF37] to-[#60A5FA] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
        </div>

        <div className="bg-[#0D1626]/70 backdrop-blur-2xl border border-[#1E3A5F]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)]">

          {/* Step indicators */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-[#3B82F6] text-white"
                      : "bg-[#111D35] text-[#475569] border border-[#1E3A5F]"
                  }`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`h-px w-8 transition-all ${step > s ? "bg-[#3B82F6]" : "bg-[#1E3A5F]"}`} />}
                </div>
              ))}
              <span className="ml-2 text-[#475569] text-xs">
                {step === 1 ? "Enter email" : "Security check"}
              </span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-[#E2E8F0] mb-1">Forgot Password</h2>
              <p className="text-[#475569] text-sm mb-6">Enter your email to verify your identity.</p>

              {error && (
                <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl text-[#FCA5A5] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                >
                  {loading ? "Looking up…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Security question */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-[#E2E8F0] mb-1">Security Check</h2>
              <p className="text-[#475569] text-sm mb-6">Answer your security question to receive a reset link.</p>

              {error && (
                <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl text-[#FCA5A5] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <div className="bg-[#111D35] border border-[#1E3A5F]/50 rounded-xl px-4 py-3">
                  <p className="text-[#64748B] text-[11px] uppercase tracking-wider mb-1">Your security question</p>
                  <p className="text-[#E2E8F0] text-sm">{securityQuestion}</p>
                </div>
                <input
                  type="text"
                  placeholder="Your answer"
                  className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all text-sm"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                >
                  {loading ? "Verifying…" : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); setUserAnswer(""); }}
                  className="w-full text-[#475569] hover:text-[#94A3B8] text-sm transition-colors py-1"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#10B981]/10 border border-[#10B981]/25 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#E2E8F0] mb-2">Check your inbox</h2>
              <p className="text-[#475569] text-sm">
                A password reset link has been sent to{" "}
                <span className="text-[#60A5FA]">{email}</span>.
              </p>
            </div>
          )}

          <p className="text-center mt-6 text-[#475569] text-sm">
            Remember it?{" "}
            <button
              onClick={() => router.push("/sign-in")}
              className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
