/**
 * Generate Invoice API
 * POST /api/documents/invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvoice } from '@/lib/documents/pdf-generator';
import { errorResponse, handleApiError, getAuthenticatedClient } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedClient();
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return errorResponse('Booking ID is required', 400);
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404);
    }

    // Only generate invoices for confirmed bookings
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return errorResponse('Only confirmed bookings can have invoices generated', 400);
    }

    // Fetch related data
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', booking.client_id)
      .single();

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', booking.room_id)
      .single();

    const { data: event_type } = await supabase
      .from('event_types')
      .select('*')
      .eq('id', booking.event_type_id)
      .single();

    // Fetch booking addons
    const { data: bookingAddons } = await supabase
      .from('booking_addons')
      .select('*')
      .eq('booking_id', bookingId);

    const addons = [];
    if (bookingAddons) {
      for (const ba of bookingAddons) {
        const { data: addon } = await supabase
          .from('addons')
          .select('*')
          .eq('id', ba.addon_id)
          .single();
        
        if (addon) {
          addons.push({
            ...ba,
            addon: {
              name: addon.name,
              unit: addon.unit,
            },
          });
        }
      }
    }

    const documentNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Generate PDF
    const pdfBlob = await generateInvoice({
      booking: {
        ...booking,
        client: client || undefined,
        room: room || undefined,
        event_type: event_type || undefined,
      },
      addons,
      documentNumber,
      documentType: 'invoice',
    });

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF as download
    const fileName = `Invoice-${documentNumber}-${booking.booking_number}.pdf`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
