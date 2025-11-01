/**
 * Dashboard Layout
 * Main layout with sidebar navigation and header
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/auth/auth-context';
import { signOut } from '@/lib/auth/auth-service';
import { useSessionTimeout } from '@/lib/auth/useSessionTimeout';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES, UserRole.FINANCE, UserRole.AUDITOR] },
  { name: 'Bookings', href: '/bookings', icon: '📅', roles: [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES] },
  { name: 'Calendar', href: '/calendar', icon: '🗓️', roles: [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES] },
  { name: 'Clients', href: '/clients', icon: '👥', roles: [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES] },
  { name: 'Rooms', href: '/rooms', icon: '🏢', roles: [UserRole.ADMIN, UserRole.RESERVATIONS] },
  { name: 'Reports', href: '/reports', icon: '📈', roles: [UserRole.ADMIN, UserRole.FINANCE, UserRole.AUDITOR] },
  { name: 'Documents', href: '/documents', icon: '📄', roles: [UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES] },
  { name: 'Settings', href: '/settings', icon: '⚙️', roles: [UserRole.ADMIN] },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Setup session timeout - 2 hours of inactivity
  useSessionTimeout(
    () => {
      setShowTimeoutWarning(true);
    },
    () => {
      router.push('/login?reason=timeout');
    }
  );

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredNavigation = !loading && user 
    ? navigation.filter(item => item.roles.includes(user.role as UserRole))
    : navigation; // Show all navigation while loading

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-['Century_Gothic',_sans-serif]">
      {/* Session timeout warning */}
      {showTimeoutWarning && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-brand-accent rounded-xl p-5 shadow-elevated max-w-md backdrop-blur-sm">
          <div className="flex items-start">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-amber-900">Session Expiring Soon</h3>
              <p className="mt-1 text-sm text-amber-800">
                Your session will expire in 5 minutes due to inactivity. Any activity will extend your session.
              </p>
            </div>
            <button
              onClick={() => setShowTimeoutWarning(false)}
              className="ml-3 shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-elevated transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo with gradient accent */}
        <div className="relative h-24 px-6 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rainbow-gradient"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white p-2 rounded-lg">
              <Image 
                src="/rtg-logo.png" 
                alt="Rainbow Towers Group" 
                width={140}
                height={50}
                className="w-auto h-12"
                priority
              />
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                style={isActive ? { backgroundColor: '#FCBF49', color: '#1D3557' } : {}}
                className={clsx(
                  'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'shadow-md hover:opacity-90'
                    : 'text-gray-700 bg-white hover:bg-gray-50 hover:text-brand-primary'
                )}
              >
                <span className={clsx(
                  "mr-3 text-xl transition-transform group-hover:scale-110",
                  isActive ? "opacity-100" : "opacity-70"
                )}>{item.icon}</span>
                <span className="font-semibold">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-brand-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {user && (
          <div className="border-t border-gray-100 p-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-accent to-yellow-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                  <span className="text-white font-bold text-base">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-600 truncate capitalize">
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="shrink-0 p-2 text-gray-400 hover:text-brand-danger hover:bg-red-50 rounded-lg transition-all"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm lg:hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rainbow-gradient"></div>
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">RT</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-brand-primary">Rainbow Towers</span>
              </div>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
