'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Addon {
  id: string;
  name: string;
  description: string | null;
  rate: number;
  unit: string;
  is_active: boolean;
}

interface EventType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function AddonsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'addons' | 'event-types'>('addons');
  
  // Addons state
  const [addons, setAddons] = useState<Addon[]>([]);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    description: '',
    rate: '',
    unit: 'unit',
  });

  // Event Types state
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [eventTypeFormData, setEventTypeFormData] = useState({
    name: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchAddons = useCallback(async () => {
    try {
      const response = await fetch('/api/addons?limit=100');
      if (response.ok) {
        const result = await response.json();
        setAddons(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
    }
  }, []);

  const fetchEventTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/event-types?limit=100');
      if (response.ok) {
        const result = await response.json();
        setEventTypes(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAddons(), fetchEventTypes()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchAddons, fetchEventTypes]);

  // Addon handlers
  const handleOpenAddonModal = (addon?: Addon) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonFormData({
        name: addon.name,
        description: addon.description || '',
        rate: addon.rate.toString(),
        unit: addon.unit,
      });
    } else {
      setEditingAddon(null);
      setAddonFormData({
        name: '',
        description: '',
        rate: '',
        unit: 'unit',
      });
    }
    setShowAddonModal(true);
  };

  const handleSubmitAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAddon ? `/api/addons/${editingAddon.id}` : '/api/addons';
      const method = editingAddon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addonFormData.name,
          description: addonFormData.description || null,
          rate: parseFloat(addonFormData.rate),
          unit: addonFormData.unit,
        }),
      });

      if (response.ok) {
        setShowAddonModal(false);
        fetchAddons();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save add-on');
      }
    } catch (error) {
      console.error('Error saving addon:', error);
      alert('Failed to save add-on');
    } finally {
      setSubmitting(false);
    }
  };

  // Event Type handlers
  const handleOpenEventTypeModal = (eventType?: EventType) => {
    if (eventType) {
      setEditingEventType(eventType);
      setEventTypeFormData({
        name: eventType.name,
        description: eventType.description || '',
      });
    } else {
      setEditingEventType(null);
      setEventTypeFormData({
        name: '',
        description: '',
      });
    }
    setShowEventTypeModal(true);
  };

  const handleSubmitEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingEventType ? `/api/event-types/${editingEventType.id}` : '/api/event-types';
      const method = editingEventType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventTypeFormData.name,
          description: eventTypeFormData.description || null,
        }),
      });

      if (response.ok) {
        setShowEventTypeModal(false);
        fetchEventTypes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save event type');
      }
    } catch (error) {
      console.error('Error saving event type:', error);
      alert('Failed to save event type');
    } finally {
      setSubmitting(false);
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
            <p className="text-gray-600">Loading configuration...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Configuration Management</h1>
          <p className="text-gray-600 mt-1">Manage add-ons and event types</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin')}>
          ← Back to Admin
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'addons'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Add-ons ({addons.length})
            </button>
            <button
              onClick={() => setActiveTab('event-types')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'event-types'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Event Types ({eventTypes.length})
            </button>
          </div>
        </div>
      </Card>

      {/* Add-ons Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => handleOpenAddonModal()}>
              + Add New Add-on
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((addon) => (
              <Card key={addon.id}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                    <Badge variant={addon.is_active ? 'success' : 'default'}>
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {addon.description && (
                    <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Rate:</span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(addon.rate)}/{addon.unit}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleOpenAddonModal(addon)}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {addons.length === 0 && (
            <Card>
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No add-ons configured yet.</p>
                <Button variant="primary" onClick={() => handleOpenAddonModal()}>
                  Add Your First Add-on
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Event Types Tab */}
      {activeTab === 'event-types' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => handleOpenEventTypeModal()}>
              + Add New Event Type
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{eventType.name}</h3>
                    <Badge variant={eventType.is_active ? 'success' : 'default'}>
                      {eventType.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {eventType.description && (
                    <p className="text-sm text-gray-600 mb-3">{eventType.description}</p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleOpenEventTypeModal(eventType)}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {eventTypes.length === 0 && (
            <Card>
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No event types configured yet.</p>
                <Button variant="primary" onClick={() => handleOpenEventTypeModal()}>
                  Add Your First Event Type
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Addon Modal */}
      {showAddonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
            </h2>
            <form onSubmit={handleSubmitAddon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addonFormData.name}
                  onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Projector & Screen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={addonFormData.rate}
                  onChange={(e) => setAddonFormData({ ...addonFormData, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={addonFormData.unit}
                  onChange={(e) => setAddonFormData({ ...addonFormData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="unit">Per Unit</option>
                  <option value="day">Per Day</option>
                  <option value="hour">Per Hour</option>
                  <option value="person">Per Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={addonFormData.description}
                  onChange={(e) => setAddonFormData({ ...addonFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowAddonModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {editingAddon ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Type Modal */}
      {showEventTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingEventType ? 'Edit Event Type' : 'Create New Event Type'}
            </h2>
            <form onSubmit={handleSubmitEventType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventTypeFormData.name}
                  onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Conference, Wedding, Corporate Training"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventTypeFormData.description}
                  onChange={(e) => setEventTypeFormData({ ...eventTypeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowEventTypeModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {editingEventType ? 'Update' : 'Create'}
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
