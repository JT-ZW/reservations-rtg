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
import { logAudit, extractRequestContext, getObjectDiff } from '@/lib/audit/audit-logger';

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
    
    // Get current client state for change tracking
    const { data: oldClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
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

    // Log audit trail with changes
    if (oldClient && client) {
      await logAudit(
        {
          action: 'UPDATE',
          resourceType: 'client',
          resourceId: client.id,
          resourceName: client.organization_name,
          description: `Updated client ${client.organization_name}`,
          changes: getObjectDiff(oldClient, client),
          metadata: {
            organization_name: client.organization_name,
            email: client.email,
          },
        },
        extractRequestContext(request)
      );
    }

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
    
    // Get client details for logging
    const { data: client } = await supabase
      .from('clients')
      .select('organization_name, contact_person, email')
      .eq('id', id)
      .single();
    
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

    // Log audit trail
    if (client) {
      await logAudit(
        {
          action: 'DELETE',
          resourceType: 'client',
          resourceId: id,
          resourceName: client.organization_name,
          description: `Deleted client ${client.organization_name}`,
          metadata: {
            organization_name: client.organization_name,
            contact_person: client.contact_person,
            email: client.email,
          },
        },
        extractRequestContext(request)
      );
    }

    return successResponse(null, 'Client deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
