import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

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

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, organization_name, contact_person, email')
      .eq('is_active', true);

    if (clientsError) throw clientsError;

    // Fetch bookings for each client
    const clientAnalytics: ClientAnalytics[] = [];

    for (const client of clients || []) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, final_amount, created_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const total_bookings = bookings?.length || 0;
      const confirmed_bookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0;
      const total_spent = bookings
        ?.filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;
      const last_booking_date = bookings && bookings.length > 0 ? bookings[0].created_at : null;

      // Only include clients with at least one booking
      if (total_bookings > 0) {
        clientAnalytics.push({
          id: client.id,
          organization_name: client.organization_name,
          contact_person: client.contact_person,
          email: client.email,
          total_bookings,
          confirmed_bookings,
          total_spent,
          last_booking_date,
        });
      }
    }

    // Sort by total spent (top clients by revenue)
    clientAnalytics.sort((a, b) => b.total_spent - a.total_spent);

    // Get top N clients
    const topClients = clientAnalytics.slice(0, limit);

    // Calculate summary stats
    const totalClients = clientAnalytics.length;
    const totalRevenue = clientAnalytics.reduce((sum, client) => sum + client.total_spent, 0);
    const averageSpendPerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    const totalBookings = clientAnalytics.reduce((sum, client) => sum + client.total_bookings, 0);

    return NextResponse.json({
      data: topClients,
      summary: {
        totalClients,
        totalRevenue,
        averageSpendPerClient,
        totalBookings,
        averageBookingsPerClient: totalClients > 0 ? totalBookings / totalClients : 0,
      },
    });
  } catch (error) {
    console.error('Client analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate client analytics' },
      { status: 500 }
    );
  }
}
