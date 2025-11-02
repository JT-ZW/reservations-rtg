/**
 * Auth Context Provider
 * Manages authentication state across the application
 */

'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '@/types';
import { createClient } from '@/lib/supabase/client';

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
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

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
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('AuthProvider: refreshUser failed', error.message);
      setUser(null);
      return;
    }

    await loadUserProfile(data.user?.id ?? null);
  }, [supabase, loadUserProfile]);

  // Check session validity periodically
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('AuthProvider: Session invalid or expired, signing out');
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/login';
        return;
      }

      // Check if token will expire soon (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        
        if (expiresIn < 300) { // Less than 5 minutes
          console.log('AuthProvider: Token expiring soon, refreshing...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('AuthProvider: Failed to refresh session', refreshError);
            await supabase.auth.signOut();
            setUser(null);
            window.location.href = '/login';
          }
        }
      }
    } catch (error) {
      console.error('AuthProvider: Session check failed', error);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const initialise = async () => {
      console.log('AuthProvider: Starting initialization');
      setLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          console.log('AuthProvider: Component unmounted, aborting');
          return;
        }

        if (error) {
          console.error('AuthProvider: getSession error', error.message);
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('AuthProvider: Got session', { 
          hasSession: !!data.session, 
          userId: data.session?.user?.id 
        });

        if (data.session) {
          await syncSessionWithServer('SIGNED_IN', data.session);
          console.log('AuthProvider: Session synced with server');
        }

        await loadUserProfile(data.session?.user?.id ?? null);
        console.log('AuthProvider: User profile loaded', { userId: data.session?.user?.id });
        
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
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setLoading(false);
        window.location.href = '/login';
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('AuthProvider: Token refreshed successfully');
      }

      await syncSessionWithServer(event, session);
      await loadUserProfile(session?.user?.id ?? null);
      setLoading(false);
    });

    // Set up periodic session check (every 2 minutes)
    const interval = setInterval(checkSessionValidity, 120000);
    setSessionCheckInterval(interval);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [supabase, loadUserProfile, syncSessionWithServer, checkSessionValidity]);

  const handleSignOut = async () => {
    // Clear session check interval
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      setSessionCheckInterval(null);
    }
    
    await supabase.auth.signOut();
    setUser(null);
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
