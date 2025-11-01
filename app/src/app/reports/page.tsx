'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/auth-context';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  period: string;
  revenue: number;
  bookings: number;
}

interface RoomUtilization {
  id: string;
  name: string;
  capacity: number;
  total_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  avg_attendees: number;
}

interface ClientAnalytics {
  id: string;
  organization_name: string;
  contact_person: string;
  email: string;
  total_bookings: number;
  confirmed_bookings: number;
  total_spent: number;
  last_booking_date: string | null;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueSummary, setRevenueSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRevenue: 0,
  });

  const [utilizationData, setUtilizationData] = useState<RoomUtilization[]>([]);
  const [utilizationSummary, setUtilizationSummary] = useState({
    totalRooms: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    averageUtilization: 0,
  });

  const [clientData, setClientData] = useState<ClientAnalytics[]>([]);
  const [clientSummary, setClientSummary] = useState({
    totalClients: 0,
    totalRevenue: 0,
    averageSpendPerClient: 0,
    totalBookings: 0,
    averageBookingsPerClient: 0,
  });

  const fetchRevenueReport = async () => {
    const response = await fetch(
      `/api/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`
    );
    if (response.ok) {
      const result = await response.json();
      setRevenueData(result.data);
      setRevenueSummary(result.summary);
    }
  };

  const fetchUtilizationReport = async () => {
    const response = await fetch('/api/reports/utilization');
    if (response.ok) {
      const result = await response.json();
      setUtilizationData(result.data);
      setUtilizationSummary(result.summary);
    }
  };

  const fetchClientAnalytics = async () => {
    const response = await fetch('/api/reports/clients?limit=10');
    if (response.ok) {
      const result = await response.json();
      setClientData(result.data);
      setClientSummary(result.summary);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchRevenueReport(), fetchUtilizationReport(), fetchClientAnalytics()]);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, groupBy]);

  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  const handleCurrentMonth = () => {
    setDateRange({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToCSV = <T,>(data: T[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0] as object);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View revenue, utilization, and client insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Date Range & Grouping</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month' | 'year')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleQuickDateRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleQuickDateRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCurrentMonth}>
                This Month
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {formatCurrency(revenueSummary.totalRevenue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{revenueSummary.totalBookings} bookings</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Average Revenue</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(revenueSummary.averageRevenue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">per booking</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Room Utilization</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {utilizationSummary.averageUtilization.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {utilizationSummary.confirmedBookings} / {utilizationSummary.totalBookings} confirmed
            </p>
          </div>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(revenueData, 'revenue-report')}>
              Export CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Room Utilization Chart */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Room Utilization & Revenue</h3>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(utilizationData, 'utilization-report')}>
              Export CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar yAxisId="left" dataKey="total_bookings" fill="#3B82F6" name="Total Bookings" />
              <Bar yAxisId="left" dataKey="confirmed_bookings" fill="#10B981" name="Confirmed Bookings" />
              <Bar yAxisId="right" dataKey="total_revenue" fill="#F59E0B" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top Clients */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Clients by Revenue</h3>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(clientData, 'client-analytics')}>
              Export CSV
            </Button>
          </div>
          
          {/* Top Clients Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="organization_name" width={150} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total_spent" fill="#F59E0B" name="Total Revenue" />
            </BarChart>
          </ResponsiveContainer>

          {/* Client Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clientSummary.totalClients}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(clientSummary.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Spend/Client</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(clientSummary.averageSpendPerClient)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Bookings/Client</p>
              <p className="text-2xl font-bold text-blue-600">{clientSummary.averageBookingsPerClient.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Details Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Room Performance Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {utilizationData.map((room) => (
                    <tr key={room.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {room.confirmed_bookings}/{room.total_bookings}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(room.total_revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{room.avg_attendees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Client Details Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Client Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientData.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{client.organization_name}</div>
                        <div className="text-xs text-gray-500">{client.contact_person}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {client.confirmed_bookings}/{client.total_bookings}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(client.total_spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
