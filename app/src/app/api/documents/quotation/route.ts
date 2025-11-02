/**
 * Generate Quotation API
 * POST /api/documents/quotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuotation } from '@/lib/documents/pdf-generator';
import { errorResponse, handleApiError, getAuthenticatedClient } from '@/lib/api/utils';
import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return errorResponse('Booking ID is required', 400);
    }

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 404);
    }

    // Fetch client
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', booking.client_id)
      .single();

    // Fetch room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', booking.room_id)
      .single();

    // Fetch event type
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

    // Fetch addon details
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

    const documentNumber = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Generate PDF
    const pdfBlob = await generateQuotation({
      booking: {
        ...booking,
        client: client || undefined,
        room: room || undefined,
        event_type: event_type || undefined,
      },
      addons,
      documentNumber,
      documentType: 'quotation',
    });

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Log quotation generation
    await logAudit({
      action: 'EXPORT',
      resourceType: 'document',
      resourceId: bookingId,
      resourceName: `Quotation ${documentNumber}`,
      description: `Generated quotation ${documentNumber} for booking ${booking.booking_number}`,
      metadata: {
        document_type: 'quotation',
        document_number: documentNumber,
        booking_number: booking.booking_number,
        amount: booking.final_amount || booking.total_amount,
        client_name: client?.organization_name,
      },
    }, extractRequestContext(request));

    // Return PDF as download
    const fileName = `Quotation-${documentNumber}-${booking.booking_number}.pdf`;
    
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
