'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert } from '@/components/ui/Alert';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  activeRooms: number;
  totalAddons: number;
  totalEventTypes: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRooms: 0,
    activeRooms: 0,
    totalAddons: 0,
    totalEventTypes: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch stats from various endpoints
      const [usersRes, roomsRes, addonsRes, eventTypesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/rooms'),
        fetch('/api/addons'),
        fetch('/api/event-types'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.data || [];
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: users.filter((u: { is_active: boolean }) => u.is_active).length,
        }));
      }

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        const rooms = roomsData.data || [];
        setStats(prev => ({
          ...prev,
          totalRooms: rooms.length,
          activeRooms: rooms.filter((r: { is_available: boolean }) => r.is_available).length,
        }));
      }

      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        const addons = addonsData.data || [];
        setStats(prev => ({ ...prev, totalAddons: addons.length }));
      }

      if (eventTypesRes.ok) {
        const eventTypesData = await eventTypesRes.json();
        const eventTypes = eventTypesData.data || [];
        setStats(prev => ({ ...prev, totalEventTypes: eventTypes.length }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: '👥',
      path: '/admin/users',
      stats: `${stats.activeUsers} active users`,
    },
    {
      title: 'Room Management',
      description: 'Configure rooms, capacities, and rates',
      icon: '🏢',
      path: '/admin/rooms',
      stats: `${stats.activeRooms} active rooms`,
    },
    {
      title: 'Add-ons Management',
      description: 'Manage additional services and equipment',
      icon: '🎯',
      path: '/admin/addons',
      stats: `${stats.totalAddons} add-ons`,
    },
    {
      title: 'Event Types',
      description: 'Configure event categories and types',
      icon: '📅',
      path: '/admin/event-types',
      stats: `${stats.totalEventTypes} types`,
    },
  ];

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and users</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">{stats.activeUsers} active</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRooms}</p>
                <p className="text-sm text-green-600 mt-1">{stats.activeRooms} active</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Add-ons</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAddons}</p>
                <p className="text-sm text-gray-500 mt-1">Available services</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Event Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEventTypes}</p>
                <p className="text-sm text-gray-500 mt-1">Configured types</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Sections */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section) => (
            <Card key={section.path}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{section.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{section.description}</p>
                    <p className="text-sm text-amber-600 font-medium mb-4">{section.stats}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(section.path)}
                    >
                      Manage {section.title.replace(' Management', '')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin/users?action=new')}>
              + Add New User
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin/rooms?action=new')}>
              + Add New Room
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin/addons?action=new')}>
              + Add New Add-on
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin/event-types?action=new')}>
              + Add Event Type
            </Button>
          </div>
        </div>
      </Card>
    </div>
    </DashboardLayout>
  );
}
