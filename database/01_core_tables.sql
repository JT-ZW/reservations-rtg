-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 1: Core Tables
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Creates all core tables for the booking system
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
-- Extends Supabase auth.users with application-specific fields
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

-- Add comments
COMMENT ON TABLE public.users IS 'Application users with role-based access control';
COMMENT ON COLUMN public.users.role IS 'User role: admin, reservations, sales, finance, auditor';
COMMENT ON COLUMN public.users.is_active IS 'Indicates if user account is active';

-- ============================================================
-- 2. EVENT TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.event_types IS 'Types of events that can be booked';

-- ============================================================
-- 3. ROOMS TABLE
-- ============================================================
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

COMMENT ON TABLE public.rooms IS 'Conference rooms and venues available for booking';
COMMENT ON COLUMN public.rooms.amenities IS 'JSON array of room amenities (e.g., projector, wifi, etc.)';
COMMENT ON COLUMN public.rooms.rate_per_day IS 'Daily rental rate in USD';

-- ============================================================
-- 4. CLIENTS TABLE
-- ============================================================
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

COMMENT ON TABLE public.clients IS 'Client organizations and contact information';

-- ============================================================
-- 5. BOOKINGS TABLE
-- ============================================================
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
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_date < end_date) OR 
    (start_date = end_date AND end_time > start_time)
  )
);

COMMENT ON TABLE public.bookings IS 'Conference and event bookings';
COMMENT ON COLUMN public.bookings.booking_number IS 'Unique booking reference number (e.g., BK-2025-0001)';
COMMENT ON COLUMN public.bookings.status IS 'Booking status: tentative, confirmed, cancelled';
COMMENT ON COLUMN public.bookings.final_amount IS 'Computed column: total_amount - discount_amount';

-- ============================================================
-- 6. ADDONS TABLE
-- ============================================================
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

COMMENT ON TABLE public.addons IS 'Additional services available for bookings (catering, AV equipment, etc.)';
COMMENT ON COLUMN public.addons.unit IS 'Pricing unit: per_person, per_day, flat_rate, per_hour';

-- ============================================================
-- 7. BOOKING ADDONS (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0),
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique addon per booking
  CONSTRAINT unique_booking_addon UNIQUE (booking_id, addon_id)
);

COMMENT ON TABLE public.booking_addons IS 'Junction table linking bookings to addons with quantities';
COMMENT ON COLUMN public.booking_addons.rate IS 'Rate at time of booking (may differ from current addon rate)';
COMMENT ON COLUMN public.booking_addons.subtotal IS 'Computed column: quantity * rate';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Core tables created successfully!';
END $$;
