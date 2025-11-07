import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const currency = searchParams.get('currency');

    // Validate currency parameter
    if (!currency || (currency !== 'USD' && currency !== 'ZWG')) {
      return NextResponse.json(
        { error: 'Currency parameter is required and must be either USD or ZWG' },
        { status: 400 }
      );
    }

    // Build query - filter by start_date (when the booking actually occurs)
    let query = supabase
      .from('bookings')
      .select('status, final_amount, start_date, currency')
      .eq('currency', currency);

    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Count by status
    const statusCounts = {
      tentative: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    const statusRevenue = {
      tentative: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings?.forEach((booking) => {
      const status = booking.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status] += 1;
        statusRevenue[status] += booking.final_amount || 0;
      }
    });

    const total = bookings?.length || 0;

    // Calculate conversion rates
    const funnelData = [
      {
        stage: 'Tentative',
        count: statusCounts.tentative,
        percentage: total > 0 ? (statusCounts.tentative / total) * 100 : 0,
        revenue: statusRevenue.tentative,
        next_stage_conversion: statusCounts.tentative > 0 
          ? ((statusCounts.confirmed + statusCounts.completed) / (statusCounts.tentative + statusCounts.confirmed + statusCounts.completed + statusCounts.cancelled)) * 100 
          : 0,
      },
      {
        stage: 'Confirmed',
        count: statusCounts.confirmed,
        percentage: total > 0 ? (statusCounts.confirmed / total) * 100 : 0,
        revenue: statusRevenue.confirmed,
        next_stage_conversion: statusCounts.confirmed > 0 
          ? (statusCounts.completed / (statusCounts.confirmed + statusCounts.completed)) * 100 
          : 0,
      },
      {
        stage: 'Completed',
        count: statusCounts.completed,
        percentage: total > 0 ? (statusCounts.completed / total) * 100 : 0,
        revenue: statusRevenue.completed,
        next_stage_conversion: 100,
      },
      {
        stage: 'Cancelled',
        count: statusCounts.cancelled,
        percentage: total > 0 ? (statusCounts.cancelled / total) * 100 : 0,
        revenue: statusRevenue.cancelled,
        next_stage_conversion: 0,
      },
    ];

    // Calculate success metrics
    const successful_bookings = statusCounts.confirmed + statusCounts.completed;
    const overall_conversion_rate = total > 0 ? (successful_bookings / total) * 100 : 0;
    const cancellation_rate = total > 0 ? (statusCounts.cancelled / total) * 100 : 0;

    return NextResponse.json({
      data: funnelData,
      summary: {
        total_bookings: total,
        successful_bookings,
        cancelled_bookings: statusCounts.cancelled,
        overall_conversion_rate,
        cancellation_rate,
        total_revenue: statusRevenue.confirmed + statusRevenue.completed,
        lost_revenue: statusRevenue.cancelled,
      },
    });
  } catch (error) {
    console.error('Conversion report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate conversion report' },
      { status: 500 }
    );
  }
}
