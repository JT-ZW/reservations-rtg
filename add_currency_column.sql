-- Add currency column to bookings table
-- This allows selecting between ZWG and USD for all pricing

-- Add currency column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' 
                   AND column_name = 'currency') THEN
        ALTER TABLE bookings 
        ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL
        CHECK (currency IN ('ZWG', 'USD'));
        
        COMMENT ON COLUMN bookings.currency IS 'Currency for booking pricing: ZWG (Zimbabwe Gold) or USD';
    END IF;
END $$;

-- Create index for reporting queries
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
