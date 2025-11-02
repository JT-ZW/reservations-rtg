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
import { logAudit, extractRequestContext, getObjectDiff } from '@/lib/audit/audit-logger';

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
    
    // Get current room state for change tracking
    const { data: oldRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
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

    // Log audit trail with changes
    if (oldRoom && room) {
      const rateChanged = oldRoom.rate_per_day !== room.rate_per_day;
      await logAudit(
        {
          action: 'UPDATE',
          resourceType: 'room',
          resourceId: room.id,
          resourceName: room.name,
          description: rateChanged 
            ? `Updated room ${room.name} - Rate changed from ${oldRoom.rate_per_day} to ${room.rate_per_day}`
            : `Updated room ${room.name}`,
          changes: getObjectDiff(oldRoom, room),
          metadata: {
            name: room.name,
            capacity: room.capacity,
            rate_per_day: room.rate_per_day,
            is_available: room.is_available,
            rate_changed: rateChanged,
          },
        },
        extractRequestContext(request)
      );
    }

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
    
    // Get room details for logging
    const { data: room } = await supabase
      .from('rooms')
      .select('name, capacity, rate_per_day')
      .eq('id', id)
      .single();
    
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

    // Log audit trail
    if (room) {
      await logAudit(
        {
          action: 'DELETE',
          resourceType: 'room',
          resourceId: id,
          resourceName: room.name,
          description: `Deleted room ${room.name}`,
          metadata: {
            name: room.name,
            capacity: room.capacity,
            rate_per_day: room.rate_per_day,
          },
        },
        extractRequestContext(request)
      );
    }

    return successResponse(null, 'Room deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
