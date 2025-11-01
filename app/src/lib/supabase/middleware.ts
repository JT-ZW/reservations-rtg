/**
 * Supabase Middleware Client
 * Handles session refresh in middleware
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Try to refresh/get the session first
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Log session check for debugging
  console.log('Middleware session check:', { 
    path: request.nextUrl.pathname, 
    hasSession: !!session,
    userId: session?.user?.id 
  });

  // Get user for authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated and trying to access protected routes
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    console.log('Middleware: No user found, redirecting to login from:', request.nextUrl.pathname);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user exists, log success
  if (user) {
    console.log('Middleware: User authenticated', { userId: user.id, path: request.nextUrl.pathname });
  }

  return supabaseResponse;
}
