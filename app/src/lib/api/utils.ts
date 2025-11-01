/**
 * API Utility Functions
 * Helper functions for API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/database.types';

// ============================================================
// Response Helpers
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { 
      status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}

export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { 
      status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}

export function validationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { 
      status: 422,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}

// ============================================================
// Error Handling
// ============================================================

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
    return validationErrorResponse(errors);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse('An unexpected error occurred', 500);
}

// ============================================================
// Request Body Parser
// ============================================================

export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    return null;
  }
}

// ============================================================
// Query Parameter Parser
// ============================================================

export function parseQueryParams(url: string): Record<string, string> {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// ============================================================
// Supabase Client with User Context
// ============================================================

export async function getAuthenticatedClient() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

// ============================================================
// Activity Logger
// ============================================================

export async function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    
    await supabase.from('activity_logs').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: (params.details || null) as Json,
      ip_address: null,
      user_agent: null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// ============================================================
// Pagination Helper
// ============================================================

export interface PaginationOptions {
  page: number;
  limit: number;
}

export function calculatePagination(options: PaginationOptions) {
  const { page, limit } = options;
  const offset = (page - 1) * limit;
  
  return {
    from: offset,
    to: offset + limit - 1,
  };
}
