-- Make event_type_id nullable in bookings table
-- This allows for more flexible event type management where event_type can be a simple text field

-- Remove NOT NULL constraint from event_type_id
ALTER TABLE bookings 
ALTER COLUMN event_type_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN bookings.event_type_id IS 'Optional reference to event_types table. Can be null if using freeform event_type text field.';
