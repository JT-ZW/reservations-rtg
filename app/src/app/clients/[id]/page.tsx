'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/types';
import type { Database } from '@/types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'] & {
  room?: { name: string } | null;
  event_type?: { name: string } | null;
};

export default function ClientDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit =
    user &&
    [UserRole.ADMIN, UserRole.RESERVATIONS, UserRole.SALES].includes(
      user.role as UserRole
    );

  // Resolve params (Next.js 15 may pass a Promise)
  useEffect(() => {
    const resolve = async () => {
      const resolved = await Promise.resolve(params);
      setClientId(resolved.id);
    };
    resolve();
  }, [params]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clients/${clientId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch client');
      setClient(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchBookings = useCallback(async () => {
    if (!clientId) return;
    try {
      setBookingsLoading(true);
      const res = await fetch(
        `/api/bookings?client_id=${clientId}&limit=50&sort=start_date&order=desc`
      );
      const result = await res.json();
      if (res.ok) setBookings(result.data || []);
    } catch {
      // non-fatal
    } finally {
      setBookingsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
    fetchBookings();
  }, [fetchClient, fetchBookings]);

  const handleToggleActive = async () => {
    if (!client) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !client.is_active }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update client');
      setClient(result.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const statusColor: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    confirmed: 'success',
    tentative: 'warning',
    cancelled: 'danger',
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-500">Loading client details…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="secondary">← Back to Clients</Button>
            </Link>
          </div>
          <Alert variant="error">{error ?? 'Client not found.'}</Alert>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="secondary" size="sm">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.organization_name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Client Details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {client.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="danger">Inactive</Badge>
            )}
            {canEdit && (
              <>
                <Link href={`/clients/${client.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleActive}
                >
                  {client.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            )}
            <Link href={`/bookings/new?client_id=${client.id}`}>
              <Button size="sm">New Booking</Button>
            </Link>
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Organization
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">
                    {client.organization_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Contact Person
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.contact_person || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`mailto:${client.email}`}
                      className="text-amber-600 hover:underline"
                    >
                      {client.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.phone || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    City
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.city || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Country
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.country || '—'}
                  </dd>
                </div>
                {client.address && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                  </div>
                )}
                {client.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Notes
                    </dt>
                    <dd className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                      {client.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Client ID
                  </dt>
                  <dd className="mt-1 text-xs text-gray-500 font-mono break-all">
                    {client.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(client.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(client.updated_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total Bookings
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {bookingsLoading ? '…' : bookings.length}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="animate-spin h-6 w-6 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No bookings found for this client.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-600">
                          {b.booking_number}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{b.event_name}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {b.room?.name ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(b.start_date)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusColor[b.status] ?? 'default'}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {formatCurrency(b.final_amount, b.currency ?? 'USD')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/bookings/${b.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
