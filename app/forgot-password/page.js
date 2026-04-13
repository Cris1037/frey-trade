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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[var(--clr-blue)]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--clr-gold)]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--bg-surface)] border border-[var(--clr-border)]/50 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Image src="/assets/3384357_57661.svg" alt="Logo" width={48} height={48} priority />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--clr-blue-lt)] via-[var(--clr-gold)] to-[var(--clr-blue-lt)] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
        </div>

        <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)]">

          {/* Step indicators */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-[var(--clr-blue)] text-white"
                      : "bg-[var(--bg-input)] text-[var(--text-dim)] border border-[var(--clr-border)]"
                  }`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`h-px w-8 transition-all ${step > s ? "bg-[var(--clr-blue)]" : "bg-[var(--clr-border)]"}`} />}
                </div>
              ))}
              <span className="ml-2 text-[var(--text-dim)] text-xs">
                {step === 1 ? "Enter email" : "Security check"}
              </span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-1">Forgot Password</h2>
              <p className="text-[var(--text-dim)] text-sm mb-6">Enter your email to verify your identity.</p>

              {error && (
                <div className="mb-5 p-3 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-xl text-[var(--clr-salmon)] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                >
                  {loading ? "Looking up…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Security question */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-1">Security Check</h2>
              <p className="text-[var(--text-dim)] text-sm mb-6">Answer your security question to receive a reset link.</p>

              {error && (
                <div className="mb-5 p-3 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-xl text-[var(--clr-salmon)] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <div className="bg-[var(--bg-input)] border border-[var(--clr-border)]/50 rounded-xl px-4 py-3">
                  <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">Your security question</p>
                  <p className="text-[var(--text-hi)] text-sm">{securityQuestion}</p>
                </div>
                <input
                  type="text"
                  placeholder="Your answer"
                  className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all text-sm"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                >
                  {loading ? "Verifying…" : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); setUserAnswer(""); }}
                  className="w-full text-[var(--text-dim)] hover:text-[var(--text-md)] text-sm transition-colors py-1"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[var(--clr-green)]/10 border border-[var(--clr-green)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--clr-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-2">Check your inbox</h2>
              <p className="text-[var(--text-dim)] text-sm">
                A password reset link has been sent to{" "}
                <span className="text-[var(--clr-blue-lt)]">{email}</span>.
              </p>
            </div>
          )}

          <p className="text-center mt-6 text-[var(--text-dim)] text-sm">
            Remember it?{" "}
            <button
              onClick={() => router.push("/sign-in")}
              className="text-[var(--clr-blue-lt)] hover:text-[var(--clr-blue-lt)] font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
