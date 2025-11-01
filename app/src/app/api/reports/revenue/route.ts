import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

interface RevenueData {
  period: string;
  revenue: number;
  bookings: number;
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
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month, year

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch bookings in date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_date, final_amount, status')
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .in('status', ['confirmed', 'completed'])
      .order('start_date');

    if (error) throw error;

    // Group revenue by period
    const revenueMap = new Map<string, { revenue: number; bookings: number }>();

    bookings?.forEach((booking: { start_date: string; final_amount: number; status: string }) => {
      const date = new Date(booking.start_date);
      let periodKey: string;

      switch (groupBy) {
        case 'week':
          // Get week number
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil(
            ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
          );
          periodKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          periodKey = `${date.getFullYear()}`;
          break;
        case 'day':
        default:
          periodKey = booking.start_date;
          break;
      }

      const current = revenueMap.get(periodKey) || { revenue: 0, bookings: 0 };
      revenueMap.set(periodKey, {
        revenue: current.revenue + (booking.final_amount || 0),
        bookings: current.bookings + 1,
      });
    });

    // Convert to array and sort
    const revenueData: RevenueData[] = Array.from(revenueMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        bookings: data.bookings,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate totals
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalBookings = revenueData.reduce((sum, item) => sum + item.bookings, 0);

    return NextResponse.json({
      data: revenueData,
      summary: {
        totalRevenue,
        totalBookings,
        averageRevenue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      },
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate revenue report' },
      { status: 500 }
    );
  }
}
