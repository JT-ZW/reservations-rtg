/**
 * Server-side authentication utilities
 * For use in Server Components and API Routes
 */

import { createClient } from '@/lib/supabase/server';
import { User, UserRole } from '@/types';
import { redirect } from 'next/navigation';

/**
 * Get current user from server session
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return null;
  }

  return userProfile as unknown as User;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.is_active) {
    redirect('/login?error=account-inactive');
  }

  return user;
}

/**
 * Require specific role - redirects if user doesn't have role
 */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireAuth();

  if (user.role !== role) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Require any of specified roles
 */
export async function requireAnyRole(roles: UserRole[]): Promise<User> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User> {
  return requireRole(UserRole.ADMIN);
}

/**
 * Check if user has permission
 */
export async function hasPermission(permission: keyof typeof ROLE_PERMISSIONS[UserRole]): Promise<boolean> {
  const user = await getServerUser();

  if (!user) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[user.role as UserRole];
  return permissions?.[permission] ?? false;
}

/**
 * Role permissions map
 */
const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageRooms: true,
    canManageBookings: true,
    canViewReports: true,
    canViewLogs: true,
    canManageFinance: true,
    canGenerateDocuments: true,
  },
  [UserRole.RESERVATIONS]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: true,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: false,
    canGenerateDocuments: true,
  },
  [UserRole.SALES]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: false,
    canGenerateDocuments: true,
  },
  [UserRole.FINANCE]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: true,
    canGenerateDocuments: true,
  },
  [UserRole.AUDITOR]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: true,
    canManageFinance: false,
    canGenerateDocuments: false,
  },
} as const;

export { ROLE_PERMISSIONS };
