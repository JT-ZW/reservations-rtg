/**
 * Rooms API - Get, Update, Delete specific room
 * GET /api/rooms/[id] - Get room by ID
 * PUT /api/rooms/[id] - Update room
 * DELETE /api/rooms/[id] - Delete room
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
import { updateRoomSchema } from '@/lib/validations/schemas';
import { requireAnyRole } from '@/lib/auth/server-auth';
import { UserRole } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/rooms/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Room not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(room);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/rooms/[id]
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permissions - only admin can update rooms
    await requireAnyRole([UserRole.ADMIN]);
    
    const { supabase, user } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validatedData = updateRoomSchema.parse(body);
    
    // Update room
    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        ...validatedData,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Room not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'update',
      entityType: 'room',
      entityId: room.id,
      details: { name: room.name, changes: validatedData },
    });

    return successResponse(room, 'Room updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permissions - only admin can delete rooms
    await requireAnyRole([UserRole.ADMIN]);
    
    const { supabase, user } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // Check if room has bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', id)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return errorResponse(
        'Cannot delete room with existing bookings. Please cancel or reassign bookings first.',
        400
      );
    }

    // Delete room
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'delete',
      entityType: 'room',
      entityId: id,
    });

    return successResponse(null, 'Room deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
