'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';
import type { Database } from '@/types/database.types';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Dynamic import to avoid SSR issues with FullCalendar
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'];
  room?: Database['public']['Tables']['rooms']['Row'];
};

type Room = Database['public']['Tables']['rooms']['Row'];

// Status color mapping
const STATUS_COLORS = {
  tentative: '#FCD34D', // yellow-300
  confirmed: '#34D399', // green-400
  cancelled: '#EF4444', // red-500
  completed: '#9CA3AF', // gray-400
};

const STATUS_TEXT_COLORS = {
  tentative: '#78350F', // yellow-900
  confirmed: '#065F46', // green-900
  cancelled: '#FFFFFF', // white
  completed: '#FFFFFF', // white
};

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'calendar' or 'timeline'
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedTimelineRoom, setSelectedTimelineRoom] = useState<string>(''); // For highlighting in timeline
  
  // Timeline date range
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(new Date());
  const [timelineDays, setTimelineDays] = useState<number>(30); // How many days to show

  // Filters
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');

  // Fetch rooms
  useEffect(() => {
    if (!user) return;

    fetch('/api/rooms?limit=100', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setRooms(result.data);
        }
      })
      .catch(console.error);
  }, [user]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) {
      console.log('Calendar: No user, skipping fetch');
      return;
    }

    console.log('Calendar: Starting booking fetch');

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('limit', '100'); // Max limit for calendar view
      
      if (selectedRoom) params.set('room_id', selectedRoom);
      if (selectedStatus) params.set('status', selectedStatus);

      console.log('Calendar: Fetching with params:', params.toString());

      const response = await fetch(`/api/bookings?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('Calendar: Response status:', response.status);
      
      const result = await response.json();
      
      console.log('Calendar: Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }

      setBookings(result.data || []);
      console.log('Calendar: Bookings set:', result.data?.length || 0);
    } catch (err) {
      console.error('Calendar: Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      console.log('Calendar: Fetch complete, setting loading to false');
      setLoading(false);
    }
  }, [user, selectedRoom, selectedStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Convert bookings to FullCalendar events
  const events: EventInput[] = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.event_name}${booking.room?.name ? ` - ${booking.room.name}` : ''}`,
    start: `${booking.start_date}T${booking.start_time}`,
    end: `${booking.end_date}T${booking.end_time}`,
    backgroundColor: STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS],
    borderColor: STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS],
    textColor: STATUS_TEXT_COLORS[booking.status as keyof typeof STATUS_TEXT_COLORS],
    extendedProps: {
      bookingNumber: booking.booking_number,
      client: booking.client?.organization_name || 'N/A',
      room: booking.room?.name || 'N/A',
      status: booking.status,
      attendees: booking.number_of_attendees,
    },
  }));

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    router.push(`/bookings/${clickInfo.event.id}`);
  };

  // Handle date click (create new booking)
  const handleDateClick = (dateInfo: { dateStr: string }) => {
    router.push(`/bookings/new?date=${dateInfo.dateStr}`);
  };

  const handleClearFilters = () => {
    setSelectedRoom('');
    setSelectedStatus('');
  };

  // Timeline navigation functions
  const moveTimelineForward = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setDate(newDate.getDate() + timelineDays);
    setTimelineStartDate(newDate);
  };

  const moveTimelineBackward = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setDate(newDate.getDate() - timelineDays);
    setTimelineStartDate(newDate);
  };

  const jumpToToday = () => {
    setTimelineStartDate(new Date());
  };

  const jumpToNextWeek = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    setTimelineStartDate(date);
    setTimelineDays(7);
  };

  const jumpToNextMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1); // Start of next month
    setTimelineStartDate(date);
    setTimelineDays(30);
  };

  const jumpToThisMonth = () => {
    const date = new Date();
    date.setDate(1); // Start of current month
    setTimelineStartDate(date);
    setTimelineDays(30);
  };

  const setTimelineView = (days: number) => {
    setTimelineDays(days);
    setTimelineStartDate(new Date()); // Reset to today when changing view
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage bookings in calendar view
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('calendar')}
              >
                📅 Calendar View
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('timeline')}
              >
                📊 Room Timeline
              </Button>
            </div>
            <Button onClick={() => router.push('/bookings/new')}>
              Create Booking
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Filters & View Controls */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* View Toggle */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <div className="flex gap-2">
                <Button
                  variant={currentView === 'dayGridMonth' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('dayGridMonth')}
                >
                  Month
                </Button>
                <Button
                  variant={currentView === 'timeGridWeek' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('timeGridWeek')}
                >
                  Week
                </Button>
                <Button
                  variant={currentView === 'timeGridDay' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('timeGridDay')}
                >
                  Day
                </Button>
              </div>
            </div>

            {/* Room Filter */}
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Filter by Room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                options={[
                  { value: '', label: 'All Rooms' },
                  ...rooms.map(room => ({ value: room.id, label: room.name })),
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Filter by Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'tentative', label: 'Tentative' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>

            {/* Clear Filters */}
            {(selectedRoom || selectedStatus) && (
              <div className="pt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium text-gray-700">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.tentative }}></div>
              <span>Tentative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.confirmed }}></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.cancelled }}></div>
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.completed }}></div>
              <span>Completed</span>
            </div>
          </div>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                <div className="text-gray-500">Loading calendar...</div>
                <div className="text-xs text-gray-400 mt-2">Fetching {bookings.length} bookings</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-red-600 text-center">
                  <p className="font-semibold mb-2">Error loading calendar</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={currentView}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  views={{
                    dayGridMonth: { buttonText: 'Month' },
                    timeGridWeek: { buttonText: 'Week' },
                    timeGridDay: { buttonText: 'Day' },
                  }}
                  events={events}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  height="auto"
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  allDaySlot={false}
                  nowIndicator={true}
                  editable={false}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  viewDidMount={(info) => {
                    const viewType = info.view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
                    setCurrentView(viewType);
                  }}
                />
              </div>
            )}
          </Card>
        )}

        {/* Room Timeline View */}
        {viewMode === 'timeline' && (
          <>
            {/* Timeline Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Date Range Display */}
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Viewing: </span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {timelineStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {' - '}
                      {new Date(timelineStartDate.getTime() + (timelineDays - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Previous/Next */}
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" onClick={moveTimelineBackward}>
                      ← Previous
                    </Button>
                    <Button variant="secondary" size="sm" onClick={jumpToToday}>
                      Today
                    </Button>
                    <Button variant="secondary" size="sm" onClick={moveTimelineForward}>
                      Next →
                    </Button>
                  </div>

                  {/* Quick Jumps */}
                  <div className="border-l pl-2 flex gap-1">
                    <Button variant="secondary" size="sm" onClick={jumpToThisMonth}>
                      This Month
                    </Button>
                    <Button variant="secondary" size="sm" onClick={jumpToNextWeek}>
                      Next Week
                    </Button>
                    <Button variant="secondary" size="sm" onClick={jumpToNextMonth}>
                      Next Month
                    </Button>
                  </div>

                  {/* View Duration */}
                  <div className="border-l pl-2 flex gap-1">
                    <Button
                      variant={timelineDays === 7 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimelineView(7)}
                    >
                      7 Days
                    </Button>
                    <Button
                      variant={timelineDays === 14 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimelineView(14)}
                    >
                      14 Days
                    </Button>
                    <Button
                      variant={timelineDays === 30 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimelineView(30)}
                    >
                      30 Days
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                <div className="text-gray-500">Loading timeline...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-red-600 text-center">
                  <p className="font-semibold mb-2">Error loading timeline</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6">
                {/* Room List Sidebar */}
                <div className="w-64 shrink-0 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rooms</h3>
                  <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
                    {rooms
                      .filter(room => !selectedRoom || room.id === selectedRoom)
                      .map(room => {
                        const roomBookings = bookings.filter(b => b.room_id === room.id);
                        const confirmedBookings = roomBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
                        
                        return (
                          <button
                            key={room.id}
                            onClick={() => setSelectedTimelineRoom(selectedTimelineRoom === room.id ? '' : room.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedTimelineRoom === room.id
                                ? 'bg-amber-50 border-2 border-amber-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{room.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Capacity: {room.capacity} | Bookings: {confirmedBookings.length}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Timeline Header - Days */}
                    <div className="flex border-b-2 border-gray-300 pb-2 mb-4">
                      <div className="w-48 shrink-0 font-semibold text-gray-700">Room</div>
                      <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: `repeat(${timelineDays}, minmax(0, 1fr))` }}>
                        {Array.from({ length: timelineDays }, (_, i) => {
                          const date = new Date(timelineStartDate);
                          date.setDate(date.getDate() + i);
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          return (
                            <div key={i} className={`text-center text-xs font-medium ${isToday ? 'text-amber-600 font-bold' : 'text-gray-600'}`}>
                              <div>{date.getDate()}</div>
                              <div className="text-[10px] text-gray-400">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Rows */}
                    <div className="space-y-3">
                      {rooms
                        .filter(room => !selectedRoom || room.id === selectedRoom)
                        .filter(room => !selectedTimelineRoom || room.id === selectedTimelineRoom)
                        .map(room => {
                          const roomBookings = bookings.filter(b => b.room_id === room.id);
                          
                          return (
                            <div
                              key={room.id}
                              className={`flex items-center border rounded-lg p-2 ${
                                selectedTimelineRoom === room.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="w-48 shrink-0 pr-4">
                                <div className="font-medium text-gray-900 truncate">{room.name}</div>
                                <div className="text-xs text-gray-500">Cap: {room.capacity}</div>
                              </div>
                              
                              <div className="flex-1 relative h-12 bg-gray-50 rounded">
                                {/* Today indicator */}
                                {(() => {
                                  const today = new Date();
                                  const daysSinceStart = Math.floor((today.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                  if (daysSinceStart >= 0 && daysSinceStart < timelineDays) {
                                    const position = (daysSinceStart / timelineDays) * 100;
                                    return (
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                        style={{ left: `${position}%` }}
                                        title="Today"
                                      />
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* Booking blocks */}
                                {roomBookings.map(booking => {
                                  const startDate = new Date(booking.start_date);
                                  const endDate = new Date(booking.end_date);
                                  
                                  // Calculate position and width based on timeline range
                                  const daysSinceStart = Math.floor((startDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                  const duration = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                  
                                  // Only show if within visible range
                                  if (daysSinceStart < timelineDays && daysSinceStart + duration > 0) {
                                    // Clip to visible range
                                    const visibleStart = Math.max(0, daysSinceStart);
                                    const visibleEnd = Math.min(timelineDays, daysSinceStart + duration);
                                    const visibleDuration = visibleEnd - visibleStart;
                                    
                                    const left = (visibleStart / timelineDays) * 100;
                                    const width = (visibleDuration / timelineDays) * 100;
                                    
                                    return (
                                      <button
                                        key={booking.id}
                                        onClick={() => router.push(`/bookings/${booking.id}`)}
                                        className="absolute top-1 h-10 rounded px-2 text-xs font-medium text-white hover:opacity-90 transition-opacity overflow-hidden"
                                        style={{
                                          left: `${left}%`,
                                          width: `${width}%`,
                                          backgroundColor: STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS],
                                        }}
                                        title={`${booking.event_name} - ${booking.client?.organization_name || 'N/A'}\n${booking.start_date} to ${booking.end_date}`}
                                      >
                                        <div className="truncate">{booking.event_name}</div>
                                        {visibleDuration > 2 && (
                                          <div className="text-[10px] opacity-90 truncate">
                                            {booking.client?.organization_name || 'N/A'}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {rooms.filter(room => !selectedRoom || room.id === selectedRoom).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No rooms found. Please add rooms first.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
          </>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Bookings</div>
            <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Tentative</div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.tentative }}>
              {bookings.filter(b => b.status === 'tentative').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Confirmed</div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.confirmed }}>
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.completed }}>
              {bookings.filter(b => b.status === 'completed').length}
            </div>
          </Card>
        </div>
      </div>

      {/* FullCalendar CSS */}
      <style jsx global>{`
        .calendar-container {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #f59e0b;
          --fc-button-border-color: #f59e0b;
          --fc-button-hover-bg-color: #d97706;
          --fc-button-hover-border-color: #d97706;
          --fc-button-active-bg-color: #b45309;
          --fc-button-active-border-color: #b45309;
          --fc-today-bg-color: #fef3c7;
        }

        .fc {
          font-family: inherit;
        }

        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.875rem;
        }

        .fc-event:hover {
          opacity: 0.9;
        }

        .fc-daygrid-event {
          margin: 1px 2px;
        }

        .fc-timegrid-event {
          border-radius: 4px;
        }

        .fc .fc-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .fc .fc-button-primary:not(:disabled):active,
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: var(--fc-button-active-bg-color);
          border-color: var(--fc-button-active-border-color);
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }

        .fc-col-header-cell {
          background-color: #f9fafb;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #6b7280;
          padding: 0.75rem 0;
        }

        .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
        }

        .fc-scrollgrid {
          border-color: var(--fc-border-color);
        }
      `}</style>
    </DashboardLayout>
  );
}
