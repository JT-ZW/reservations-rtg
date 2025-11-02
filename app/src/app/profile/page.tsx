'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/auth-context';
import Button from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setToast({ message: 'Password must be at least 8 characters long', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setToast({ message: error.message, type: 'error' });
        setLoading(false);
        return;
      }

      setToast({ message: 'Password updated successfully!', type: 'success' });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update password', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and password
          </p>
        </div>

        {/* User Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={user.full_name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 capitalize"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={user.phone || 'Not provided'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To update your name, email, or role, please contact your system administrator.
            </p>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm new password"
              />
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
                <ul className="space-y-1 text-sm">
                  <li className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-500'}>
                    {newPassword === confirmPassword && newPassword ? '✓' : '○'} Passwords match
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
