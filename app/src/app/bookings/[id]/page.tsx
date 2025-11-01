'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BookingStatusBadge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/types';
import GenerateQuotationButton from '@/components/bookings/GenerateQuotationButton';
import type { Database } from '@/types/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'];
  room?: Database['public']['Tables']['rooms']['Row'];
  event_type?: Database['public']['Tables']['event_types']['Row'];
  created_by_user?: { full_name: string; email: string };
};

type BookingAddon = Database['public']['Tables']['booking_addons']['Row'] & {
  addon?: Database['public']['Tables']['addons']['Row'];
};

export default function BookingDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  
  const canEdit = user && [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES].includes(user.role as UserRole);
  const canDelete = user && user.role === UserRole.ADMIN;

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [addons, setAddons] = useState<BookingAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resolve params (handle Next.js 15 Promise)
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setBookingId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

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

      setBooking(result.data);
      setAddons(result.data.addons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    if (!bookingId) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          notes: booking?.notes ? `${booking.notes}\n\nCancellation Reason: ${cancelReason}` : `Cancellation Reason: ${cancelReason}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      await fetchBooking();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete booking');
      }

      router.push('/bookings');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete booking');
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'tentative' | 'confirmed' | 'completed') => {
    if (!bookingId) return;
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking status');
      }

      await fetchBooking();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
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
          <div className="text-gray-500">Loading booking details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !booking) {
    return (
      <DashboardLayout>
        <Alert variant="error">
          {error || 'Booking not found'}
        </Alert>
        <div className="mt-4">
          <Link href="/bookings">
            <Button variant="secondary">Back to Bookings</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{booking.booking_number}</h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">{booking.event_name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/bookings">
              <Button variant="secondary">Back</Button>
            </Link>
            {canEdit && booking.status !== 'cancelled' && (
              <Link href={`/bookings/${booking.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* Generate Quotation Button */}
                {booking.id && <GenerateQuotationButton bookingId={booking.id} />}
                
                {booking.status === 'tentative' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange('confirmed')}
                  >
                    Confirm Booking
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
                {(booking.status === 'tentative' || booking.status === 'confirmed') && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Booking
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Organization</div>
                  <div className="font-medium">{booking.client?.organization_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contact Person</div>
                  <div className="font-medium">{booking.client?.contact_person || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{booking.client?.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium">{booking.client?.phone || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Event Type</div>
                  <div className="font-medium">{booking.event_type?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Number of Attendees</div>
                  <div className="font-medium">{booking.number_of_attendees || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Room</div>
                  <div className="font-medium">{booking.room?.name || 'N/A'}</div>
                  <div className="text-xs text-gray-500">Capacity: {booking.room?.capacity || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Start Date & Time</div>
                  <div className="font-medium">
                    {formatDate(booking.start_date)} at {formatTime(booking.start_time)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">End Date & Time</div>
                  <div className="font-medium">
                    {formatDate(booking.end_date)} at {formatTime(booking.end_time)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">
                    {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="font-medium">{formatCurrency(booking.total_amount)}</span>
                </div>
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-{formatCurrency(booking.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Final Amount</span>
                  <span className="text-xl font-bold text-amber-600">{formatCurrency(booking.final_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add-ons & Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {addons.map((addon) => (
                  <div key={addon.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{addon.addon?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {addon.quantity} × {formatCurrency(addon.rate)}
                      </div>
                      {addon.notes && (
                        <div className="text-xs text-gray-500 mt-1">{addon.notes}</div>
                      )}
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(addon.rate * addon.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Special Requirements */}
        {booking.special_requirements && (
          <Card>
            <CardHeader>
              <CardTitle>Special Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.special_requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {booking.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Created At</div>
                <div className="font-medium">{new Date(booking.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Last Updated</div>
                <div className="font-medium">{new Date(booking.updated_at).toLocaleString()}</div>
              </div>
              {booking.created_by_user && (
                <div className="col-span-2">
                  <div className="text-gray-500">Created By</div>
                  <div className="font-medium">{booking.created_by_user.full_name} ({booking.created_by_user.email})</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Booking"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBooking}
                loading={cancelling}
                disabled={cancelling || !cancelReason.trim()}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Booking"
        >
          <div className="space-y-4">
            <Alert variant="error">
              Warning: This will permanently delete this booking and all associated data. This action cannot be undone.
            </Alert>
            <p className="text-gray-600">
              Are you absolutely sure you want to delete booking <strong>{booking.booking_number}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteBooking}
                loading={deleting}
                disabled={deleting}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
