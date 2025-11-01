/**
 * Booking Conflict Check API
 * POST /api/bookings/check-conflict - Check for booking conflicts
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getAuthenticatedClient,
  parseRequestBody,
} from '@/lib/api/utils';
import { conflictCheckSchema } from '@/lib/validations/schemas';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedClient();
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validatedData = conflictCheckSchema.parse(body);
    
    // Only check for conflicts with confirmed bookings
    // Tentative bookings can overlap
    const { data: conflicts, error } = await supabase
      .from('bookings')
      .select('id, booking_number, event_name, status')
      .eq('room_id', validatedData.room_id)
      .eq('status', 'confirmed') // Only check confirmed bookings
      .gte('end_date', validatedData.start_date)
      .lte('start_date', validatedData.end_date)
      .neq('id', validatedData.exclude_booking_id || '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Conflict check error:', error);
      return errorResponse('Failed to check for conflicts', 500);
    }

    // Check for time overlap
    let hasConflict = false;
    let conflictingBooking = null;

    if (conflicts && conflicts.length > 0) {
      // For simplicity, if dates overlap and room is same, consider it a conflict
      // In production, you'd check time ranges more carefully
      hasConflict = true;
      conflictingBooking = conflicts[0];
    }

    return successResponse({
      has_conflict: hasConflict,
      conflicting_booking_number: conflictingBooking?.booking_number,
      conflicting_event_name: conflictingBooking?.event_name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
