// app/_utils/secure-route.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase-client';

export default function SecureRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        router.replace('/sign-in');
      }
    };

    checkAuth();
  }, [router]);

  return children;
}