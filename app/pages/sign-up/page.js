// app/pages/sign-up/page.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../_utils/supabase-client"; // Adjust the import path as necessary

export default function SignUp() {
  const router = useRouter();

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  // feedback
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // handle email/password sign-up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1) Sign up with Supabase Auth
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // you can store metadata here if you like
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2) Insert into your users table
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: user.id,               // use the same UUID
          email,
          first_name: "",            // collect later or extend form
          last_name: "",             // collect later or extend form
          security_question: securityQuestion,
          security_answer: securityAnswer,
        },
      ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // 3) Create an account record
    const { error: acctError } = await supabase
      .from("accounts")
      .insert([{ user_id: user.id }]);

    if (acctError) {
      setError(acctError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    // After sign-up, Supabase sends a magic link or verification email by default.
    router.replace("/"); 
  };

  // handle Google OAuth sign-up
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/oauth-callback" },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // on success, Supabase will redirect to your callback page where you can
    // insert into users/accounts just like above, using the session.user.id
  };

  return (
    <div className="bg-[#46708D] h-screen w-screen flex flex-col justify-center items-center">
      <header className="flex flex-col items-center mb-10 relative">
        <Image
          src="/assets/frey-trade.png"
          alt="Frey Trade Logo"
          width={200}
          height={200}
        />
        <h1 className="text-4xl text-[#C4BB96] absolute top-3/4 transform -translate-y-1/2 translate-x-8 w-75">
          FREY TRADE
        </h1>
      </header>

      <main className="flex flex-col items-center mb-30 w-80">
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSignUp} className="flex flex-col w-full">
          <input
            type="email"
            placeholder="E‑MAIL"
            className="p-2 mb-5 border-2 border-[#A57730] rounded-md text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            className="p-2 mb-5 border-2 border-[#A57730] rounded-md text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            placeholder="SECURITY QUESTION"
            className="p-2 mb-5 border-2 border-[#A57730] rounded-md text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            required
          />

          <input
            placeholder="SECURITY ANSWER"
            className="p-2 mb-5 border-2 border-[#A57730] rounded-md text-center text-[#C4BB96] placeholder:text-[#C4BB96]"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-[#A57730] text-black font-bold py-2 rounded-md"
            disabled={loading}
          >
            {loading ? "Signing up..." : "SIGN UP"}
          </button>
        </form>

        <div className="w-full border-t border-[#C4BB96] my-5" />

        <button
          onClick={handleGoogleSignUp}
          className="bg-white text-black font-bold py-2 rounded-md flex items-center justify-center w-80"
          disabled={loading}
        >
          {loading ? "Redirecting…" : "SIGN UP WITH GOOGLE"}
          <Image
            src="/assets/7123025_logo_google_g_icon.png"
            alt="Google Icon"
            width={24}
            height={24}
            className="ml-2"
          />
        </button>
      </main>
    </div>
  );
}