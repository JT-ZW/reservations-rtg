import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

interface RoomUtilization {
  id: string;
  name: string;
  capacity: number;
  total_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  avg_attendees: number;
  utilization_rate: number;
  total_booked_days: number;
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency'); // USD or ZWG

    if (!currency || (currency !== 'USD' && currency !== 'ZWG')) {
      return NextResponse.json(
        { error: 'currency is required and must be either USD or ZWG' },
        { status: 400 }
      );
    }

    // Calculate total days in period
    let totalDays = 30; // default
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Fetch all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, capacity')
      .eq('is_available', true)
      .order('name');

    if (roomsError) throw roomsError;

    // Fetch bookings for each room
    const utilizationData: RoomUtilization[] = [];

    for (const room of rooms || []) {
      let bookingsQuery = supabase
        .from('bookings')
        .select('status, final_amount, number_of_attendees, start_date, end_date, currency')
        .eq('room_id', room.id)
        .eq('currency', currency);

      // Apply date filters
      if (startDate) {
        bookingsQuery = bookingsQuery.gte('end_date', startDate);
      }
      if (endDate) {
        bookingsQuery = bookingsQuery.lte('start_date', endDate);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) throw bookingsError;

      const total_bookings = bookings?.length || 0;
      const confirmed_bookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0;
      const total_revenue = bookings
        ?.filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;
      
      const attendees_data = bookings?.filter(b => 
        (b.status === 'confirmed' || b.status === 'completed') && b.number_of_attendees
      );
      const avg_attendees = attendees_data && attendees_data.length > 0
        ? Math.round(attendees_data.reduce((sum, b) => sum + (b.number_of_attendees || 0), 0) / attendees_data.length)
        : 0;

      // Calculate total booked days
      let total_booked_days = 0;
      bookings?.filter(b => b.status === 'confirmed' || b.status === 'completed').forEach(booking => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        total_booked_days += days;
      });

      // Utilization rate = (booked days / total available days) * 100
      const utilization_rate = totalDays > 0 ? (total_booked_days / totalDays) * 100 : 0;

      utilizationData.push({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        total_bookings,
        confirmed_bookings,
        total_revenue,
        avg_attendees,
        utilization_rate: Math.min(utilization_rate, 100), // Cap at 100%
        total_booked_days,
      });
    }

    // Sort by total revenue
    utilizationData.sort((a, b) => b.total_revenue - a.total_revenue);

    // Calculate overall stats
    const totalBookings = utilizationData.reduce((sum, room) => sum + room.total_bookings, 0);
    const totalRevenue = utilizationData.reduce((sum, room) => sum + room.total_revenue, 0);
    const confirmedBookings = utilizationData.reduce((sum, room) => sum + room.confirmed_bookings, 0);
    const averageUtilization = utilizationData.length > 0 
      ? utilizationData.reduce((sum, room) => sum + room.utilization_rate, 0) / utilizationData.length 
      : 0;

    return NextResponse.json({
      data: utilizationData,
      summary: {
        totalRooms: utilizationData.length,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageUtilization,
        totalDaysInPeriod: totalDays,
      },
    });
  } catch (error) {
    console.error('Utilization report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate utilization report' },
      { status: 500 }
    );
  }
}
