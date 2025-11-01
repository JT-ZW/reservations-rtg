-- Add line_items column to bookings table for flexible pricing
-- This stores an array of line items in JSONB format

-- Add line_items column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' 
                   AND column_name = 'line_items') THEN
        ALTER TABLE bookings 
        ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN bookings.line_items IS 'Array of line items with description, quantity, rate, and amount';
    END IF;
END $$;

-- Create index on line_items for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_line_items ON bookings USING GIN (line_items);
