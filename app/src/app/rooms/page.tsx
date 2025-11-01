'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import type { Database } from '@/types/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RoomsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ 
    total: 0, 
    page: 1, 
    limit: 50, 
    totalPages: 0 
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', meta.page.toString());
      params.set('limit', '50');
      
      if (searchTerm) params.set('search', searchTerm);
      if (isActiveFilter !== 'all') {
        params.set('is_available', isActiveFilter === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch rooms');
      }

      setRooms(result.data || []);
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
  }, [user, meta.page, searchTerm, isActiveFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    fetchRooms();
  };

  const handlePageChange = (newPage: number) => {
    setMeta(prev => ({ ...prev, page: newPage }));
  };

  const handleToggleActive = async (roomId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update room');
      }

      // Refresh the list
      fetchRooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Please log in to view rooms</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conference Rooms</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage conference rooms and event spaces
            </p>
          </div>
          {user?.role === 'admin' && (
            <Link href="/admin/rooms">
              <Button>Manage Rooms</Button>
            </Link>
          )}
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Search"
                  placeholder="Room name or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={isActiveFilter}
                  onChange={(e) => {
                    setIsActiveFilter(e.target.value);
                    setMeta(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">All Rooms</option>
                  <option value="active">Available Only</option>
                  <option value="inactive">Unavailable Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setIsActiveFilter('all');
                  setMeta(prev => ({ ...prev, page: 1 }));
                }}
              >
                Clear Filters
              </Button>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Total Rooms</div>
            <div className="text-2xl font-bold text-gray-900">{meta.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-2xl font-bold text-green-600">
              {rooms.filter(r => r.is_available).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Total Capacity</div>
            <div className="text-2xl font-bold text-amber-600">
              {rooms.reduce((sum, r) => sum + r.capacity, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Avg. Capacity</div>
            <div className="text-2xl font-bold text-blue-600">
              {rooms.length > 0
                ? Math.round(rooms.reduce((sum, r) => sum + r.capacity, 0) / rooms.length)
                : '0'}
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="animate-spin mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-500 mt-4">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500">No rooms found. Contact administrator to add rooms.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Room Header */}
                <div className="bg-linear-to-r from-amber-500 to-yellow-600 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{room.name}</h3>
                      <p className="text-sm text-amber-50">
                        Capacity: {room.capacity} people
                      </p>
                    </div>
                    {room.is_available ? (
                      <Badge variant="success" className="bg-green-500 text-white border-none">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="bg-red-500 text-white border-none">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-4 space-y-3">
                  {/* Description */}
                  {room.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Amenities */}
                  {room.amenities && Array.isArray(room.amenities) && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(room.amenities as string[]).slice(0, 3).map((amenity: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {amenity}
                        </span>
                      ))}
                      {(room.amenities as string[]).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{(room.amenities as string[]).length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-200 flex gap-2">
                    <Link href={`/bookings/new?room_id=${room.id}`} className="flex-1">
                      <Button className="w-full" size="sm" disabled={!room.is_available}>
                        Book Room
                      </Button>
                    </Link>
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(room.id, room.is_available)}
                      >
                        {room.is_available ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} rooms
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                >
                  Previous
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
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
