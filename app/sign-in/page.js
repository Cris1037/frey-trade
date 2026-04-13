"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/utils/firebase-client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { isValidPassword, getPasswordStrength, sanitize } from "@/utils/validation";

const googleProvider = new GoogleAuthProvider();

function PasswordRequirement({ met, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-[var(--clr-green)]" : "text-[var(--text-dim)]"}`}>
      <span>{met ? "✓" : "○"}</span>
      {label}
    </li>
  );
}

const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all text-sm";
const inputClassGold = "w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-gold)] focus:ring-1 focus:ring-[var(--clr-gold)]/30 transition-all text-sm";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "signup" ? "signup" : "signin");
  const [animating, setAnimating] = useState(false);

  // Sign in state
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [secQ, setSecQ] = useState("");
  const [secA, setSecA] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(suPassword);
  const passwordOk = isValidPassword(suPassword);

  useEffect(() => { signOut(auth); }, []);

  const switchTab = (next) => {
    if (next === tab || animating) return;
    setError(null);
    setAnimating(true);
    setTimeout(() => {
      setTab(next);
      setAnimating(false);
    }, 150);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, siEmail, siPassword);
      router.replace("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!passwordOk) {
      setError("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, suEmail, suPassword);
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        email: sanitize(suEmail),
        first_name: sanitize(firstName),
        last_name: sanitize(lastName),
        security_question: sanitize(secQ),
        security_answer: sanitize(secA),
      });
      await setDoc(doc(db, "accounts", user.uid), { user_id: user.uid, balance: 100000 });
      router.replace("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const nameParts = (user.displayName || "").split(" ");
        await setDoc(userRef, {
          email: user.email,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          security_question: "Google authenticated user",
          security_answer: "N/A",
        });
        await setDoc(doc(db, "accounts", user.uid), { user_id: user.uid, balance: 100000 });
      }
      router.replace("/home");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tab switcher */}
      <div className="flex bg-[var(--bg-surface)]/80 border border-[var(--clr-border)]/40 rounded-xl p-1 mb-5">
        <button
          onClick={() => switchTab("signin")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "signin"
              ? "bg-[var(--clr-blue)] text-white shadow-sm"
              : "text-[var(--text-dim)] hover:text-[var(--text-md)]"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchTab("signup")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "signup"
              ? "bg-[var(--clr-blue)] text-white shadow-sm"
              : "text-[var(--text-dim)] hover:text-[var(--text-md)]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Card */}
      <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)]">
        {error && (
          <div className="mb-5 p-3 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-xl text-[var(--clr-salmon)] text-sm">
            {error}
          </div>
        )}

        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(6px)" : "translateY(0)",
            transition: "opacity 150ms ease, transform 150ms ease",
          }}
        >
          {/* ── Sign In ── */}
          {tab === "signin" && (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-6">Welcome back</h2>
              <form onSubmit={handleSignIn} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className={inputClass}
                  value={siEmail}
                  onChange={(e) => setSiEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-[var(--clr-blue-lt)] text-xs transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-[var(--clr-border)]/60" />
                <span className="px-3 text-[var(--text-dim)] text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--clr-border)]/60" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full bg-white/5 border border-[var(--clr-border)] hover:bg-white/8 hover:border-[var(--clr-blue)]/40 text-[var(--text-hi)] font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm"
              >
                <Image src="/assets/7123025_logo_google_g_icon.png" alt="Google" width={18} height={18} />
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>
            </>
          )}

          {/* ── Sign Up ── */}
          {tab === "signup" && (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-hi)] mb-6">Create your account</h2>
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    maxLength={50}
                    className={inputClassGold.replace("w-full ", "")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    maxLength={50}
                    className={inputClassGold.replace("w-full ", "")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  maxLength={254}
                  className={inputClassGold}
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  required
                />
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    maxLength={128}
                    className={inputClassGold}
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    required
                  />
                  {suPassword.length > 0 && (
                    <ul className="mt-2 pl-1 space-y-1">
                      <PasswordRequirement met={strength.minLength} label="At least 8 characters" />
                      <PasswordRequirement met={strength.hasLetter} label="Contains a letter" />
                      <PasswordRequirement met={strength.hasNumber} label="Contains a number" />
                      <PasswordRequirement met={strength.hasSpecial} label="Contains a special character (bonus)" />
                    </ul>
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-[var(--text-dim)] text-xs mb-2 uppercase tracking-wider">Security question</p>
                  <input
                    placeholder="Your security question"
                    maxLength={200}
                    className={`${inputClassGold} mb-3`}
                    value={secQ}
                    onChange={(e) => setSecQ(e.target.value)}
                    required
                  />
                  <input
                    placeholder="Your answer"
                    maxLength={200}
                    className={inputClassGold}
                    value={secA}
                    onChange={(e) => setSecA(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !passwordOk}
                  className="w-full bg-gradient-to-r from-[var(--clr-gold)] to-[var(--clr-blue)] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)] mt-2"
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-[var(--clr-border)]/60" />
                <span className="px-3 text-[var(--text-dim)] text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--clr-border)]/60" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full bg-white/5 border border-[var(--clr-border)] hover:bg-white/8 hover:border-[var(--clr-gold)]/40 text-[var(--text-hi)] font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm"
              >
                <Image src="/assets/7123025_logo_google_g_icon.png" alt="Google" width={18} height={18} />
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden py-12">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[var(--clr-blue)]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--clr-gold)]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#06B6D4]/4 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-36 h-36 rounded-full bg-[var(--bg-surface)] border border-[var(--clr-border)]/50 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Image src="/assets/3384357_57661.svg" alt="Logo" width={128} height={128} priority />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--clr-blue-lt)] via-[var(--clr-gold)] to-[var(--clr-blue-lt)] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
          <p className="text-[var(--text-dim)] mt-2 text-sm">Trade smarter. Trade faster.</p>
        </div>

        <Suspense fallback={
          <div className="bg-[var(--bg-surface)]/70 backdrop-blur-2xl border border-[var(--clr-border)]/40 rounded-2xl p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
          </div>
        }>
          <AuthContent />
        </Suspense>
      </div>
    </div>
  );
}
