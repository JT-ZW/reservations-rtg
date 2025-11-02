/**
 * Rooms API - List and Create
 * GET /api/rooms - List all rooms
 * POST /api/rooms - Create a new room
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getAuthenticatedClient,
  parseRequestBody,
  logActivity,
  paginatedResponse,
  calculatePagination,
  parseQueryParams,
} from '@/lib/api/utils';
import { roomSchema, paginationSchema } from '@/lib/validations/schemas';
import { requireAnyRole } from '@/lib/auth/server-auth';
import { UserRole } from '@/types';
import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';

// GET /api/rooms
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedClient();
    
    // Parse query parameters
    const params = parseQueryParams(request.url);
    const { page, limit } = paginationSchema.parse(params);
    const search = params.search as string | undefined;
    const isAvailable = params.is_available as string | undefined;
    
    // Calculate pagination
    const { from, to } = calculatePagination({ page, limit });
    
    // Build query
    let query = supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply availability filter
    if (isAvailable !== undefined) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    const { data: rooms, error, count } = await query;

    if (error) {
      return errorResponse(error.message, 500);
    }

    return paginatedResponse(rooms || [], page, limit, count || 0);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/rooms
export async function POST(request: NextRequest) {
  try {
    // Check permissions - only admin can create rooms
    await requireAnyRole([UserRole.ADMIN]);
    
    const { supabase, user } = await getAuthenticatedClient();
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validatedData = roomSchema.parse(body);
    
    // Insert room
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        ...validatedData,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create',
      entityType: 'room',
      entityId: room.id,
      details: { name: room.name },
    });

    // Log audit trail
    await logAudit(
      {
        action: 'CREATE',
        resourceType: 'room',
        resourceId: room.id,
        resourceName: room.name,
        description: `Created room ${room.name}`,
        metadata: {
          name: room.name,
          capacity: room.capacity,
          rate_per_day: room.rate_per_day,
          is_available: room.is_available,
        },
      },
      extractRequestContext(request)
    );

    return successResponse(room, 'Room created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
