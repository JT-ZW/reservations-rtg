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
  PieChart,
  Pie,
  Cell,
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
  utilization_rate?: number;
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

interface EventTypeAnalytics {
  event_type: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  average_revenue: number;
  total_attendees: number;
  average_attendees: number;
  conversion_rate: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  revenue: number;
  next_stage_conversion: number | null;
}

export default function ReportsPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'events' | 'clients'>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Revenue data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueSummary, setRevenueSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRevenue: 0,
  });

  // Room utilization data
  const [utilizationData, setUtilizationData] = useState<RoomUtilization[]>([]);
  const [utilizationSummary, setUtilizationSummary] = useState({
    totalRooms: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    averageUtilization: 0,
  });
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 10;

  // Client data
  const [clientData, setClientData] = useState<ClientAnalytics[]>([]);
  const [clientSummary, setClientSummary] = useState({
    totalClients: 0,
    totalRevenue: 0,
    averageSpendPerClient: 0,
    totalBookings: 0,
    averageBookingsPerClient: 0,
  });

  // Event type data
  const [eventTypeData, setEventTypeData] = useState<EventTypeAnalytics[]>([]);
  const [eventTypeSummary, setEventTypeSummary] = useState({
    total_event_types: 0,
    most_popular: '',
    highest_revenue: '',
  });

  // Conversion funnel data
  const [conversionData, setConversionData] = useState<ConversionFunnel[]>([]);
  const [conversionSummary, setConversionSummary] = useState({
    overall_conversion_rate: 0,
    cancellation_rate: 0,
    total_revenue: 0,
    lost_revenue: 0,
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
    const response = await fetch(
      `/api/reports/utilization?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    );
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

  const fetchEventTypeAnalytics = async () => {
    const response = await fetch('/api/reports/event-types');
    if (response.ok) {
      const result = await response.json();
      setEventTypeData(result.data);
      setEventTypeSummary(result.summary);
    }
  };

  const fetchConversionReport = async () => {
    const response = await fetch('/api/reports/conversion');
    if (response.ok) {
      const result = await response.json();
      setConversionData(result.data);
      setConversionSummary(result.summary);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRevenueReport(),
          fetchUtilizationReport(),
          fetchClientAnalytics(),
          fetchEventTypeAnalytics(),
          fetchConversionReport(),
        ]);
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

  // Pagination for rooms
  const paginatedRooms = utilizationData.slice(
    (roomPage - 1) * roomsPerPage,
    roomPage * roomsPerPage
  );
  const totalRoomPages = Math.ceil(utilizationData.length / roomsPerPage);

  // Chart colors
  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#84CC16'];

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
          <p className="text-gray-600 mt-1">Comprehensive insights into revenue, events, rooms, and clients</p>
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
            <div className="flex items-end gap-2 flex-wrap">
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`${
              activeTab === 'rooms'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Rooms
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`${
              activeTab === 'events'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Event Types
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`${
              activeTab === 'clients'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Clients
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {conversionSummary.overall_conversion_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cancellation: {conversionSummary.cancellation_rate.toFixed(1)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Room Utilization</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {utilizationSummary.averageUtilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {utilizationSummary.totalRooms} rooms tracked
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Avg Revenue</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {formatCurrency(revenueSummary.averageRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">per booking</p>
              </div>
            </Card>
          </div>

          {/* Revenue Trend - Combined Chart */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Revenue & Bookings Trend</h3>
                <Button variant="secondary" size="sm" onClick={() => exportToCSV(revenueData, 'revenue-report')}>
                  Export CSV
                </Button>
              </div>
              <div className="space-y-4">
                {/* Revenue Bar Chart */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Daily Revenue</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#F59E0B" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Bookings Bar Chart */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Daily Bookings</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => `${value} ${value === 1 ? 'booking' : 'bookings'}`}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="bookings" fill="#10B981" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>

          {/* Conversion Funnel & Event Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Booking Conversion Funnel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Bookings') return `${value} bookings`;
                        return formatCurrency(value);
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(conversionSummary.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lost Revenue</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(conversionSummary.lost_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Event Type Distribution */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Event Type Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypeData.map(e => ({ name: e.event_type, value: e.total_bookings }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Most Popular</p>
                      <p className="text-lg font-semibold text-gray-900">{eventTypeSummary.most_popular}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Highest Revenue</p>
                      <p className="text-lg font-semibold text-gray-900">{eventTypeSummary.highest_revenue}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Room Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Rooms</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{utilizationSummary.totalRooms}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Avg Utilization</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {utilizationSummary.averageUtilization.toFixed(1)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{utilizationSummary.totalBookings}</p>
                <p className="text-sm text-gray-500 mt-1">{utilizationSummary.confirmedBookings} confirmed</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {formatCurrency(utilizationSummary.totalRevenue)}
                </p>
              </div>
            </Card>
          </div>

          {/* Room Utilization Chart - Separated metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Room Utilization Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paginatedRooms}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="utilization_rate" fill="#3B82F6" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Room Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paginatedRooms}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total_revenue" fill="#F59E0B" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Room Details Table with Pagination */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Room Performance Details</h3>
                <Button variant="secondary" size="sm" onClick={() => exportToCSV(utilizationData, 'room-utilization')}>
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bookings</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRooms.map((room) => (
                      <tr key={room.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{room.capacity}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold">
                          {room.utilization_rate ? `${room.utilization_rate.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {room.confirmed_bookings}/{room.total_bookings}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                          {formatCurrency(room.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{room.avg_attendees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalRoomPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(roomPage - 1) * roomsPerPage + 1} to {Math.min(roomPage * roomsPerPage, utilizationData.length)} of {utilizationData.length} rooms
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRoomPage(p => Math.max(1, p - 1))}
                      disabled={roomPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-3 py-1 text-sm text-gray-700">
                      Page {roomPage} of {totalRoomPages}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRoomPage(p => Math.min(totalRoomPages, p + 1))}
                      disabled={roomPage === totalRoomPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Event Types Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Event Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Event Categories</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{eventTypeSummary.total_event_types}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Most Popular</h3>
                <p className="text-xl font-bold text-blue-600 mt-2">{eventTypeSummary.most_popular}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Highest Revenue</h3>
                <p className="text-xl font-bold text-green-600 mt-2">{eventTypeSummary.highest_revenue}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {eventTypeData.reduce((sum, evt) => sum + evt.total_bookings, 0)}
                </p>
              </div>
            </Card>
          </div>

          {/* Event Type Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bookings by Event Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="confirmed_bookings" fill="#10B981" name="Confirmed" />
                    <Bar dataKey="completed_bookings" fill="#3B82F6" name="Completed" />
                    <Bar dataKey="cancelled_bookings" fill="#EF4444" name="Cancelled" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue by Event Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total_revenue" fill="#F59E0B" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Event Type Details Table */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Type Performance</h3>
                <Button variant="secondary" size="sm" onClick={() => exportToCSV(eventTypeData, 'event-type-analytics')}>
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Conversion</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Revenue</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Attendees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {eventTypeData.map((event) => (
                      <tr key={event.event_type}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.event_type}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{event.total_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">{event.confirmed_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">{event.completed_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">{event.cancelled_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {event.conversion_rate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(event.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(event.average_revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {event.average_attendees.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Client Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Clients</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{clientSummary.totalClients}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {formatCurrency(clientSummary.totalRevenue)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Avg Spend/Client</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(clientSummary.averageSpendPerClient)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Avg Bookings/Client</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {clientSummary.averageBookingsPerClient.toFixed(1)}
                </p>
              </div>
            </Card>
          </div>

          {/* Top Clients Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 Clients by Revenue</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="organization_name" width={150} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_spent" fill="#F59E0B" name="Total Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Client Details Table */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Top Client Details</h3>
                <Button variant="secondary" size="sm" onClick={() => exportToCSV(clientData, 'client-analytics')}>
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Bookings</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Booking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientData.map((client) => (
                      <tr key={client.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.organization_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.contact_person}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{client.total_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">{client.confirmed_bookings}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(client.total_spent)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {client.last_booking_date ? format(new Date(client.last_booking_date), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
