/**
 * Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';

// ============================================================
// Room Schemas
// ============================================================

export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  rate_per_day: z.number().min(0, 'Rate must be positive'),
  amenities: z.record(z.string(), z.any()).optional().default({}),
  description: z.string().max(500).optional().nullable(),
  is_available: z.boolean().optional().default(true),
});

export const updateRoomSchema = roomSchema.partial();

export type RoomInput = z.infer<typeof roomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// ============================================================
// Client Schemas
// ============================================================

export const clientSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required').max(200),
  contact_person: z.string().min(1, 'Contact person is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().default('Zimbabwe'),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateClientSchema = clientSchema.partial();

export type ClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================================
// Event Type Schemas
// ============================================================

export const eventTypeSchema = z.object({
  name: z.string().min(1, 'Event type name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateEventTypeSchema = eventTypeSchema.partial();

export type EventTypeInput = z.infer<typeof eventTypeSchema>;
export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>;

// ============================================================
// Addon Schemas
// ============================================================

export const addonSchema = z.object({
  name: z.string().min(1, 'Addon name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  rate: z.number().min(0, 'Rate must be positive'),
  unit: z.string().min(1, 'Unit is required').max(50),
  is_active: z.boolean().optional().default(true),
});

export const updateAddonSchema = addonSchema.partial();

export type AddonInput = z.infer<typeof addonSchema>;
export type UpdateAddonInput = z.infer<typeof updateAddonSchema>;

// ============================================================
// Booking Addon Schemas
// ============================================================

export const bookingAddonSchema = z.object({
  addon_id: z.string().uuid('Invalid addon ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
  notes: z.string().max(500).optional().nullable(),
});

export type BookingAddonInput = z.infer<typeof bookingAddonSchema>;

// ============================================================
// Booking Schemas
// ============================================================

export const bookingSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  room_id: z.string().uuid('Invalid room ID'),
  event_type_id: z.string().uuid('Invalid event type ID'),
  event_name: z.string().min(1, 'Event name is required').max(200),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
  status: z.enum(['tentative', 'confirmed', 'cancelled', 'completed']).optional().default('tentative'),
  number_of_attendees: z.number().int().min(1).optional().nullable(),
  total_amount: z.number().min(0, 'Total amount must be positive'),
  discount_amount: z.number().min(0, 'Discount must be positive').optional().default(0),
  final_amount: z.number().min(0, 'Final amount must be positive'),
  notes: z.string().max(1000).optional().nullable(),
  special_requirements: z.string().max(1000).optional().nullable(),
  addons: z.array(bookingAddonSchema).optional().default([]),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
).refine(
  (data) => {
    if (data.start_date === data.end_date) {
      return data.end_time > data.start_time;
    }
    return true;
  },
  {
    message: 'End time must be after start time for same-day bookings',
    path: ['end_time'],
  }
);

export const updateBookingSchema = bookingSchema.partial().omit({ addons: true });

export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ============================================================
// Conflict Check Schema
// ============================================================

export const conflictCheckSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
  exclude_booking_id: z.string().uuid().optional().nullable(),
});

export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;

// ============================================================
// Query Parameter Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const bookingFilterSchema = paginationSchema.extend({
  status: z.enum(['tentative', 'confirmed', 'cancelled', 'completed']).optional(),
  room_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type BookingFilterParams = z.infer<typeof bookingFilterSchema>;
