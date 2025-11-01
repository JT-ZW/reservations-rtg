/**
 * Quotation Generation API
 * Generates PDF quotation/proforma invoice for bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const params = await context.params;
    const bookingId = params.id;

    // Fetch booking with all related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients!client_id (
          id,
          organization_name,
          contact_person,
          email,
          phone,
          address,
          city,
          country
        ),
        room:rooms!room_id (
          id,
          name,
          capacity
        ),
        event_type:event_types!event_type_id (
          id,
          name
        ),
        created_by_user:users!created_by (
          id,
          full_name,
          email,
          phone,
          mobile,
          facebook,
          skype,
          address
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Return booking data for PDF generation
    return NextResponse.json({
      booking: {
        ...booking,
        client: booking.client,
        room: booking.room,
        event_type: booking.event_type,
        reservationist: booking.created_by_user,
      },
    });
  } catch (error) {
    console.error('Error fetching quotation data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
