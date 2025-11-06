import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

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

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency'); // USD, ZWG, or null for all

    // Build query - get bookings with event type joined
    let query = supabase
      .from('bookings')
      .select(`
        status,
        final_amount,
        number_of_attendees,
        start_date,
        currency,
        event_types!event_type_id (name)
      `);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }
    
    // Apply currency filter
    if (currency && currency !== 'ALL') {
      query = query.eq('currency', currency);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Event type analytics query error:', error);
      throw error;
    }

    // Group by event type
    const eventTypeMap = new Map<string, {
      total: number;
      confirmed: number;
      cancelled: number;
      completed: number;
      revenue: number;
      attendees: number;
    }>();

    bookings?.forEach((booking: any) => {
      const eventType = booking.event_types?.name || 'Unspecified';
      const current = eventTypeMap.get(eventType) || {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
        revenue: 0,
        attendees: 0,
      };

      current.total += 1;
      
      switch (booking.status) {
        case 'confirmed':
          current.confirmed += 1;
          current.revenue += booking.final_amount || 0;
          current.attendees += booking.number_of_attendees || 0;
          break;
        case 'completed':
          current.completed += 1;
          current.revenue += booking.final_amount || 0;
          current.attendees += booking.number_of_attendees || 0;
          break;
        case 'cancelled':
          current.cancelled += 1;
          break;
      }

      eventTypeMap.set(eventType, current);
    });

    // Convert to array with calculated metrics
    const eventTypeData: EventTypeAnalytics[] = Array.from(eventTypeMap.entries())
      .map(([event_type, data]) => {
        const successful_bookings = data.confirmed + data.completed;
        return {
          event_type,
          total_bookings: data.total,
          confirmed_bookings: data.confirmed,
          cancelled_bookings: data.cancelled,
          completed_bookings: data.completed,
          total_revenue: data.revenue,
          average_revenue: successful_bookings > 0 ? data.revenue / successful_bookings : 0,
          total_attendees: data.attendees,
          average_attendees: successful_bookings > 0 ? Math.round(data.attendees / successful_bookings) : 0,
          conversion_rate: data.total > 0 ? (successful_bookings / data.total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total_bookings - a.total_bookings);

    // Calculate summary
    const summary = {
      total_bookings: eventTypeData.reduce((sum, item) => sum + item.total_bookings, 0),
      total_revenue: eventTypeData.reduce((sum, item) => sum + item.total_revenue, 0),
      total_event_types: eventTypeData.length,
      most_popular: eventTypeData[0]?.event_type || 'N/A',
      highest_revenue: eventTypeData.reduce((max, item) => 
        item.total_revenue > max.total_revenue ? item : max, 
        eventTypeData[0] || { event_type: 'N/A', total_revenue: 0 }
      ).event_type,
    };

    return NextResponse.json({
      data: eventTypeData,
      summary,
    });
  } catch (error) {
    console.error('Event type analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate event type analytics' },
      { status: 500 }
    );
  }
}
