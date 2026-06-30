/**
 * Auth Context Provider
 * Manages authentication state across the application
 */

'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useSessionTimeout } from '@/lib/auth/useSessionTimeout';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncSessionWithServer = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event, session }),
      });
    } catch (error) {
      console.error('AuthProvider: failed to sync session', error);
    }
  }, []);

  const handleSessionExpired = useCallback(async (reason = 'expired') => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('AuthProvider: failed to sign out after session expiry', error);
    }

    setUser(null);
    setLoading(false);

    if (typeof window !== 'undefined') {
      window.location.assign(`/login?reason=${reason}`);
    }
  }, [supabase]);

  const loadUserProfile = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        setUser(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('AuthProvider: failed to load user profile', error?.message);
        setUser(null);
        return;
      }

      setUser(data as unknown as User);
    },
    [supabase]
  );

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser) {
      console.error('AuthProvider: refreshUser failed', error?.message);
      await handleSessionExpired('expired');
      return;
    }

    await loadUserProfile(authUser.id);
  }, [supabase, loadUserProfile, handleSessionExpired]);

  // Check session validity periodically
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !authUser) {
        console.log('AuthProvider: Session invalid or expired, signing out');
        await handleSessionExpired('expired');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        await handleSessionExpired('expired');
        return;
      }

      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);

        if (expiresIn < 60) {
          console.log('AuthProvider: Token expiring soon, refreshing...');
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('AuthProvider: Failed to refresh session', refreshError);
            await handleSessionExpired('refresh_failed');
          }
        }
      }
    } catch (error) {
      console.error('AuthProvider: Session check failed', error);
    }
  }, [supabase, handleSessionExpired]);

  useEffect(() => {
    let isMounted = true;

    const initialise = async () => {
      console.log('AuthProvider: Starting initialization');
      setLoading(true);
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) {
          console.log('AuthProvider: Component unmounted, aborting');
          return;
        }

        if (sessionError) {
          console.error('AuthProvider: getSession error', sessionError.message);
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (userError || !authUser) {
          console.log('AuthProvider: No authenticated user found');
          await handleSessionExpired('expired');
          return;
        }

        console.log('AuthProvider: Got authenticated user', { userId: authUser.id });

        if (session) {
          await syncSessionWithServer('SIGNED_IN', session);
          console.log('AuthProvider: Session synced with server');
        }

        await loadUserProfile(authUser.id);
        console.log('AuthProvider: User profile loaded', { userId: authUser.id });
        
      } catch (error) {
        console.error('AuthProvider: Initialization error', error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('AuthProvider: Initialization complete');
      }
    };

    initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      console.log('AuthProvider: Auth state changed', { event, hasSession: !!session });

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        await handleSessionExpired('signed_out');
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('AuthProvider: Token refreshed successfully');
      }

      await syncSessionWithServer(event, session);

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        await handleSessionExpired('expired');
        return;
      }

      await loadUserProfile(authUser.id);
      setLoading(false);
    });

    // Set up periodic session check (every 60 seconds)
    const interval = setInterval(() => {
      void checkSessionValidity();
    }, 60000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [supabase, loadUserProfile, syncSessionWithServer, checkSessionValidity, handleSessionExpired]);

  useSessionTimeout(undefined, handleSessionExpired);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
