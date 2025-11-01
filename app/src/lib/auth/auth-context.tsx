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

      await syncSessionWithServer(event, session);
      await loadUserProfile(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile, syncSessionWithServer]);

  const handleSignOut = async () => {
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
