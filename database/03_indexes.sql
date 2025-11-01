-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 3: Indexes for Performance
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Creates indexes on high-traffic columns
-- ============================================================

-- ============================================================
-- USERS TABLE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ============================================================
-- BOOKINGS TABLE INDEXES (Critical for performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON public.bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_end_date ON public.bookings(end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON public.bookings(created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON public.bookings(booking_number);

-- Composite index for conflict detection queries
CREATE INDEX IF NOT EXISTS idx_bookings_room_date_status 
  ON public.bookings(room_id, start_date, end_date, status)
  WHERE status IN ('tentative', 'confirmed');

-- ============================================================
-- CLIENTS TABLE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_organization ON public.clients(organization_name);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);

-- ============================================================
-- ROOMS TABLE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rooms_is_available ON public.rooms(is_available);
CREATE INDEX IF NOT EXISTS idx_rooms_name ON public.rooms(name);

-- ============================================================
-- BOOKING ADDONS INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON public.booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_addon_id ON public.booking_addons(addon_id);

-- ============================================================
-- ACTIVITY LOGS INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON public.activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- Composite index for audit queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_composite 
  ON public.activity_logs(entity_type, entity_id, created_at DESC);

-- ============================================================
-- AUTH ACTIVITY LOG INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_auth_activity_user_id ON public.auth_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_activity_email ON public.auth_activity_log(email);
CREATE INDEX IF NOT EXISTS idx_auth_activity_action ON public.auth_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_auth_activity_created_at ON public.auth_activity_log(created_at DESC);

-- ============================================================
-- DOCUMENTS TABLE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_booking_id ON public.documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_number ON public.documents(document_number);

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Performance indexes created successfully!';
END $$;
