'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

function UsersPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'reservations',
    phone: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users?limit=100');
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    if (searchParams.get('action') === 'new') {
      setShowCreateModal(true);
    }
  }, [searchParams, fetchUsers]);

  useEffect(() => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          email: '',
          full_name: '',
          role: 'reservations',
          phone: '',
          password: '',
        });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'manager': return 'warning';
      case 'sales': return 'success';
      case 'finance': return 'info';
      default: return 'default';
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <Alert variant="error">
          You do not have permission to access this page. Admin access required.
        </Alert>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/admin')}>
            ← Back to Admin
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Create New User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="reservations">Reservations</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Users ({filteredUsers.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'success' : 'default'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.is_active ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching the current filters.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="reservations">Reservations</option>
                  <option value="sales">Sales</option>
                  <option value="finance">Finance</option>
                  <option value="auditor">Auditor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  );
}
