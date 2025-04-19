// app/home/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
      } else {
        setSession(session);
        setLoading(false);
      }
    });

    // Subscribe to auth changes (e.g. sign out elsewhere)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/sign-in");
        } else {
          setSession(session);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [router]);

  // e.g. in your /app/home/page.jsx client component
useEffect(() => {
  // Listen for auth changes
  const { data: listener } = supabase.auth.onAuthStateChange(
    
    async (event, session) => {
      if (event === 'SIGNED_IN') {
        const { user, error: fetchError } = session;
        if (fetchError) return console.error(fetchError);
        
        
        // Check if user exists in public.users
        const { data, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

          // const { data: { session } } = await supabase.auth.getSession();
          // if (session) {
          //   await fetch("/api/users", {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({ user: session.user }),
          //   });
          //   // then redirect to /home or render dashboard
          // }

        if (selectError && selectError.code === 'PGRST116') {
          // not found, so insert
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              first_name: user.user_metadata.full_name?.split(' ')[0] || '',
              last_name: user.user_metadata.full_name?.split(' ')[1] || '',
            });
          if (insertError) console.error(insertError);
        }
      }
    }
  );

  return () => listener.subscription.unsubscribe();
}, []);

useEffect(() => {
  const handleUserSync = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      
      if (!res.ok) throw new Error('Sync failed');
    } catch (err) {
      console.error('User sync error:', err);
    }
  };

  handleUserSync();
}, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 flex flex-col items-start">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {session.user.email}!</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white py-1 px-3 rounded"
        >
          Sign Out
        </button>
      </div>

      {/* Your dashboard content goes here */}
      <p>Your portfolio and trades will appear below.</p>
    </div>
  );
}
