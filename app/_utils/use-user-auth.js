import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export const useUserAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  return { user };
};