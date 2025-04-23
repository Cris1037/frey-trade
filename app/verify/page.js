"use client";
import { useEffect, useState } from "react";
import { supabase } from "../_utils/supabase-client";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying…");

  useEffect(() => {
    async function confirm() {
      // This will read the ?type=signup token but NOT log you in
      const { error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        setStatus("Verification failed or link expired.");
      } else {
        setStatus("Email verified! You may now sign in.");
      }
    }
    confirm();
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl mb-4">{status}</h1>
      {status.startsWith("Email verified") && (
        <button onClick={() => router.push("/sign-in")}>
          Go to Sign In
        </button>
      )}
    </div>
  );
}