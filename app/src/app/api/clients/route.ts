/**
 * Clients API - List and Create
 * GET /api/clients - List all clients
 * POST /api/clients - Create a new client
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
import { clientSchema, paginationSchema } from '@/lib/validations/schemas';

// GET /api/clients
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedClient();
    
    // Parse query parameters
    const params = parseQueryParams(request.url);
    const { page, limit } = paginationSchema.parse(params);
    const search = params.search as string | undefined;
    const isActive = params.is_active as string | undefined;
    
    // Calculate pagination
    const { from, to } = calculatePagination({ page, limit });
    
    // Build query
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('organization_name')
      .range(from, to);

    // Apply search filter
    if (search) {
      query = query.or(`organization_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply active filter
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: clients, error, count } = await query;

    if (error) {
      return errorResponse(error.message, 500);
    }

    return paginatedResponse(clients || [], page, limit, count || 0);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/clients
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    const validatedData = clientSchema.parse(body);
    
    // Insert client
    const { data: client, error } = await supabase
      .from('clients')
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
      entityType: 'client',
      entityId: client.id,
      details: { organization_name: client.organization_name },
    });

    return successResponse(client, 'Client created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
