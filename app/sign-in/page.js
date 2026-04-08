"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase-client";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { signOut(auth); }, []);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        await setDoc(doc(db, "accounts", user.uid), { user_id: user.uid, balance: 10000 });
      }
      router.replace("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#3B82F6]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#06B6D4]/4 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0D1626] border border-[#1E3A5F]/50 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Image src="/assets/3384357_57661.svg" alt="Logo" width={48} height={48} priority />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#60A5FA] via-[#D4AF37] to-[#60A5FA] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
          <p className="text-[#475569] mt-2 text-sm">Trade smarter. Trade faster.</p>
        </div>

        {/* Card */}
        <div className="bg-[#0D1626]/70 backdrop-blur-2xl border border-[#1E3A5F]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.08)]">
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-6">Welcome back</h2>

          {error && (
            <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl text-[#FCA5A5] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[#60A5FA] hover:text-[#93C5FD] text-xs transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)] mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-[#1E3A5F]/60" />
            <span className="px-3 text-[#475569] text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#1E3A5F]/60" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 border border-[#1E3A5F] hover:bg-white/8 hover:border-[#3B82F6]/40 text-[#E2E8F0] font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm"
          >
            <Image src="/assets/7123025_logo_google_g_icon.png" alt="Google" width={18} height={18} />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-center mt-6 text-[#475569] text-sm">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/sign-up")}
              className="text-[#60A5FA] hover:text-[#93C5FD] font-medium transition-colors"
            >
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
