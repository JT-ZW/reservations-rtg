'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert } from '@/components/ui/Alert';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <Alert variant="error">
          You do not have permission to access this page. Admin access required.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Manage system settings and configuration
          </p>
        </div>

        {/* Admin Settings Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Card className="group p-7 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500" onClick={() => router.push('/admin/users')}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">User Management</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
          </Card>

          {/* Room Management */}
          <Card className="group p-7 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-green-500" onClick={() => router.push('/admin/rooms')}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">Room Management</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure rooms, capacity, and pricing
                </p>
              </div>
            </div>
          </Card>

          {/* Add-ons Management */}
          <Card className="group p-7 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-brand-accent" onClick={() => router.push('/admin/addons')}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-accent to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-accent transition-colors">Add-ons & Event Types</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Manage additional services and event categories
                </p>
              </div>
            </div>
          </Card>

          {/* Reports */}
          <Card className="group p-7 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-brand-secondary" onClick={() => router.push('/reports')}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-secondary transition-colors">Reports & Analytics</h3>
                <p className="mt-1 text-sm text-gray-600">
                  View system reports and analytics
                </p>
              </div>
            </div>
          </Card>

          {/* Documentation */}
          <Card className="group p-7 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-brand-success" onClick={() => window.open('/TECHNICAL_DOCS.md', '_blank')}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-success to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-success transition-colors">Documentation</h3>
                <p className="mt-1 text-sm text-gray-600">
                  System documentation and user guides
                </p>
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className="p-7 bg-gradient-to-br from-brand-accent/10 to-yellow-500/10 border-l-4 border-l-brand-accent">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-accent to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">System Information</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p><strong className="text-brand-primary">Version:</strong> 1.0.0</p>
                  <p><strong className="text-brand-primary">Environment:</strong> Development</p>
                  <p><strong className="text-brand-primary">Database:</strong> Supabase</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Current User Info */}
        <Card className="p-7 border-t-4 border-t-brand-primary shadow-elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm">👤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Current Session</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100">
              <p className="text-sm font-semibold text-gray-600 mb-1">Logged in as</p>
              <p className="text-lg font-bold text-gray-900">{user.full_name}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100">
              <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
              <p className="text-lg font-bold text-gray-900">{user.email}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100">
              <p className="text-sm font-semibold text-gray-600 mb-1">Role</p>
              <p className="text-lg font-bold text-brand-primary capitalize">{user.role}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-100">
              <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
              <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Active
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
