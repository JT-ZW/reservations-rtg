/**
 * Unauthorized Access Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          {user && (
            <p className="mt-1 text-xs text-gray-500">
              Current role: <span className="font-semibold">{user.role}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>If you believe this is an error, please contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}
