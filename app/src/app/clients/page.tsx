'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import type { Database } from '@/types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ClientsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ 
    total: 0, 
    page: 1, 
    limit: 20, 
    totalPages: 0 
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', meta.page.toString());
      params.set('limit', '20');
      
      if (searchTerm) params.set('search', searchTerm);
      if (isActiveFilter !== 'all') {
        params.set('is_active', isActiveFilter === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`/api/clients?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch clients');
      }

      setClients(result.data || []);
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
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    fetchClients();
  };

  const handlePageChange = (newPage: number) => {
    setMeta(prev => ({ ...prev, page: newPage }));
  };

  const handleToggleActive = async (clientId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update client');
      }

      // Refresh the list
      fetchClients();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <div className="text-gray-500">Please log in to view clients</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage client organizations and contacts
            </p>
          </div>
          <Link href="/clients/new">
            <Button>Add Client</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Search"
                  placeholder="Organization name, email, or phone"
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
                  <option value="all">All Clients</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Total Clients</div>
            <div className="text-2xl font-bold text-gray-900">{meta.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Active Clients</div>
            <div className="text-2xl font-bold text-green-600">
              {clients.filter(c => c.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Inactive Clients</div>
            <div className="text-2xl font-bold text-gray-400">
              {clients.filter(c => !c.is_active).length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500 mt-2">Loading clients...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableEmpty colSpan={7} message="No clients found. Add your first client to get started." />
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.organization_name}
                    </TableCell>
                    <TableCell>{client.contact_person || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {client.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {client.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(client.id, client.is_active)}
                        >
                          {client.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} clients
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
