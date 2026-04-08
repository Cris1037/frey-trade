"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase-client";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { isValidPassword, getPasswordStrength, sanitize } from "@/utils/validation";

const googleProvider = new GoogleAuthProvider();

function PasswordRequirement({ met, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-[#10B981]" : "text-[#475569]"}`}>
      <span>{met ? "✓" : "○"}</span>
      {label}
    </li>
  );
}

export default function SignUp() {
  const router = useRouter();
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secQ, setSecQ] = useState("");
  const [secA, setSecA] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordOk = isValidPassword(password);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!passwordOk) {
      setError("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        email: sanitize(email),
        first_name: sanitize(first_name),
        last_name: sanitize(last_name),
        security_question: sanitize(secQ),
        security_answer: sanitize(secA),
      });
      await setDoc(doc(db, "accounts", user.uid), { user_id: user.uid, balance: 10000 });
      router.replace("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] relative overflow-hidden py-12">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#3B82F6]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0D1626] border border-[#1E3A5F]/50 mb-4 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <Image src="/assets/3384357_57661.svg" alt="Logo" width={48} height={48} priority />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#60A5FA] to-[#D4AF37] bg-clip-text text-transparent">
            FREY TRADE
          </h1>
          <p className="text-[#475569] mt-2 text-sm">Start trading with $10,000 virtual cash</p>
        </div>

        {/* Card */}
        <div className="bg-[#0D1626]/70 backdrop-blur-2xl border border-[#1E3A5F]/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(212,175,55,0.08)]">
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-6">Create your account</h2>

          {error && (
            <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl text-[#FCA5A5] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First name"
                maxLength={50}
                className="bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last name"
                maxLength={50}
                className="bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email address"
              maxLength={254}
              className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password + strength */}
            <div>
              <input
                type="password"
                placeholder="Password"
                maxLength={128}
                className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <ul className="mt-2 pl-1 space-y-1">
                  <PasswordRequirement met={strength.minLength} label="At least 8 characters" />
                  <PasswordRequirement met={strength.hasLetter} label="Contains a letter" />
                  <PasswordRequirement met={strength.hasNumber} label="Contains a number" />
                  <PasswordRequirement met={strength.hasSpecial} label="Contains a special character (bonus)" />
                </ul>
              )}
            </div>

            <div className="pt-1">
              <p className="text-[#475569] text-xs mb-2 uppercase tracking-wider">Security question</p>
              <input
                placeholder="Your security question"
                maxLength={200}
                className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm mb-3"
                value={secQ}
                onChange={(e) => setSecQ(e.target.value)}
                required
              />
              <input
                placeholder="Your answer"
                maxLength={200}
                className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-4 py-3 text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-sm"
                value={secA}
                onChange={(e) => setSecA(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !passwordOk}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#3B82F6] text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(212,175,55,0.25)] mt-2"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-[#1E3A5F]/60" />
            <span className="px-3 text-[#475569] text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#1E3A5F]/60" />
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-white/5 border border-[#1E3A5F] hover:bg-white/8 hover:border-[#D4AF37]/40 text-[#E2E8F0] font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm"
          >
            <Image src="/assets/7123025_logo_google_g_icon.png" alt="Google" width={18} height={18} />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-center mt-6 text-[#475569] text-sm">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/sign-in")}
              className="text-[#D4AF37] hover:text-[#F0C040] font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
