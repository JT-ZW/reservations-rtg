/**
 * Authentication Service
 * Handles login, logout, signup, and session management
 */

import { createClient } from '@/lib/supabase/client';
import { User, UserRole } from '@/types';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  try {
    console.log('SignIn: Step 1 - Creating client');
    const supabase = createClient();

    // Step 1: Authenticate
    console.log('SignIn: Step 2 - Calling signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    console.log('SignIn: Step 3 - signInWithPassword returned');

    if (error) {
      console.error('SignIn: Auth error:', error.message);
      await logAuthActivity({
        email: credentials.email,
        action: 'failed_login',
        success: false,
        failureReason: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      console.log('SignIn: Step 4 - No user in response');
      return {
        success: false,
        error: 'No user returned from authentication',
      };
    }

    console.log('SignIn: Step 5 - Auth successful, user ID:', data.user.id);

    // Step 2: Get user profile with timeout
    console.log('SignIn: Step 6 - Starting profile fetch');
    const profilePromise = supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    );

    let userProfile;
    let profileError;

    try {
      console.log('SignIn: Step 7 - Waiting for profile (5s timeout)');
      const result = await Promise.race([profilePromise, timeoutPromise]);
      console.log('SignIn: Step 8 - Profile fetch completed');
      userProfile = (result as { data: unknown; error: unknown }).data;
      profileError = (result as { data: unknown; error: unknown }).error;
    } catch {
      console.error('SignIn: Profile fetch timed out');
      return {
        success: false,
        error: 'Profile fetch timed out. Please try again.',
      };
    }

    console.log('SignIn: Step 9 - Checking profile data');

    if (profileError || !userProfile) {
      const errorMsg = profileError && typeof profileError === 'object' && 'message' in profileError 
        ? (profileError as { message: string }).message 
        : 'No profile data';
      console.error('SignIn: Profile error:', errorMsg);
      return {
        success: false,
        error: 'User profile not found. Please contact administrator.',
      };
    }

    console.log('SignIn: Profile loaded successfully');

    const user = userProfile as unknown as User;

    // Check if user is active
    if (!user.is_active) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact administrator.',
      };
    }

    // Log successful login
    await logAuthActivity({
      email: credentials.email,
      userId: data.user.id,
      action: 'login',
      success: true,
    });

    console.log('SignIn: Complete, returning success');
    return {
      success: true,
      user: user,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during sign in',
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Log logout
    if (user) {
      await logAuthActivity({
        email: user.email || '',
        userId: user.id,
        action: 'logout',
        success: true,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during sign out',
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('getCurrentUser: Profile error:', profileError?.message);
      return null;
    }

    return userProfile as unknown as User;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Log password reset request
    await logAuthActivity({
      email,
      action: 'password_reset',
      success: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'No authenticated user',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Log password change
    await logAuthActivity({
      email: user.email || '',
      userId: user.id,
      action: 'password_change',
      success: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Log authentication activity
 */
async function logAuthActivity(params: {
  email: string;
  userId?: string;
  action: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'password_change';
  success: boolean;
  failureReason?: string;
}) {
  try {
    const supabase = createClient();

    await supabase.from('auth_activity_log').insert({
      user_id: params.userId || null,
      email: params.email,
      action: params.action,
      success: params.success,
      failure_reason: params.failureReason || null,
      ip_address: null, // Will be set by server in production
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    });
  } catch (error) {
    // Don't fail auth operations if logging fails
    console.error('Failed to log auth activity:', error);
  }
}
