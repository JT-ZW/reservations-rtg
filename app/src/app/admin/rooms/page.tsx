'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

interface Room {
  id: string;
  name: string;
  capacity: number;
  rate_per_day: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
}

export default function RoomsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/rooms?limit=100');
      if (response.ok) {
        const result = await response.json();
        setRooms(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity.toString(),
        description: room.description || '',
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          capacity: parseInt(formData.capacity),
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setToast({
          message: editingRoom ? 'Room updated successfully!' : 'Room created successfully!',
          type: 'success'
        });
        fetchRooms();
      } else {
        const error = await response.json();
        setToast({
          message: error.error || `Failed to ${editingRoom ? 'update' : 'create'} room`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving room:', error);
      setToast({
        message: 'Failed to save room. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (roomId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this room?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentStatus }),
      });

      if (response.ok) {
        setToast({
          message: currentStatus ? 'Room deactivated successfully!' : 'Room activated successfully!',
          type: 'success'
        });
        fetchRooms();
      } else {
        setToast({
          message: 'Failed to update room status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating room:', error);
      setToast({
        message: 'Failed to update room. Please try again.',
        type: 'error'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
            <p className="text-gray-600">Loading rooms...</p>
          </div>
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

    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-1">Configure conference and event rooms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/admin')}>
            ← Back to Admin
          </Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            + Add New Room
          </Button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                <Badge variant={room.is_available ? 'success' : 'default'}>
                  {room.is_available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium text-gray-900">{room.capacity} people</span>
                </div>
                {room.description && (
                  <div>
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="text-sm text-gray-700 mt-1">{room.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => handleOpenModal(room)}
                >
                  Edit
                </Button>
                <Button
                  variant={room.is_available ? 'danger' : 'primary'}
                  size="sm"
                  fullWidth
                  onClick={() => handleToggleStatus(room.id, room.is_available)}
                >
                  {room.is_available ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No rooms configured yet.</p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              Add Your First Room
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingRoom ? 'Edit Room' : 'Create New Room'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Victoria Ballroom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of people"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Optional description of the room..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {editingRoom ? 'Update Room' : 'Create Room'}
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
