'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { BookingStatusBadge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import type { Database } from '@/types/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'];
  room?: Database['public']['Tables']['rooms']['Row'];
  currency?: string; // 'USD' | 'ZWG'
};

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ 
    total: 0, 
    page: 1, 
    limit: 20, 
    totalPages: 0 
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    room_id: '',
    client_id: '',
    start_date: '',
    end_date: '',
    page: 1,
  });

  const [rooms, setRooms] = useState<Database['public']['Tables']['rooms']['Row'][]>([]);
  const [clients, setClients] = useState<Database['public']['Tables']['clients']['Row'][]>([]);

  // Fetch rooms and clients for filters
  useEffect(() => {
    if (!user) return;

    Promise.all([
      fetch('/api/rooms').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([roomsData, clientsData]) => {
      if (roomsData.success) setRooms(roomsData.data);
      if (clientsData.success) setClients(clientsData.data);
    }).catch(console.error);
  }, [user]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '20');
      
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.room_id) params.set('room_id', filters.room_id);
      if (filters.client_id) params.set('client_id', filters.client_id);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);

      const response = await fetch(`/api/bookings?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }

      setBookings(result.data || []);
      if (result.pagination) {
        setMeta({
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, filters.page, filters.search, filters.status, filters.room_id, filters.client_id, filters.start_date, filters.end_date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when searching to see results from the beginning
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (currency === 'ZWG') {
      return `ZWG ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Please log in to view bookings</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              Bookings
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Manage conference room bookings and reservations
            </p>
          </div>
          <Link href="/bookings/new">
            <Button size="lg" className="w-full sm:w-auto">
              <span className="mr-2">➕</span> Create Booking
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-premium p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm">🔍</span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">Filter Bookings</h2>
          </div>
          <form onSubmit={handleSearch} className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              <Input
                label="Search"
                placeholder="Event name or booking #"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />

              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'tentative', label: 'Tentative' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />

              <Select
                label="Room"
                value={filters.room_id}
                onChange={(e) => handleFilterChange('room_id', e.target.value)}
                options={[
                  { value: '', label: 'All Rooms' },
                  ...rooms.map(room => ({ value: room.id, label: room.name })),
                ]}
              />

              <Select
                label="Client"
                value={filters.client_id}
                onChange={(e) => handleFilterChange('client_id', e.target.value)}
                options={[
                  { value: '', label: 'All Clients' },
                  ...clients.map(client => ({ value: client.id, label: client.organization_name })),
                ]}
              />

              <Input
                label="Start Date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />

              <Input
                label="End Date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFilters({
                    search: '',
                    status: '',
                    room_id: '',
                    client_id: '',
                    start_date: '',
                    end_date: '',
                    page: 1,
                  });
                }}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Apply Filters</Button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-premium overflow-hidden">
          <div className="border-b-2 border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span> Booking Records
              {!loading && <span className="text-xs md:text-sm font-normal text-gray-500">({meta.total} total)</span>}
            </h3>
          </div>
          {/* Make table horizontally scrollable on mobile */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Booking #</TableHead>
                  <TableHead className="whitespace-nowrap">Event Name</TableHead>
                  <TableHead className="whitespace-nowrap">Client</TableHead>
                  <TableHead className="whitespace-nowrap">Room</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-500 mt-2">Loading bookings...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableEmpty colSpan={8} message="No bookings found. Create your first booking to get started." />
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {booking.booking_number}
                      </TableCell>
                      <TableCell className="min-w-[150px]">{booking.event_name}</TableCell>
                      <TableCell className="min-w-[150px]">
                        {booking.client?.organization_name || 'N/A'}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {booking.room?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(booking.start_date)}
                        {booking.start_date !== booking.end_date && (
                          <> - {formatDate(booking.end_date)}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatCurrency(booking.final_amount, booking.currency || 'USD')}
                      </TableCell>
                      <TableCell>
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 md:py-5 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white gap-3">
              <div className="text-xs md:text-sm font-medium text-gray-700 text-center sm:text-left">
                Showing <span className="font-bold text-brand-primary">{((meta.page - 1) * meta.limit) + 1}</span> to <span className="font-bold text-brand-primary">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-bold text-brand-primary">{meta.total}</span> bookings
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className="font-semibold"
                >
                  ← Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === meta.page ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={page === meta.page ? 'font-bold shadow-md' : ''}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                  className="font-semibold"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
