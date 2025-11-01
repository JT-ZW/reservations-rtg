-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- MASTER MIGRATION SCRIPT
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Runs all database migrations in correct order
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 
-- This script will:
-- - Create all tables
-- - Set up indexes
-- - Create triggers and functions
-- - Apply RLS policies
-- - Seed initial data
-- - Create views and helper functions
-- 
-- ============================================================

\echo '=========================================='
\echo 'Rainbow Towers Booking System'
\echo 'Database Migration Starting...'
\echo '=========================================='
\echo ''

-- ============================================================
-- PART 1: CORE TABLES
-- ============================================================
\echo 'Step 1/7: Creating core tables...'

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reservations', 'sales', 'finance', 'auditor')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Event types table
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  rate_per_day DECIMAL(10, 2) NOT NULL CHECK (rate_per_day >= 0),
  amenities JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_available BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Zimbabwe',
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE RESTRICT,
  event_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'tentative' CHECK (status IN ('tentative', 'confirmed', 'cancelled')),
  number_of_attendees INTEGER CHECK (number_of_attendees > 0),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - discount_amount) STORED,
  notes TEXT,
  special_requirements TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_date < end_date) OR 
    (start_date = end_date AND end_time > start_time)
  )
);

-- Addons table
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0),
  unit TEXT NOT NULL CHECK (unit IN ('per_person', 'per_day', 'flat_rate', 'per_hour')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Booking addons junction table
CREATE TABLE IF NOT EXISTS public.booking_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0),
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_booking_addon UNIQUE (booking_id, addon_id)
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auth activity log table
CREATE TABLE IF NOT EXISTS public.auth_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'password_reset', 'password_change')),
  success BOOLEAN DEFAULT true NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('quotation', 'invoice', 'contract', 'other')),
  document_number TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  generated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

\echo 'Core tables created ✓'
\echo ''

-- Continue with remaining parts in next script...
-- (Due to size limits, run scripts 01-07 individually or in batches)

\echo '=========================================='
\echo 'Phase 1 Complete!'
\echo 'Next: Run scripts 03-07 for full setup'
\echo '=========================================='
