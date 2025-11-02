import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuthEvent, extractRequestContext } from '@/lib/audit/audit-logger';

export async function POST(request: Request) {
  try {
    const { event, session } = await request.json();

    const supabase = await createClient();

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (!session?.access_token || !session?.refresh_token) {
        console.error('Session sync: Missing tokens');
        return NextResponse.json({ error: 'Missing session tokens' }, { status: 400 });
      }

      // Set the session
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) {
        console.error('Session sync: Failed to set session', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Verify session was set correctly
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Session sync: Failed to verify user', userError);
        return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
      }

      console.log('Session sync: Success', { userId: user.id, email: user.email });

      // Log successful login to audit trail
      if (event === 'SIGNED_IN') {
        await logAuthEvent(
          'LOGIN',
          user.email || 'unknown',
          true,
          extractRequestContext(request)
        );
      }

      // Return success with user info (don't set cache headers on auth endpoint)
      const response = NextResponse.json({ 
        success: true, 
        userId: user.id,
        email: user.email 
      });
      
      return response;
    }

    if (event === 'SIGNED_OUT') {
      // Get user email before signing out
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown';
      
      await supabase.auth.signOut();
      console.log('Session sync: User signed out');
      
      // Log logout to audit trail
      await logAuthEvent(
        'LOGOUT',
        userEmail,
        true,
        extractRequestContext(request)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth session sync failed', error);
    return NextResponse.json({ error: 'Session sync failed' }, { status: 500 });
  }
}
