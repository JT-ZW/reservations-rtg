/**
 * Home Page - Root Route
 * Redirects to dashboard if authenticated, otherwise to login
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect based on authentication status
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
