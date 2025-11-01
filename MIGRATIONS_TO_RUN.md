# Database Migrations Required

Please run these SQL scripts in your Supabase Dashboard (SQL Editor) to complete the setup:

## Migration 1: Add line_items Column

This adds support for flexible pricing with line items.

```sql
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
```

## Migration 2: Add currency Column

This adds support for ZWG and USD currency selection.

```sql
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
```

## How to Run

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste **both migrations** into the editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success message appears

## Verification

After running, verify the columns were added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('line_items', 'currency');
```

You should see both columns in the results.
