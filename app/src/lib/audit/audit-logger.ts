// lib/audit/audit-logger.ts
import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/database.types';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'EXPORT'
  | 'PRINT'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL'
  | 'RESTORE';

export type ResourceType = 
  | 'booking' 
  | 'client' 
  | 'room' 
  | 'user' 
  | 'addon'
  | 'event_type'
  | 'document'
  | 'report'
  | 'auth';

export interface AuditLogData {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  status?: 'success' | 'failed' | 'error';
  errorMessage?: string;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(
  data: AuditLogData,
  context?: RequestContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Audit log: No user found');
      return { success: false, error: 'No user found' };
    }

    // Get user details from users table
    const { data: userData } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', user.id)
      .single();

    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: userData?.email || user.email || 'unknown',
        user_role: userData?.role || 'unknown',
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        resource_name: data.resourceName,
        description: data.description,
        changes: data.changes as unknown as Json,
        metadata: {
          ...data.metadata,
          timestamp: new Date().toISOString(),
        } as unknown as Json,
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
        request_method: context?.method,
        request_path: context?.path,
        status: data.status || 'success',
        error_message: data.errorMessage,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Audit logging error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Helper to extract request context from Next.js Request object
 */
export function extractRequestContext(request: Request): RequestContext {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

/**
 * Middleware wrapper to automatically log API actions
 */
export function withAuditLog(
  action: AuditAction,
  resourceType: ResourceType
) {
  return async (
    handler: (request: Request) => Promise<Response>,
    request: Request,
    options?: {
      getResourceInfo?: (request: Request, response: Response) => Promise<{
        resourceId?: string;
        resourceName?: string;
        description: string;
      }>;
    }
  ): Promise<Response> => {
    const context = extractRequestContext(request);
    const response = await handler(request);
    
    // Only log successful operations (2xx status codes)
    if (response.ok && options?.getResourceInfo) {
      const resourceInfo = await options.getResourceInfo(request, response);
      
      await logAudit(
        {
          action,
          resourceType,
          resourceId: resourceInfo.resourceId,
          resourceName: resourceInfo.resourceName,
          description: resourceInfo.description,
          status: 'success',
        },
        context
      );
    }
    
    return response;
  };
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT',
  email: string,
  success: boolean,
  context?: RequestContext,
  errorMessage?: string
) {
  try {
    const supabase = await createClient();
    
    await supabase.from('audit_logs').insert({
      user_email: email,
      user_role: 'unknown', // Will be updated on next action
      action,
      resource_type: 'auth',
      description: `User ${action.toLowerCase()} ${success ? 'successful' : 'failed'}`,
      ip_address: context?.ipAddress,
      user_agent: context?.userAgent,
      request_method: context?.method,
      request_path: context?.path,
      status: success ? 'success' : 'failed',
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

/**
 * Get difference between two objects (for change tracking)
 */
export function getObjectDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changes: { before: Record<string, unknown>; after: Record<string, unknown> } = {
    before: {},
    after: {},
  };

  // Find changed fields
  for (const key in after) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.before[key] = before[key];
      changes.after[key] = after[key];
    }
  }

  return changes;
}
