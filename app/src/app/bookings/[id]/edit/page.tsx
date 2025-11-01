'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import type { Database } from '@/types/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type EventType = Database['public']['Tables']['event_types']['Row'];
type Addon = Database['public']['Tables']['addons']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingAddon = Database['public']['Tables']['booking_addons']['Row'];

interface BookingAddonInput {
  addon_id: string;
  quantity: number;
  rate: number;
  notes?: string;
}

interface ConflictResponse {
  has_conflict: boolean;
  conflicting_booking_number?: string;
  conflicting_event_name?: string;
}

export default function EditBookingPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [conflictCheck, setConflictCheck] = useState<ConflictResponse | null>(null);
  const [originalBooking, setOriginalBooking] = useState<Booking | null>(null);

  // Resolve params (handle Next.js 15 Promise)
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setBookingId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Form data
  const [formData, setFormData] = useState({
    client_id: '',
    room_id: '',
    event_type_id: '',
    event_name: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    number_of_attendees: '',
    status: '',
    special_requirements: '',
    notes: '',
  });

  // Dropdown options
  const [rooms, setRooms] = useState<Room[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  
  // Selected addons
  const [selectedAddons, setSelectedAddons] = useState<BookingAddonInput[]>([]);
  
  // Calculated amounts
  const [roomRate, setRoomRate] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [roomTotal, setRoomTotal] = useState(0);
  const [addonsTotal, setAddonsTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Fetch booking data
  const fetchBooking = useCallback(async () => {
    if (!user || !bookingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/${bookingId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch booking');
      }

      const booking = result.data;
      setOriginalBooking(booking);
      
      // Populate form
      setFormData({
        client_id: booking.client_id,
        room_id: booking.room_id,
        event_type_id: booking.event_type_id,
        event_name: booking.event_name,
        start_date: booking.start_date,
        end_date: booking.end_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        number_of_attendees: booking.number_of_attendees?.toString() || '',
        status: booking.status,
        special_requirements: booking.special_requirements || '',
        notes: booking.notes || '',
      });

      setDiscount(booking.discount_amount || 0);

      // Set addons
      if (booking.addons && Array.isArray(booking.addons)) {
        setSelectedAddons(booking.addons.map((a: BookingAddon) => ({
          addon_id: a.addon_id,
          quantity: a.quantity,
          rate: a.rate,
          notes: a.notes || '',
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, bookingId]);

  // Fetch dropdown data
  useEffect(() => {
    if (!user) return;

    Promise.all([
      fetch('/api/rooms?limit=100').then(r => r.json()),
      fetch('/api/clients?limit=100').then(r => r.json()),
      fetch('/api/event-types?limit=100').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/addons?limit=100').then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([roomsData, clientsData, eventTypesData, addonsData]) => {
      if (roomsData.success) setRooms(roomsData.data.filter((r: Room) => r.is_available));
      if (clientsData.success) setClients(clientsData.data.filter((c: Client) => c.is_active));
      if (eventTypesData.success) setEventTypes(eventTypesData.data?.filter((e: EventType) => e.is_active) || []);
      if (addonsData.success) setAddons(addonsData.data?.filter((a: Addon) => a.is_active) || []);
    }).catch(console.error);

    fetchBooking();
  }, [user, fetchBooking]);

  // Calculate totals
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      setNumberOfDays(days);
    }

    const selectedRoom = rooms.find(r => r.id === formData.room_id);
    const rate = selectedRoom?.rate_per_day || 0;
    setRoomRate(rate);

    const rTotal = rate * numberOfDays;
    setRoomTotal(rTotal);

    const aTotal = selectedAddons.reduce((sum, addon) => sum + (addon.rate * addon.quantity), 0);
    setAddonsTotal(aTotal);

    const total = rTotal + aTotal;
    const final = total - discount;
    setFinalAmount(Math.max(0, final));
  }, [formData.room_id, formData.start_date, formData.end_date, rooms, numberOfDays, selectedAddons, discount]);

  // Check for conflicts
  useEffect(() => {
    if (!formData.room_id || !formData.start_date || !formData.end_date || !formData.start_time || !formData.end_time || !bookingId) {
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
            start_time: formData.start_time,
            end_time: formData.end_time,
            exclude_booking_id: bookingId,
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
  }, [formData.room_id, formData.start_date, formData.end_date, formData.start_time, formData.end_time, bookingId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAddon = () => {
    if (addons.length === 0) return;
    
    const firstAddon = addons[0];
    setSelectedAddons(prev => [
      ...prev,
      { addon_id: firstAddon.id, quantity: 1, rate: firstAddon.rate, notes: '' }
    ]);
  };

  const handleRemoveAddon = (index: number) => {
    setSelectedAddons(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddonChange = (index: number, field: keyof BookingAddonInput, value: string | number) => {
    setSelectedAddons(prev => prev.map((addon, i) => 
      i === index ? { ...addon, [field]: value } : addon
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conflictCheck?.has_conflict) {
      setError('Cannot update booking: Room conflict exists');
      return;
    }

    if (!bookingId) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        number_of_attendees: formData.number_of_attendees ? parseInt(formData.number_of_attendees) : null,
        total_amount: roomTotal + addonsTotal,
        discount_amount: discount,
        final_amount: finalAmount,
      };

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/bookings/${bookingId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading booking...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !originalBooking) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update booking details for {originalBooking?.booking_number}
          </p>
        </div>

        {success && (
          <Alert variant="success">
            Booking updated successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {conflictCheck?.has_conflict && (
          <Alert variant="error" title="Room Conflict Detected">
            This room is already booked for the selected date/time. Conflicting booking: {conflictCheck.conflicting_booking_number} - {conflictCheck.conflicting_event_name}
          </Alert>
        )}

        {originalBooking?.status === 'cancelled' && (
          <Alert variant="warning">
            This booking has been cancelled. Changes may be limited.
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Client"
                  required
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select a client' },
                    ...clients.map(c => ({ value: c.id, label: c.organization_name })),
                  ]}
                />

                <Input
                  label="Event Name"
                  required
                  value={formData.event_name}
                  onChange={(e) => handleInputChange('event_name', e.target.value)}
                />

                <Select
                  label="Event Type"
                  required
                  value={formData.event_type_id}
                  onChange={(e) => handleInputChange('event_type_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select event type' },
                    ...eventTypes.map(et => ({ value: et.id, label: et.name })),
                  ]}
                />

                <Input
                  label="Number of Attendees"
                  type="number"
                  min="1"
                  value={formData.number_of_attendees}
                  onChange={(e) => handleInputChange('number_of_attendees', e.target.value)}
                />

                <Select
                  label="Status"
                  required
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  options={[
                    { value: 'tentative', label: 'Tentative' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Room & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Room & Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Room"
                  required
                  value={formData.room_id}
                  onChange={(e) => handleInputChange('room_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select a room' },
                    ...rooms.map(r => ({ 
                      value: r.id, 
                      label: `${r.name} (Capacity: ${r.capacity}, ${formatCurrency(r.rate_per_day)}/day)` 
                    })),
                  ]}
                />

                <div className="md:col-span-2 grid grid-cols-2 gap-4">
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
                    value={formData.start_time.substring(0, 5)}
                    onChange={(e) => handleInputChange('start_time', e.target.value + ':00')}
                  />

                  <Input
                    label="End Time"
                    type="time"
                    required
                    value={formData.end_time.substring(0, 5)}
                    onChange={(e) => handleInputChange('end_time', e.target.value + ':00')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add-ons & Services</CardTitle>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddAddon}>
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedAddons.length === 0 ? (
                <p className="text-sm text-gray-500">No add-ons selected</p>
              ) : (
                <div className="space-y-3">
                  {selectedAddons.map((addon, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Select
                          label="Service"
                          value={addon.addon_id}
                          onChange={(e) => {
                            const selected = addons.find(a => a.id === e.target.value);
                            handleAddonChange(index, 'addon_id', e.target.value);
                            if (selected) handleAddonChange(index, 'rate', selected.rate);
                          }}
                          options={addons.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.rate)}/${a.unit})` }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Quantity"
                          type="number"
                          min="1"
                          value={addon.quantity.toString()}
                          onChange={(e) => handleAddonChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Rate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={addon.rate.toString()}
                          onChange={(e) => handleAddonChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">Total</div>
                        <div className="text-lg font-semibold">{formatCurrency(addon.rate * addon.quantity)}</div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveAddon(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Rate ({numberOfDays} days × {formatCurrency(roomRate)})</span>
                  <span className="font-medium">{formatCurrency(roomTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Add-ons & Services</span>
                  <span className="font-medium">{formatCurrency(addonsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Discount</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount.toString()}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Final Amount</span>
                  <span className="text-2xl font-bold text-amber-600">{formatCurrency(finalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => bookingId && router.push(`/bookings/${bookingId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={saving || conflictCheck?.has_conflict}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
