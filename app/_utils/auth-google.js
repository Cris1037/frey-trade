// pages/api/auth/[...supabase].js
import { handleAuth } from '@supabase/supabase-auth-helpers/nextjs';

export default handleAuth({
  providers: ['google'],
});