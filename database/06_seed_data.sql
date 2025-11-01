-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 6: Seed Data
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Initial data for event types, rooms, and sample data
-- ============================================================

-- ============================================================
-- SEED EVENT TYPES
-- ============================================================
INSERT INTO public.event_types (name, description, is_active) VALUES
  ('Conference', 'Large-scale conferences and seminars', true),
  ('Workshop', 'Training workshops and hands-on sessions', true),
  ('Meeting', 'Business meetings and board sessions', true),
  ('Wedding', 'Wedding receptions and ceremonies', true),
  ('Corporate Event', 'Corporate functions and team building', true),
  ('Training', 'Professional training and development sessions', true),
  ('Seminar', 'Educational seminars and presentations', true),
  ('Other', 'Other types of events', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED SAMPLE ROOMS
-- ============================================================
INSERT INTO public.rooms (name, capacity, rate_per_day, amenities, description, is_available) VALUES
  (
    'Grand Ballroom', 
    500, 
    2500.00, 
    '["Stage", "Sound System", "Projector", "WiFi", "Air Conditioning", "Podium"]'::jsonb,
    'Large ballroom perfect for conferences and weddings',
    true
  ),
  (
    'Conference Room A', 
    100, 
    800.00, 
    '["Projector", "WiFi", "Whiteboard", "Air Conditioning", "Conference Phone"]'::jsonb,
    'Mid-sized conference room with modern amenities',
    true
  ),
  (
    'Conference Room B', 
    80, 
    650.00, 
    '["Projector", "WiFi", "Whiteboard", "Air Conditioning"]'::jsonb,
    'Comfortable conference room for medium-sized events',
    true
  ),
  (
    'Boardroom', 
    20, 
    400.00, 
    '["Large Screen TV", "WiFi", "Conference Phone", "Whiteboard", "Air Conditioning"]'::jsonb,
    'Executive boardroom for high-level meetings',
    true
  ),
  (
    'Training Room 1', 
    40, 
    500.00, 
    '["Projector", "WiFi", "Whiteboard", "Air Conditioning", "Training Desks"]'::jsonb,
    'Dedicated training facility with breakout areas',
    true
  ),
  (
    'Meeting Room 1', 
    15, 
    250.00, 
    '["TV Screen", "WiFi", "Whiteboard", "Air Conditioning"]'::jsonb,
    'Small meeting room for intimate gatherings',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED SAMPLE ADDONS
-- ============================================================
INSERT INTO public.addons (name, description, rate, unit, is_active) VALUES
  ('Coffee Break', 'Tea, coffee, and light refreshments', 8.00, 'per_person', true),
  ('Lunch Buffet', 'Full lunch buffet with multiple options', 25.00, 'per_person', true),
  ('Dinner Buffet', 'Full dinner buffet with multiple options', 35.00, 'per_person', true),
  ('PA System', 'Professional audio system with microphones', 150.00, 'per_day', true),
  ('Projector & Screen', 'HD projector with large screen', 100.00, 'per_day', true),
  ('Video Conference Setup', 'Full video conferencing equipment', 200.00, 'per_day', true),
  ('Flip Chart & Markers', 'Flip chart stand with markers', 20.00, 'flat_rate', true),
  ('Welcome Banner', 'Custom printed welcome banner', 50.00, 'flat_rate', true),
  ('Floral Arrangement', 'Professional floral decorations', 150.00, 'flat_rate', true),
  ('Photographer', 'Professional photography services', 300.00, 'per_day', true),
  ('DJ Services', 'Professional DJ for events', 500.00, 'per_day', true),
  ('Cocktail Reception', 'Pre-event cocktail reception', 15.00, 'per_person', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Event Types: 8 inserted';
  RAISE NOTICE 'Rooms: 6 inserted';
  RAISE NOTICE 'Addons: 12 inserted';
END $$;
