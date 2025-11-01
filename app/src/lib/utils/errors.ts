/**
 * Error Handling Utilities
 * Provides consistent error handling across the application
 */

import { ApiResponse } from '@/types';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: unknown): ApiResponse {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      message: 'An error occurred while processing your request',
    };
  }

  return {
    success: false,
    error: 'Unknown error',
    message: 'An unexpected error occurred',
  };
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error response
 */
export function errorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message: message || error,
  };
}

/**
 * Log error for monitoring (can be extended with Sentry)
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error('Error logged:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Integrate with Sentry or other monitoring service
  // Sentry.captureException(error, { extra: context });
}
