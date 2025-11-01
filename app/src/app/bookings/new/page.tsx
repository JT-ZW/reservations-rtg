'use client';

// Disable caching for this page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import CapacityIndicator from '@/components/bookings/CapacityIndicator';
import LineItemsEditor, { LineItem } from '@/components/bookings/LineItemsEditor';
import type { Database } from '@/types/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface ConflictResponse {
  has_conflict: boolean;
  conflicting_booking_number?: string;
  conflicting_event_name?: string;
}

export default function NewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [conflictCheck, setConflictCheck] = useState<ConflictResponse | null>(null);

  // Form data with new structure
  const [formData, setFormData] = useState({
    contact_person: '',
    company_name: '',
    email: '',
    phone: '',
    room_id: '',
    event_type: '',
    event_name: '',
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '17:00',
    number_of_attendees: '',
    special_requirements: '',
    notes: '',
    status: 'tentative' as 'tentative' | 'confirmed',
  });

  // Client autocomplete state
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Rooms data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Line items for flexible pricing
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // Currency selection
  const [currency, setCurrency] = useState<'ZWG' | 'USD'>('USD');

  // Fetch rooms
  useEffect(() => {
    if (!user) return;

    fetch('/api/rooms?limit=100')
      .then(r => r.json())
      .then(data => {
        if (data.success || data.data) {
          const roomsList = data.data || [];
          setRooms(roomsList.filter((r: Room) => r.is_available));
        }
      })
      .catch(console.error);
  }, [user]);

  // Client autocomplete search
  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.data) {
        setClientSuggestions(result.data);
        setShowClientSuggestions(true);
      }
    } catch (err) {
      console.error('Client search failed:', err);
    }
  }, []);

  // Debounced client search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.contact_person && !selectedClientId) {
        searchClients(formData.contact_person);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.contact_person, selectedClientId, searchClients]);

  // Update selected room when room_id changes
  useEffect(() => {
    const room = rooms.find(r => r.id === formData.room_id);
    setSelectedRoom(room || null);
  }, [formData.room_id, rooms]);

  // Check for conflicts when room or dates change (only for confirmed bookings)
  useEffect(() => {
    if (!formData.room_id || !formData.start_date || !formData.end_date) {
      setConflictCheck(null);
      return;
    }

    // Only check conflicts for confirmed bookings
    if (formData.status !== 'confirmed') {
      setConflictCheck(null);
      return;
    }

    const checkConflict = async () => {
      try {
        const response = await fetch('/api/bookings/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: formData.room_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            start_time: formData.start_time + ':00',
            end_time: formData.end_time + ':00',
            status: formData.status,
          }),
        });
        
        const result = await response.json();
        if (response.ok) {
          setConflictCheck(result.data);
        }
      } catch (err) {
        console.error('Conflict check failed:', err);
      }
    };

    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [formData.room_id, formData.start_date, formData.end_date, formData.start_time, formData.end_time, formData.status]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear selected client if contact person changes
    if (field === 'contact_person') {
      setSelectedClientId(null);
    }
  };

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      contact_person: client.contact_person,
      company_name: client.organization_name,
      email: client.email || '',
      phone: client.phone || '',
    }));
    setSelectedClientId(client.id);
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate client information
    if (!selectedClientId && !formData.email) {
      setError('Please select an existing client or provide an email address for a new client');
      return;
    }

    // Check if we have conflicts for confirmed bookings
    if (formData.status === 'confirmed' && conflictCheck?.has_conflict) {
      setError('Cannot create confirmed booking: Room conflict exists');
      return;
    }

    // Validate line items
    if (lineItems.length === 0) {
      setError('Please add at least one line item for pricing');
      return;
    }

    const hasInvalidItems = lineItems.some(item => 
      !item.description || item.quantity <= 0 || item.rate < 0
    );

    if (hasInvalidItems) {
      setError('Please ensure all line items have valid description, quantity, and rate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate total from line items
      const total_amount = lineItems.reduce((sum, item) => sum + item.amount, 0);

      const payload = {
        client_id: selectedClientId,
        client_name: formData.contact_person,
        company_name: formData.company_name,
        client_email: formData.email,
        client_phone: formData.phone,
        room_id: formData.room_id,
        event_type: formData.event_type,
        event_name: formData.event_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
        number_of_attendees: formData.number_of_attendees ? parseInt(formData.number_of_attendees) : null,
        special_requirements: formData.special_requirements || null,
        notes: formData.notes || null,
        status: formData.status,
        total_amount,
        line_items: lineItems,
        currency: currency,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/bookings/${result.data.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'ZWG' ? 'ZWG' : 'USD';
    return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the booking details below
          </p>
        </div>

        {success && (
          <Alert variant="success">
            Booking created successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {formData.status === 'confirmed' && conflictCheck?.has_conflict && (
          <Alert variant="error" title="Room Conflict Detected">
            This room is already booked for the selected date/time. Conflicting booking: {conflictCheck.conflicting_booking_number} - {conflictCheck.conflicting_event_name}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person with Autocomplete */}
                <div className="relative">
                  <Input
                    label="Contact Person"
                    required
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Start typing to search existing clients..."
                    autoComplete="off"
                  />
                  
                  {/* Autocomplete Suggestions Dropdown */}
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {clientSuggestions.map((client) => (
                        <div
                          key={client.id}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="font-medium text-gray-900">{client.contact_person}</div>
                          <div className="text-sm text-gray-600">{client.organization_name}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  label="Company Name"
                  required
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Company or organization name"
                />

                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="client@example.com"
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {selectedClientId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Using existing client profile
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event & Room Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event & Room Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Event Name"
                  required
                  value={formData.event_name}
                  onChange={(e) => handleInputChange('event_name', e.target.value)}
                  placeholder="e.g., Annual Conference 2025"
                />

                <Input
                  label="Event Type"
                  required
                  value={formData.event_type}
                  onChange={(e) => handleInputChange('event_type', e.target.value)}
                  placeholder="e.g., Conference, Wedding, Training"
                />

                <Select
                  label="Room"
                  required
                  value={formData.room_id}
                  onChange={(e) => handleInputChange('room_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select a room' },
                    ...rooms.map(r => ({ 
                      value: r.id, 
                      label: `${r.name} (Capacity: ${r.capacity})` 
                    })),
                  ]}
                />

                <Input
                  label="Number of Attendees"
                  type="number"
                  min="1"
                  value={formData.number_of_attendees}
                  onChange={(e) => handleInputChange('number_of_attendees', e.target.value)}
                  placeholder="Expected attendees"
                />

                {/* Capacity Indicator */}
                {selectedRoom && formData.number_of_attendees && (
                  <div className="md:col-span-2">
                    <CapacityIndicator
                      attendees={parseInt(formData.number_of_attendees)}
                      roomCapacity={selectedRoom.capacity}
                      roomName={selectedRoom.name}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />

                <Input
                  label="End Date"
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />

                <Input
                  label="Start Time"
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                />

                <Input
                  label="End Time"
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Status"
                required
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'tentative' | 'confirmed')}
                options={[
                  { value: 'tentative', label: 'Tentative - Not yet confirmed (allows overlapping bookings)' },
                  { value: 'confirmed', label: 'Confirmed - Blocks this time slot' },
                ]}
              />
              
              <p className="mt-2 text-sm text-gray-600">
                {formData.status === 'tentative' 
                  ? '⚠️ Tentative bookings allow multiple reservations for the same room and time. Confirm when finalized.'
                  : '✓ Confirmed bookings block the selected time slot for other confirmed bookings.'}
              </p>
            </CardContent>
          </Card>

          {/* Flexible Pricing - Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Currency Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'ZWG' | 'USD')}
                  required
                >
                  <option value="USD">USD - United States Dollar</option>
                  <option value="ZWG">ZWG - Zimbabwe Gold</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  This currency will be used across all documents (quotations, invoices, reports)
                </p>
              </div>

              <LineItemsEditor items={lineItems} onChange={setLineItems} currency={currency} />
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requirements
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    placeholder="Any special requirements or requests..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Internal notes (not visible to client)..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || (formData.status === 'confirmed' && conflictCheck?.has_conflict) || lineItems.length === 0}
            >
              Create Booking
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
