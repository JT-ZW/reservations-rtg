/**
 * Custom hooks for authentication and authorization
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { UserRole } from '@/types';
import { ROLE_PERMISSIONS } from './server-auth';

/**
 * Require authentication - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}

/**
 * Require specific role
 */
export function useRequireRole(role: UserRole) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== role) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, role, router]);

  return { user, loading };
}

/**
 * Require any of specified roles
 */
export function useRequireAnyRole(roles: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!roles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, roles, router]);

  return { user, loading };
}

/**
 * Check if user has permission
 */
export function usePermission(permission: keyof typeof ROLE_PERMISSIONS[UserRole]) {
  const { user } = useAuth();

  if (!user) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[user.role as UserRole];
  return permissions?.[permission] ?? false;
}

/**
 * Check if user is admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === UserRole.ADMIN;
}

/**
 * Get user role
 */
export function useUserRole() {
  const { user } = useAuth();
  return user?.role;
}
