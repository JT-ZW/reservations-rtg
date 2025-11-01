-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 5: Row Level Security (RLS) Policies
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Implements role-based access control using RLS
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: Get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the currently authenticated user';

-- ============================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Admin can do everything
CREATE POLICY "Admins have full access to users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own non-critical fields
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- ROOMS TABLE POLICIES
-- ============================================================

-- Everyone can view active rooms
CREATE POLICY "All authenticated users can view rooms"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (is_available = true OR public.is_admin());

-- Only admins can manage rooms
CREATE POLICY "Only admins can insert rooms"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update rooms"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete rooms"
  ON public.rooms
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- CLIENTS TABLE POLICIES
-- ============================================================

-- Admins, Reservations, and Sales can view clients
CREATE POLICY "Authorized users can view clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'reservations', 'sales', 'finance')
  );

-- Admins, Reservations, and Sales can create clients
CREATE POLICY "Authorized users can create clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'reservations', 'sales')
  );

-- Admins and Reservations can update clients
CREATE POLICY "Authorized users can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'reservations', 'sales')
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'reservations', 'sales')
  );

-- Only admins can delete clients
CREATE POLICY "Only admins can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================

-- Admins and Reservations can view all bookings
-- Finance can view confirmed bookings
-- Sales can view bookings they created
CREATE POLICY "Authorized users can view bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'reservations', 'auditor') OR
    (public.get_user_role() = 'finance' AND status = 'confirmed') OR
    (public.get_user_role() = 'sales' AND created_by = auth.uid())
  );

-- Admins and Reservations can create bookings
CREATE POLICY "Authorized users can create bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'reservations')
  );

-- Admins and Reservations can update bookings
CREATE POLICY "Authorized users can update bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'reservations')
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'reservations')
  );

-- Only admins can delete bookings
CREATE POLICY "Only admins can delete bookings"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ADDONS TABLE POLICIES
-- ============================================================

-- Everyone can view active addons
CREATE POLICY "All users can view addons"
  ON public.addons
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

-- Only admins can manage addons
CREATE POLICY "Only admins can manage addons"
  ON public.addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- BOOKING_ADDONS TABLE POLICIES
-- ============================================================

-- Users who can view the booking can view its addons
CREATE POLICY "Users can view booking addons"
  ON public.booking_addons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (
        public.get_user_role() IN ('admin', 'reservations', 'auditor') OR
        (public.get_user_role() = 'finance' AND status = 'confirmed')
      )
    )
  );

-- Admins and Reservations can manage booking addons
CREATE POLICY "Authorized users can manage booking addons"
  ON public.booking_addons
  FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'reservations'))
  WITH CHECK (public.get_user_role() IN ('admin', 'reservations'));

-- ============================================================
-- EVENT_TYPES TABLE POLICIES
-- ============================================================

-- Everyone can view event types
CREATE POLICY "All users can view event types"
  ON public.event_types
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

-- Only admins can manage event types
CREATE POLICY "Only admins can manage event types"
  ON public.event_types
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ACTIVITY_LOGS TABLE POLICIES
-- ============================================================

-- Admins and Auditors can view all logs
CREATE POLICY "Admins and auditors can view activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'auditor')
  );

-- System can insert logs (via triggers)
CREATE POLICY "System can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- AUTH_ACTIVITY_LOG TABLE POLICIES
-- ============================================================

-- Admins and Auditors can view auth logs
CREATE POLICY "Admins and auditors can view auth logs"
  ON public.auth_activity_log
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'auditor')
  );

-- System can insert auth logs
CREATE POLICY "System can insert auth logs"
  ON public.auth_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- DOCUMENTS TABLE POLICIES
-- ============================================================

-- Users who can view the booking can view its documents
CREATE POLICY "Users can view booking documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (
        public.get_user_role() IN ('admin', 'reservations', 'sales', 'finance', 'auditor') OR
        created_by = auth.uid()
      )
    )
  );

-- Authorized users can create documents
CREATE POLICY "Authorized users can create documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'reservations', 'sales', 'finance')
  );

-- Only admins can delete documents
CREATE POLICY "Only admins can delete documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Row Level Security policies created successfully!';
END $$;
