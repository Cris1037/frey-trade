// // app/reset-password/page.jsx
// "use client";

// export const dynamic = "force-dynamic";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "../_utils/supabase-client";

// export default function ResetPassword() {
//   const router = useRouter();
//   const [phase, setPhase] = useState("verifying"); // verifying | ready | error
//   const [session, setSession] = useState(null);
//   const [securityQuestion, setSecurityQuestion] = useState("");
//   const [securityAnswer, setSecurityAnswer] = useState("");
//   const [providedAnswer, setProvidedAnswer] = useState("");
//   const [newPwd, setNewPwd] = useState("");
//   const [confirmPwd, setConfirmPwd] = useState("");
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     async function verifyLink() {
//       try {
//         const { data, error } = await supabase.auth.exchangeCodeForSession();
//         console.log("Recovery result:", result);
//         const { data: { session }, error } = result;
//         if (error || !session) throw error || new Error("No session found");
//         setSession(session);
//         setPhase("ready");
//       } catch (err) {
//         console.error("Link verification failed:", err);
//         setError("Invalid or expired recovery link.");
//         setPhase("error");
//       }
//     }
  
//     verifyLink();
//   }, []);

//   useEffect(() => {
//     if (phase !== "ready" || !session) return;
//     async function loadQuestion() {
//       const { data, error } = await supabase
//         .from("users")
//         .select("security_question, security_answer")
//         .eq("id", session.user.id)
//         .single();
//       if (error) {
//         console.error("Load question error:", error);
//         setError("Failed to load security question.");
//       } else {
//         setSecurityQuestion(data.security_question);
//         setSecurityAnswer(data.security_answer);
//       }
//     }
//     loadQuestion();
//   }, [phase, session]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     if (providedAnswer !== securityAnswer) {
//       setError("Security answer is incorrect.");
//       return;
//     }
//     if (newPwd !== confirmPwd) {
//       setError("Passwords do not match.");
//       return;
//     }
//     const { error: updateErr } = await supabase.auth.updateUser({
//       password: newPwd,
//     });
//     if (updateErr) {
//       setError(updateErr.message);
//     } else {
//       setMessage("Password updated! Redirecting…");
//       await supabase.auth.signOut();
//       setTimeout(() => router.replace("/sign-in"), 2000);
//     }
//   };

//   if (phase === "verifying")
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#46708D]">
//         <p className="text-[#C4BB96]">Verifying link…</p>
//       </div>
//     );
//   if (phase === "error")
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#46708D]">
//         <p className="text-red-400">{error}</p>
//       </div>
//     );

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-[#46708D] p-4">
//       <h1 className="text-2xl text-[#C4BB96] mb-4">Reset Your Password</h1>
//       <form onSubmit={handleSubmit} className="w-full max-w-sm">
//         {securityQuestion && (
//           <>
//             <p className="text-[#C4BB96] mb-2">{securityQuestion}</p>
//             <input
//               type="text"
//               placeholder="Answer"
//               className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
//               value={providedAnswer}
//               onChange={(e) => setProvidedAnswer(e.target.value)}
//               required
//             />
//           </>
//         )}
//         <input
//           type="password"
//           placeholder="New password"
//           className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
//           value={newPwd}
//           onChange={(e) => setNewPwd(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Confirm password"
//           className="w-full p-3 rounded border-2 border-[#A57730] mb-4 text-center text-[#C4BB96]"
//           value={confirmPwd}
//           onChange={(e) => setConfirmPwd(e.target.value)}
//           required
//         />
//         <button
//           type="submit"
//           className="w-full bg-[#A57730] py-2 rounded font-bold text-black"
//         >
//           Reset Password
//         </button>
//       </form>
//       {error && <p className="mt-4 text-red-400">{error}</p>}
//       {message && <p className="mt-4 text-green-200">{message}</p>}
//     </div>
//   );
// }
