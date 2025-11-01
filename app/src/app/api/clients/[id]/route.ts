/**
 * Clients API - Get, Update, Delete specific client
 * GET /api/clients/[id] - Get client by ID
 * PUT /api/clients/[id] - Update client
 * DELETE /api/clients/[id] - Delete client
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
import { updateClientSchema } from '@/lib/validations/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Client not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(client);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/clients/[id]
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
    
    const validatedData = updateClientSchema.parse(body);
    
    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...validatedData,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Client not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'update',
      entityType: 'client',
      entityId: client.id,
      details: { organization_name: client.organization_name, changes: validatedData },
    });

    return successResponse(client, 'Client updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { id } = await context.params;
    
    // Check if client has bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_id', id)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return errorResponse(
        'Cannot delete client with existing bookings. Please cancel or reassign bookings first.',
        400
      );
    }

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'delete',
      entityType: 'client',
      entityId: id,
    });

    return successResponse(null, 'Client deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
