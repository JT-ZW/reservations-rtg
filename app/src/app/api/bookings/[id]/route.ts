/**
 * Bookings API - Get, Update, Delete specific booking
 * GET /api/bookings/[id] - Get booking by ID
 * PUT /api/bookings/[id] - Update booking
 * DELETE /api/bookings/[id] - Delete booking
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getAuthenticatedClient,
  parseRequestBody,
  logActivity,
} from '@/lib/api/utils';
import { updateBookingSchema } from '@/lib/validations/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // First, auto-complete this booking if it should be completed
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    // Check and update if booking is confirmed and has passed
    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('status', 'confirmed')
      .or(`end_date.lt.${currentDate},and(end_date.eq.${currentDate},end_time.lt.${currentTime})`);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        room:rooms(*),
        event_type:event_types(*),
        booking_addons(
          *,
          addon:addons(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Booking not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/bookings/[id]
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validatedData = updateBookingSchema.parse(body);
    
    // If updating room/dates/times, check for conflicts
    if (
      validatedData.room_id ||
      validatedData.start_date ||
      validatedData.end_date ||
      validatedData.start_time ||
      validatedData.end_time
    ) {
      // Get current booking data
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('room_id, start_date, end_date, start_time, end_time')
        .eq('id', id)
        .single();

      if (currentBooking) {
        const { data: conflictCheck, error: conflictError } = await supabase
          .rpc('check_booking_conflict', {
            p_room_id: validatedData.room_id || currentBooking.room_id,
            p_start_date: validatedData.start_date || currentBooking.start_date,
            p_end_date: validatedData.end_date || currentBooking.end_date,
            p_start_time: validatedData.start_time || currentBooking.start_time,
            p_end_time: validatedData.end_time || currentBooking.end_time,
            p_exclude_booking_id: id,
          });

        if (conflictError) {
          return errorResponse('Failed to check for conflicts', 500);
        }

        if (conflictCheck && conflictCheck.length > 0 && conflictCheck[0].has_conflict) {
          return errorResponse(
            `Booking conflict detected with ${conflictCheck[0].conflicting_event_name} (${conflictCheck[0].conflicting_booking_number})`,
            409
          );
        }
      }
    }
    
    // Update booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        ...validatedData,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Booking not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'update',
      entityType: 'booking',
      entityId: booking.id,
      details: {
        booking_number: booking.booking_number,
        changes: validatedData,
      },
    });

    return successResponse(booking, 'Booking updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // Get booking details for logging
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_number, event_name')
      .eq('id', id)
      .single();

    // Delete booking (cascade will handle addons)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    // Log activity
    if (booking) {
      await logActivity({
        userId: user.id,
        action: 'delete',
        entityType: 'booking',
        entityId: id,
        details: {
          booking_number: booking.booking_number,
          event_name: booking.event_name,
        },
      });
    }

    return successResponse(null, 'Booking deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
