/**
 * Supabase Admin Client - Service role client for admin operations
 * Used for operations that require elevated permissions like creating users
 * IMPORTANT: Only use in server-side code (API routes, server components)
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Create an admin client with service role key
 * This client bypasses RLS policies and has full database access
 * Use with caution and only for legitimate admin operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
