'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  description: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  status: string;
  error_message?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resource_type', filters.resourceType);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      status: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'green';
      case 'UPDATE': return 'blue';
      case 'DELETE': return 'red';
      case 'LOGIN': return 'purple';
      case 'LOGOUT': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">
              Track all user activities and system events
            </p>
          </div>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : '📥 Export CSV'}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search"
                placeholder="Email, resource, description..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
              />

              <Select
                label="Action"
                value={filters.action}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('action', e.target.value)}
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                  { value: 'VIEW', label: 'View' },
                  { value: 'LOGIN', label: 'Login' },
                  { value: 'LOGOUT', label: 'Logout' },
                  { value: 'EXPORT', label: 'Export' },
                  { value: 'PRINT', label: 'Print' },
                ]}
              />

              <Select
                label="Resource Type"
                value={filters.resourceType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('resourceType', e.target.value)}
                options={[
                  { value: '', label: 'All Resources' },
                  { value: 'booking', label: 'Booking' },
                  { value: 'client', label: 'Client' },
                  { value: 'room', label: 'Room' },
                  { value: 'user', label: 'User' },
                  { value: 'addon', label: 'Addon' },
                  { value: 'event_type', label: 'Event Type' },
                  { value: 'document', label: 'Document' },
                  { value: 'auth', label: 'Authentication' },
                ]}
              />

              <Select
                label="Status"
                value={filters.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'success', label: 'Success' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'error', label: 'Error' },
                ]}
              />

              <Input
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
              />

              <Input
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClearFilters} variant="secondary">
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} logs
        </div>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableEmpty colSpan={7} message="No audit logs found" />
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.user_email}</div>
                          <div className="text-gray-500 capitalize">{log.user_role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color={getActionColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium capitalize">
                            {log.resource_type.replace('_', ' ')}
                          </div>
                          {log.resource_name && (
                            <div className="text-gray-500">{log.resource_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-md truncate">{log.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge color={getStatusColor(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailsModal(true);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLog(null);
          }}
          title="Audit Log Details"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date & Time:</dt>
                    <dd className="font-medium">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">User:</dt>
                    <dd className="font-medium">{selectedLog.user_email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Role:</dt>
                    <dd className="font-medium capitalize">{selectedLog.user_role}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Action:</dt>
                    <dd>
                      <Badge color={getActionColor(selectedLog.action)}>
                        {selectedLog.action}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Resource Type:</dt>
                    <dd className="font-medium capitalize">
                      {selectedLog.resource_type.replace('_', ' ')}
                    </dd>
                  </div>
                  {selectedLog.resource_name && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Resource Name:</dt>
                      <dd className="font-medium">{selectedLog.resource_name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status:</dt>
                    <dd>
                      <Badge color={getStatusColor(selectedLog.status)}>
                        {selectedLog.status}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                <p className="mt-2 text-sm text-gray-600">{selectedLog.description}</p>
              </div>

              {selectedLog.changes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Changes</h3>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.before && (
                      <div>
                        <p className="text-xs font-medium text-gray-600">Before:</p>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.changes.after && (
                      <div>
                        <p className="text-xs font-medium text-gray-600">After:</p>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Metadata</h3>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Request Context</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">IP Address:</dt>
                    <dd className="font-medium">{selectedLog.ip_address || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Method:</dt>
                    <dd className="font-medium">{selectedLog.request_method || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Path:</dt>
                    <dd className="font-medium text-xs">{selectedLog.request_path || 'N/A'}</dd>
                  </div>
                  {selectedLog.user_agent && (
                    <div>
                      <dt className="text-gray-600">User Agent:</dt>
                      <dd className="font-medium text-xs mt-1 break-all">
                        {selectedLog.user_agent}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {selectedLog.error_message && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700">Error Message</h3>
                  <p className="mt-2 text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
