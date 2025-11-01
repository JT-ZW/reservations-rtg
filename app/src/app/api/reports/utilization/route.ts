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
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, final_amount, number_of_attendees')
        .eq('room_id', room.id);

      if (bookingsError) throw bookingsError;

      const total_bookings = bookings?.length || 0;
      const confirmed_bookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0;
      const total_revenue = bookings
        ?.filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;
      const avg_attendees = confirmed_bookings > 0
        ? bookings
            ?.filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (b.number_of_attendees || 0), 0) / confirmed_bookings
        : 0;

      utilizationData.push({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        total_bookings,
        confirmed_bookings,
        total_revenue,
        avg_attendees: Math.round(avg_attendees),
      });
    }

    // Sort by total bookings
    utilizationData.sort((a, b) => b.total_bookings - a.total_bookings);

    // Calculate overall stats
    const totalBookings = utilizationData.reduce((sum, room) => sum + room.total_bookings, 0);
    const totalRevenue = utilizationData.reduce((sum, room) => sum + room.total_revenue, 0);
    const confirmedBookings = utilizationData.reduce((sum, room) => sum + room.confirmed_bookings, 0);

    return NextResponse.json({
      data: utilizationData,
      summary: {
        totalRooms: utilizationData.length,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageUtilization: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
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
