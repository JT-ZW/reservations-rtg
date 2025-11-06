# Currency Filtering in Reports - Deployment Guide

## Status: READY FOR MIGRATION ⚠️

The currency filtering feature for reports has been implemented but requires a database migration before it can be deployed.

## Changes Completed ✅

### Frontend Changes (reports/page.tsx)
- ✅ Added currency state variable: `'ALL' | 'USD' | 'ZWG'`
- ✅ Updated formatCurrency function to handle both ZWG and USD formatting
- ✅ Updated all 5 report fetch functions with currency query parameters:
  - fetchRevenueReport
  - fetchUtilizationReport
  - fetchClientAnalytics
  - fetchEventTypeAnalytics
  - fetchConversionReport
- ✅ Added currency dropdown selector in filters section
- ✅ Added currency to useEffect dependencies for automatic refetch

### Backend Changes (API Routes)
- ✅ Updated `/api/reports/revenue/route.ts` - Added currency filter
- ✅ Updated `/api/reports/utilization/route.ts` - Added currency filter
- ✅ Updated `/api/reports/clients/route.ts` - Added currency filter
- ✅ Updated `/api/reports/event-types/route.ts` - Added currency filter
- ✅ Updated `/api/reports/conversion/route.ts` - Added currency filter

## Required Migration ⚠️

**CRITICAL**: You MUST run this SQL migration in your Supabase Dashboard BEFORE deploying the code changes.

### How to Run the Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

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

6. Click **Run** (or press Ctrl+Enter)
7. Verify success message appears

### Verify Migration

Run this query to confirm the column was added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'currency';
```

You should see the currency column with type `character varying` and default `'USD'::character varying`.

## Deployment Steps

Follow these steps IN ORDER:

1. **Run Migration First** ⚠️
   - Run the SQL migration in Supabase (see above)
   - Verify the currency column exists

2. **Build and Test Locally**
   ```powershell
   cd app
   npm run build
   ```
   
3. **Commit Changes**
   ```powershell
   git add .
   git commit -m "Add currency filtering to reports"
   ```

4. **Deploy to Production**
   ```powershell
   git push origin main
   ```

5. **Verify in Production**
   - Go to Reports page
   - Check that Currency dropdown appears in filters
   - Select different currencies and verify data filters correctly
   - Test all 5 report tabs: Overview, Rooms, Events, Clients, Conversion

## What the Feature Does

### User Experience
- Users can now filter all reports by currency (ALL, USD, or ZWG)
- Currency selector appears in the filters section alongside date range and grouping
- All reports dynamically update when currency filter changes
- Revenue and amounts display with correct currency formatting:
  - USD: $1,234.56
  - ZWG: ZWG 1,234.56

### Technical Implementation
- Frontend passes `currency` query parameter to all report API endpoints
- Backend filters bookings by currency field before aggregating data
- When "ALL" is selected, no currency filter is applied (shows all bookings)
- formatCurrency function in reports/page.tsx handles both USD and ZWG formatting

## Rollback Plan

If issues occur after deployment:

1. Revert to previous commit:
   ```powershell
   git revert HEAD
   git push origin main
   ```

2. The database migration is safe to keep (it only adds a column with default 'USD')

## Notes

- All existing bookings will have currency='USD' by default after migration
- New bookings will need the currency field set appropriately
- The booking form may need updates to allow users to select currency (separate task)
- Reports will work immediately after migration with all existing bookings showing as USD

## Next Steps After Deployment

Consider these follow-up improvements:

1. Add currency selector to booking creation/edit forms
2. Add currency display to booking list and detail pages (already done ✅)
3. Add bulk currency update tool for migrating existing bookings
4. Add currency conversion rates table for cross-currency reporting
5. Add currency summary cards in dashboard
