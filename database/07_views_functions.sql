-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 7: Useful Views & Helper Functions
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Creates views for reporting and helper functions
-- ============================================================

-- ============================================================
-- VIEW: Booking Details (with all related data)
-- ============================================================
CREATE OR REPLACE VIEW public.booking_details AS
SELECT 
  b.id,
  b.booking_number,
  b.event_name,
  b.start_date,
  b.end_date,
  b.start_time,
  b.end_time,
  b.status,
  b.number_of_attendees,
  b.total_amount,
  b.discount_amount,
  b.final_amount,
  b.notes,
  b.created_at,
  b.updated_at,
  -- Client details
  c.id AS client_id,
  c.organization_name,
  c.contact_person,
  c.email AS client_email,
  c.phone AS client_phone,
  -- Room details
  r.id AS room_id,
  r.name AS room_name,
  r.capacity AS room_capacity,
  r.rate_per_day AS room_rate,
  -- Event type
  et.name AS event_type,
  -- Created by
  u.full_name AS created_by_name,
  u.email AS created_by_email
FROM public.bookings b
INNER JOIN public.clients c ON b.client_id = c.id
INNER JOIN public.rooms r ON b.room_id = r.id
INNER JOIN public.event_types et ON b.event_type_id = et.id
LEFT JOIN public.users u ON b.created_by = u.id;

COMMENT ON VIEW public.booking_details IS 'Comprehensive view of bookings with all related information';

-- ============================================================
-- VIEW: Room utilization summary
-- ============================================================
CREATE OR REPLACE VIEW public.room_utilization AS
SELECT 
  r.id,
  r.name,
  r.capacity,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
  SUM(CASE WHEN b.status = 'confirmed' THEN b.final_amount ELSE 0 END) AS total_revenue,
  AVG(CASE WHEN b.status = 'confirmed' THEN b.number_of_attendees END) AS avg_attendees
FROM public.rooms r
LEFT JOIN public.bookings b ON r.id = b.room_id
GROUP BY r.id, r.name, r.capacity;

COMMENT ON VIEW public.room_utilization IS 'Room utilization metrics and revenue';

-- ============================================================
-- VIEW: Client booking history
-- ============================================================
CREATE OR REPLACE VIEW public.client_booking_summary AS
SELECT 
  c.id,
  c.organization_name,
  c.contact_person,
  c.email,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
  SUM(CASE WHEN b.status = 'confirmed' THEN b.final_amount ELSE 0 END) AS total_spent,
  MAX(b.created_at) AS last_booking_date
FROM public.clients c
LEFT JOIN public.bookings b ON c.id = b.client_id
GROUP BY c.id, c.organization_name, c.contact_person, c.email;

COMMENT ON VIEW public.client_booking_summary IS 'Client booking history and spending summary';

-- ============================================================
-- FUNCTION: Check booking conflicts
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_room_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflicting_booking_id UUID,
  conflicting_booking_number TEXT,
  conflicting_event_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE AS has_conflict,
    b.id AS conflicting_booking_id,
    b.booking_number AS conflicting_booking_number,
    b.event_name AS conflicting_event_name
  FROM public.bookings b
  WHERE 
    b.room_id = p_room_id
    AND b.status IN ('tentative', 'confirmed')
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    AND (
      -- Date ranges overlap
      (b.start_date <= p_end_date AND b.end_date >= p_start_date)
      AND
      -- Time ranges overlap on overlapping dates
      (
        (b.start_date < p_end_date AND b.end_date > p_start_date) OR
        (b.start_date = p_start_date AND b.end_date = p_end_date AND 
         (b.start_time < p_end_time AND b.end_time > p_start_time))
      )
    )
  LIMIT 1;
  
  -- If no conflicts found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.check_booking_conflict IS 'Checks if a booking conflicts with existing bookings';

-- ============================================================
-- FUNCTION: Calculate booking duration in days
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_booking_days(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (p_end_date - p_start_date) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_booking_days IS 'Calculates number of days for a booking (inclusive)';

-- ============================================================
-- FUNCTION: Get next document number
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_document_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  sequence_num INTEGER;
  new_doc_number TEXT;
BEGIN
  -- Determine prefix
  prefix := CASE p_document_type
    WHEN 'quotation' THEN 'QT'
    WHEN 'invoice' THEN 'INV'
    WHEN 'contract' THEN 'CT'
    ELSE 'DOC'
  END;
  
  -- Get current year
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM public.documents
  WHERE document_number LIKE prefix || '-' || year_part || '-%';
  
  -- Generate document number
  new_doc_number := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_doc_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_next_document_number IS 'Generates next sequential document number';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Views and helper functions created successfully!';
END $$;
