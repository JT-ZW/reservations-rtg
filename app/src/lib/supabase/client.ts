/**
 * Supabase Client - Browser-side client
 * Used for client components and browser interactions
 * Configured with proper session management
 */

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Session will expire after 24 hours of inactivity
        storageKey: 'sb-auth-token',
      },
    }
  );
}

