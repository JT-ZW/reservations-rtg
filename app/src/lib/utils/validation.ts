/**
 * Input Validation and Sanitization Utilities
 * Prevents SQL Injection and XSS attacks
 */

import { z } from 'zod';

/**
 * Sanitize string input - remove potentially harmful characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
}

/**
 * Sanitize HTML - escape special characters
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validate phone number (Zimbabwe format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+263|0)[0-9]{9}$/, 'Invalid phone number format');

/**
 * Validate UUID
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Validate date string
 */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

/**
 * Validate time string
 */
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');

/**
 * Validate positive number
 */
export const positiveNumberSchema = z.number().positive('Must be a positive number');

/**
 * Validate non-negative number
 */
export const nonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');
