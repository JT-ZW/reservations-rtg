/**
 * Dashboard Page
 * Main dashboard with role-based content and real-time metrics
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { UserRole } from '@/types';

// Disable caching for dashboard to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RecentBooking = {
  id: string;
  booking_number: string;
  event_name: string;
  status: string;
  start_date: string;
  created_at: string;
  client: {
    organization_name: string;
  } | null;
};

type UpcomingEvent = {
  id: string;
  booking_number: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  client: {
    organization_name: string;
  } | null;
  room: {
    name: string;
  } | null;
};

type Notification = {
  id: string;
  type: 'new_booking' | 'expiring_tentative' | 'status_change';
  message: string;
  timestamp: string;
  bookingId: string;
  priority: 'high' | 'medium' | 'low';
};

function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function getDashboardMetrics() {
  const supabase = await createClient();
  
  try {
    // Get total bookings count
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Get confirmed bookings count
    const { count: confirmedCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    // Get tentative bookings count
    const { count: tentativeCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'tentative');

    // Get active clients count
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get upcoming events (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const { data: upcomingEvents } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        event_name,
        start_date,
        end_date,
        start_time,
        end_time,
        status,
        clients!client_id(organization_name),
        rooms!room_id(name)
      `)
      .gte('start_date', today.toISOString().split('T')[0])
      .lte('start_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['confirmed', 'tentative'])
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5);

    const transformedUpcoming = (upcomingEvents || []).map((event) => ({
      id: event.id,
      booking_number: event.booking_number,
      event_name: event.event_name,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      client: (event as any).clients ? { organization_name: (event as any).clients.organization_name } : null,
      room: (event as any).rooms ? { name: (event as any).rooms.name } : null,
    })) as UpcomingEvent[];

    // Get notifications
    const notifications: Notification[] = [];

    // 1. New bookings in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: newBookings } = await supabase
      .from('bookings')
      .select('id, booking_number, event_name, created_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    (newBookings || []).forEach((booking) => {
      notifications.push({
        id: `new-${booking.id}`,
        type: 'new_booking',
        message: `New booking: ${booking.event_name}`,
        timestamp: booking.created_at,
        bookingId: booking.id,
        priority: 'medium',
      });
    });

    // 2. Tentative bookings older than 3 days (need confirmation)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { data: expiringTentative } = await supabase
      .from('bookings')
      .select('id, booking_number, event_name, created_at')
      .eq('status', 'tentative')
      .lte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(3);

    (expiringTentative || []).forEach((booking) => {
      const daysOld = Math.floor((Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `expiring-${booking.id}`,
        type: 'expiring_tentative',
        message: `Tentative booking needs confirmation: ${booking.event_name} (${daysOld} days old)`,
        timestamp: booking.created_at,
        bookingId: booking.id,
        priority: 'high',
      });
    });

    // Sort notifications by priority and timestamp
    notifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Get recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        event_name,
        status,
        start_date,
        created_at,
        clients!client_id(organization_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Transform the data to match our expected type
    const transformedBookings = (recentBookings || []).map((booking) => ({
      id: booking.id,
      booking_number: booking.booking_number,
      event_name: booking.event_name,
      status: booking.status,
      start_date: booking.start_date,
      created_at: booking.created_at,
      client: (booking as any).clients ? { organization_name: (booking as any).clients.organization_name } : null,
    })) as RecentBooking[];

    return {
      totalBookings: totalBookings || 0,
      confirmedCount: confirmedCount || 0,
      tentativeCount: tentativeCount || 0,
      clientsCount: clientsCount || 0,
      upcomingEvents: transformedUpcoming,
      notifications: notifications.slice(0, 5), // Limit to 5 notifications
      recentBookings: transformedBookings,
    };
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return {
      totalBookings: 0,
      confirmedCount: 0,
      tentativeCount: 0,
      clientsCount: 0,
      upcomingEvents: [],
      notifications: [],
      recentBookings: [],
    };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'tentative':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const metrics = await getDashboardMetrics();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5 rounded-2xl blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back, <span className="font-semibold text-brand-primary">{user.full_name}</span>!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-brand-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-brand-secondary rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📅</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalBookings}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="text-3xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Confirmed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.confirmedCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-brand-accent rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Tentative</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.tentativeCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-accent to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Clients</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.clientsCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {(user.role === UserRole.ADMIN || user.role === UserRole.RESERVATIONS || user.role === UserRole.SALES) && (
          <Card className="border-t-4 border-t-brand-accent shadow-premium">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center text-white text-sm">⚡</span>
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/bookings/new"
                  className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-brand-primary hover:shadow-premium transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">➕</div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">New Booking</h3>
                    <p className="text-sm text-gray-600">Create a new event booking</p>
                  </div>
                </a>

                <a
                  href="/clients"
                  className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-brand-secondary hover:shadow-premium transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/5 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">👥</div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">Manage Clients</h3>
                    <p className="text-sm text-gray-600">View and manage client records</p>
                  </div>
                </a>

                <a
                  href="/calendar"
                  className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-brand-accent hover:shadow-premium transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">🗓️</div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">View Calendar</h3>
                    <p className="text-sm text-gray-600">Check room availability</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout for Notifications and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <Card className="border-t-4 border-t-red-500 shadow-premium">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-sm">🔔</span>
                Notifications
              </CardTitle>
              <CardDescription>Important updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-3 opacity-50">✅</div>
                  <p className="font-medium text-sm">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.notifications.map((notification) => (
                    <a
                      key={notification.id}
                      href={`/bookings/${notification.bookingId}`}
                      className={`group block p-4 rounded-lg border-l-4 hover:shadow-md transition-all duration-200 ${
                        notification.priority === 'high'
                          ? 'border-red-500 bg-red-50 hover:bg-red-100'
                          : notification.priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                          : 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {notification.type === 'expiring_tentative' ? '⚠️' : 
                               notification.type === 'new_booking' ? '📝' : '🔄'}
                            </span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              notification.priority === 'high'
                                ? 'bg-red-200 text-red-800'
                                : notification.priority === 'medium'
                                ? 'bg-yellow-200 text-yellow-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-t-4 border-t-green-500 shadow-premium">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">📅</span>
                Upcoming Events
              </CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.upcomingEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-3 opacity-50">🗓️</div>
                  <p className="font-medium text-sm">No upcoming events</p>
                  <p className="text-xs text-gray-400 mt-1">Schedule is clear for the next week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.upcomingEvents.map((event) => {
                    const daysUntil = getDaysUntil(event.start_date);
                    const isToday = daysUntil === 0;
                    const isTomorrow = daysUntil === 1;
                    
                    return (
                      <a
                        key={event.id}
                        href={`/bookings/${event.id}`}
                        className="group block p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-premium transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                                {event.event_name}
                              </h4>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(event.status)}`}>
                                {event.status}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-1.5">
                                <span>🏢</span>
                                <span className="truncate">{event.client?.organization_name || 'No client'}</span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <span>🚪</span>
                                <span>{event.room?.name || 'No room'}</span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <span>🕐</span>
                                <span className="font-mono text-xs">{event.start_time} - {event.end_time}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 text-right">
                            {isToday ? (
                              <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg font-bold text-sm">
                                TODAY
                              </div>
                            ) : isTomorrow ? (
                              <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg font-bold text-sm">
                                TOMORROW
                              </div>
                            ) : (
                              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                                <div className="text-2xl font-bold">{daysUntil}</div>
                                <div className="text-xs text-gray-600">days</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-t-4 border-t-brand-accent shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-lg flex items-center justify-center text-white text-sm">📋</span>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest booking updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentBookings.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-5xl mb-4 opacity-50">📅</div>
                <p className="font-medium">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.recentBookings.map((booking) => (
                  <a
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="group flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-brand-primary hover:shadow-premium transition-all duration-300"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{booking.event_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.client?.organization_name || 'No client'} • <span className="font-mono text-xs">{booking.booking_number}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>📅</span> Event Date: {formatDate(booking.start_date)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
