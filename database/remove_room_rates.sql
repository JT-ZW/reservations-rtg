-- Migration: Remove Fixed Rates from Rooms
-- Since rates are manually entered per booking, we don't need fixed room rates
-- Created: 2025-11-01

-- First, drop the dependent view
DROP VIEW IF EXISTS booking_details CASCADE;

-- Remove the rate_per_day column from rooms table
ALTER TABLE public.rooms DROP COLUMN IF EXISTS rate_per_day;

-- Recreate the booking_details view without rate_per_day
CREATE OR REPLACE VIEW booking_details AS
SELECT 
  b.id,
  b.booking_number,
  b.event_name,
  b.event_type_id,
  et.name as event_type_name,
  b.client_id,
  c.organization_name,
  c.contact_person,
  c.email as client_email,
  c.phone as client_phone,
  b.room_id,
  r.name as room_name,
  r.capacity as room_capacity,
  b.start_date,
  b.end_date,
  b.total_amount,
  b.status,
  b.notes,
  b.created_at,
  b.updated_at,
  b.created_by,
  b.updated_by
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.rooms r ON b.room_id = r.id
LEFT JOIN public.event_types et ON b.event_type_id = et.id;

-- Add comment
COMMENT ON VIEW booking_details IS 'Comprehensive view of bookings with related client, room, and event type information';
