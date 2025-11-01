/**
 * Date Utility Functions
 * All dates use CAT (Central Africa Time - UTC+2)
 */

import { format, parseISO, isValid, addDays, subDays, startOfDay, endOfDay } from 'date-fns';

// Timezone constant
export const TIMEZONE = 'Africa/Harare'; // CAT (UTC+2)

/**
 * Format a date string or Date object
 */
export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatStr) : '';
  } catch {
    return '';
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Get current date in CAT timezone
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Get start of day in CAT
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of day in CAT
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Subtract days from a date
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subDays(dateObj, days);
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
}

/**
 * Convert to ISO string for database storage
 */
export function toISOString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toISOString();
}
