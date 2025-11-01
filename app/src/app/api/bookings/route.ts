/**
 * Bookings API - List and Create
 * GET /api/bookings - List all bookings with filters
 * POST /api/bookings - Create a new booking with conflict check
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
import { bookingFilterSchema } from '@/lib/validations/schemas';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface BookingRequestBody {
  line_items?: LineItem[];
  client_name?: string;
  company_name?: string;
  client_email?: string;
  client_phone?: string;
  event_type?: string;
  currency?: string;
  client_id?: string;
  room_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_name: string;
  status?: string;
  number_of_attendees?: number;
  special_requirements?: string;
  notes?: string;
  total_amount: number;
  final_amount?: number;
}

// GET /api/bookings
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedClient();
    
    // Parse query parameters
    const params = parseQueryParams(request.url);
    const { page, limit, status, room_id, client_id, start_date, end_date } = 
      bookingFilterSchema.parse(params);
    
    // Calculate pagination
    const { from, to } = calculatePagination({ page, limit });
    
    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        room:rooms(*),
        event_type:event_types(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (room_id) {
      query = query.eq('room_id', room_id);
    }
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    if (start_date) {
      query = query.gte('start_date', start_date);
    }
    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      return errorResponse(error.message, 500);
    }

    return paginatedResponse(bookings || [], page, limit, count || 0);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    
    // Parse and validate request body
    const body = await parseRequestBody(request);
    if (!body) {
      return errorResponse('Invalid request body', 400);
    }
    
    // Extract line_items and other fields
    const bodyData = body as BookingRequestBody;
    const { line_items, client_name, company_name, client_email, client_phone, event_type, currency, ...bookingData } = bodyData;
    
    // Only check conflicts for confirmed bookings
    if (bookingData.status === 'confirmed') {
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id, booking_number, event_name')
        .eq('room_id', bookingData.room_id)
        .eq('status', 'confirmed')
        .gte('end_date', bookingData.start_date)
        .lte('start_date', bookingData.end_date);

      if (conflictError) {
        return errorResponse('Failed to check for conflicts', 500);
      }

      if (conflicts && conflicts.length > 0) {
        return errorResponse(
          `Booking conflict detected with ${conflicts[0].event_name} (${conflicts[0].booking_number})`,
          409
        );
      }
    }

    // If client_id not provided, try to find or create client
    let clientId = bookingData.client_id;
    
    if (!clientId && client_email) {
      // Try to find existing client by email
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', client_email)
        .single();
        
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            contact_person: client_name || 'Unknown',
            organization_name: company_name || client_email || 'Unknown Organization',
            email: client_email,
            phone: client_phone || '',
            is_active: true,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();
          
        if (clientError) {
          console.error('Failed to create client:', clientError);
          return errorResponse('Failed to create client: ' + clientError.message, 500);
        }
        
        if (newClient) {
          clientId = newClient.id;
        }
      }
    }

    // Validate that we have a client_id (required field)
    if (!clientId) {
      return errorResponse('client_id is required. Please provide either client_id or client_email.', 400);
    }

    // If event_type is provided as string, try to find or create event type
    let eventTypeId = null;
    if (event_type) {
      const { data: existingType } = await supabase
        .from('event_types')
        .select('id')
        .ilike('name', event_type)
        .single();
        
      if (existingType) {
        eventTypeId = existingType.id;
      } else {
        // Create new event type
        const { data: newType } = await supabase
          .from('event_types')
          .insert({
            name: event_type,
            is_active: true,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();
          
        if (newType) {
          eventTypeId = newType.id;
        }
      }
    }

    // Prepare booking data
    const bookingInsert: any = {
      ...bookingData,
      client_id: clientId, // Always set client_id (now guaranteed to exist)
      line_items: line_items || [],
      currency: currency || 'USD',
      created_by: user.id,
      updated_by: user.id,
    };

    // Add event_type_id if available
    if (eventTypeId) {
      bookingInsert.event_type_id = eventTypeId;
    }

    // Insert booking with line_items as JSONB
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingInsert)
      .select()
      .single();

    if (error) {
      console.error('Booking creation error:', error);
      return errorResponse(error.message, 500);
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create',
      entityType: 'booking',
      entityId: booking.id,
      details: {
        booking_number: booking.booking_number,
        event_name: booking.event_name,
        room_id: booking.room_id,
        status: booking.status,
      },
    });

    return successResponse(booking, 'Booking created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
