/**
 * Next.js Middleware
 * Handles authentication, session management, and cache control
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Skip middleware entirely for login page and auth API to prevent redirect loops
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  const response = await updateSession(request);
  
  // Add cache control headers to prevent stale data
  // Use less aggressive caching to allow session cookies to work
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/bookings') ||
    request.nextUrl.pathname.startsWith('/clients') ||
    request.nextUrl.pathname.startsWith('/rooms') ||
    request.nextUrl.pathname.startsWith('/calendar')
  ) {
    // Less aggressive - allow private caching for session data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login page
     * - auth API routes
     * - Chrome DevTools
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|api/auth|\\.well-known).*)',
  ],
};
