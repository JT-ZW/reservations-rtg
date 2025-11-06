/**
 * Core Application Types
 * Rainbow Towers Conference & Event Booking System
 */

// JSON type for PostgreSQL JSONB columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  RESERVATIONS = 'reservations',
  SALES = 'sales',
  FINANCE = 'finance',
  AUDITOR = 'auditor',
}

// Booking Status
export enum BookingStatus {
  TENTATIVE = 'tentative',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

// Event Types (will be seeded in database)
export enum EventType {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  MEETING = 'meeting',
  WEDDING = 'wedding',
  CORPORATE = 'corporate',
  TRAINING = 'training',
  OTHER = 'other',
}

// User Interface
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  mobile?: string;
  facebook?: string;
  skype?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Room Interface
export interface Room {
  id: string;
  name: string;
  capacity: number;
  amenities: string[];
  description?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Client Interface
export interface Client {
  id: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Booking Interface
export interface Booking {
  id: string;
  client_id: string;
  room_id: string;
  event_type_id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  number_of_attendees: number;
  total_amount: number;
  currency?: string; // 'USD' or 'ZWG'
  notes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Addon Interface
export interface Addon {
  id: string;
  name: string;
  description?: string;
  rate: number;
  unit: string; // per person, per day, flat rate
  created_at: string;
  updated_at: string;
}

// Booking Addon (junction table)
export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

// Activity Log Interface
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string; // booking, room, client, etc.
  entity_id: string;
  details?: Json;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Auth Activity Log Interface
export interface AuthActivityLog {
  id: string;
  user_id?: string;
  email: string;
  action: 'login' | 'logout' | 'failed_login' | 'password_reset';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
