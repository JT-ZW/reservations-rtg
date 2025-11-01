-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 2: Activity Logging Tables
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Creates audit and activity logging tables
-- ============================================================

-- ============================================================
-- 8. ACTIVITY LOGS TABLE
-- ============================================================
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

COMMENT ON TABLE public.activity_logs IS 'Comprehensive audit trail of all user actions';
COMMENT ON COLUMN public.activity_logs.action IS 'Action performed: create, update, delete, view, export, etc.';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Type of entity: booking, client, room, user, etc.';
COMMENT ON COLUMN public.activity_logs.details IS 'JSON object with change details (old values, new values)';

-- ============================================================
-- 9. AUTH ACTIVITY LOG TABLE
-- ============================================================
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

COMMENT ON TABLE public.auth_activity_log IS 'Authentication and authorization activity tracking';
COMMENT ON COLUMN public.auth_activity_log.action IS 'Auth action: login, logout, failed_login, password_reset, password_change';

-- ============================================================
-- 10. DOCUMENTS TABLE
-- ============================================================
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

COMMENT ON TABLE public.documents IS 'Generated documents (quotations, invoices) linked to bookings';
COMMENT ON COLUMN public.documents.document_type IS 'Type: quotation, invoice, contract, other';
COMMENT ON COLUMN public.documents.file_path IS 'Storage path in Supabase Storage';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Activity logging tables created successfully!';
END $$;
