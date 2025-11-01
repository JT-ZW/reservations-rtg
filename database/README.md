# Database Setup Guide

## Rainbow Towers Conference & Event Booking System
**Phase 2: Database Schema & Security**

---

## 📋 Overview

This directory contains all SQL scripts needed to set up the complete database schema for the Rainbow Towers booking system.

### What's Included

- ✅ 10 Tables (users, bookings, rooms, clients, etc.)
- ✅ 25+ Indexes for performance optimization
- ✅ 15+ Triggers for automatic logging and timestamps
- ✅ Row Level Security (RLS) policies for all tables
- ✅ 8 Event types, 6 Sample rooms, 12 Addons (seed data)
- ✅ 3 Views for reporting
- ✅ 5 Helper functions (conflict detection, document numbering)

---

## 🚀 Quick Start

### Option 1: Run Scripts Individually (Recommended)

Execute scripts in the Supabase SQL Editor in this order:

```sql
1. 01_core_tables.sql       -- Creates all tables
2. 02_logging_tables.sql    -- Creates activity logging tables
3. 03_indexes.sql           -- Adds performance indexes
4. 04_triggers.sql          -- Sets up automatic triggers
5. 05_rls_policies.sql      -- Implements security policies
6. 06_seed_data.sql         -- Inserts initial data
7. 07_views_functions.sql   -- Creates views and helper functions
```

### Option 2: Use Master Script

Run `00_master_migration.sql` (contains Part 1, then run remaining scripts)

---

## 📊 Database Schema

### Core Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| `users` | Application users | Role-based access, extends auth.users |
| `rooms` | Conference rooms/venues | Capacity, rates, amenities (JSONB) |
| `clients` | Client organizations | Contact info, booking history |
| `bookings` | Event bookings | Status workflow, conflict checking |
| `addons` | Additional services | Flexible pricing units |
| `booking_addons` | Booking-addon junction | Quantity, calculated subtotals |
| `event_types` | Event categories | Conference, Workshop, Wedding, etc. |
| `activity_logs` | Audit trail | All user actions logged |
| `auth_activity_log` | Login activity | Security tracking |
| `documents` | Generated PDFs | Quotations, invoices |

### Entity Relationships

```
clients ──< bookings >── rooms
            │
            ├──< booking_addons >── addons
            │
            ├─── event_types
            │
            └─── users (created_by, updated_by)
```

---

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies enforcing role-based access:

- **Admin**: Full access to everything
- **Reservations**: Manage bookings, clients, view reports
- **Sales**: Create quotations, view clients
- **Finance**: View confirmed bookings and financial data
- **Auditor**: Read-only access to all logs and reports

### Helper Functions

```sql
get_user_role()              -- Returns current user's role
is_admin()                   -- Checks if user is admin
check_booking_conflict()     -- Prevents double-booking
get_next_document_number()   -- Generates document IDs
```

---

## 🔧 Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `jkurrsgbzzsxfwkrnbbu`
3. Navigate to **SQL Editor**

### Step 2: Run Migration Scripts

**Script 1: Core Tables**
```sql
-- Copy contents of 01_core_tables.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 2: Logging Tables**
```sql
-- Copy contents of 02_logging_tables.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 3: Indexes**
```sql
-- Copy contents of 03_indexes.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 4: Triggers**
```sql
-- Copy contents of 04_triggers.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 5: RLS Policies**
```sql
-- Copy contents of 05_rls_policies.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 6: Seed Data**
```sql
-- Copy contents of 06_seed_data.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Script 7: Views & Functions**
```sql
-- Copy contents of 07_views_functions.sql
-- Paste in SQL Editor
-- Click "Run"
```

### Step 3: Verify Installation

Run this query to check all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output: 10 tables

---

## 📦 Seed Data Summary

### Event Types (8)
- Conference, Workshop, Meeting, Wedding, Corporate Event, Training, Seminar, Other

### Rooms (6)
- Grand Ballroom (500 capacity)
- Conference Room A (100 capacity)
- Conference Room B (80 capacity)
- Boardroom (20 capacity)
- Training Room 1 (40 capacity)
- Meeting Room 1 (15 capacity)

### Addons (12)
- Coffee Break, Lunch/Dinner Buffets, PA System, Projector, Video Conference, and more

---

## 🔍 Testing the Schema

### Test 1: Check Tables
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 10
```

### Test 2: Check Seed Data
```sql
SELECT 
  (SELECT COUNT(*) FROM event_types) as event_types,
  (SELECT COUNT(*) FROM rooms) as rooms,
  (SELECT COUNT(*) FROM addons) as addons;
-- Expected: 8, 6, 12
```

### Test 3: Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
-- Should return multiple policies
```

### Test 4: Check Indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
-- Should show 25+ indexes
```

---

## 🎯 Next Steps After Setup

1. **Generate TypeScript Types**
   ```bash
   npx supabase gen types typescript --project-id jkurrsgbzzsxfwkrnbbu > src/types/database.types.ts
   ```

2. **Create First Admin User**
   - Sign up through Supabase Auth
   - Manually update user role to 'admin' in users table

3. **Test Booking Conflict Detection**
   ```sql
   SELECT * FROM check_booking_conflict(
     '<room_id>'::uuid,
     '2025-11-15'::date,
     '2025-11-15'::date,
     '09:00'::time,
     '17:00'::time
   );
   ```

4. **Proceed to Phase 3: Authentication & Authorization**

---

## 📝 Important Notes

### Booking Numbers
Auto-generated in format: `BK-YYYY-####`
Example: `BK-2025-0001`

### Document Numbers
- Quotations: `QT-YYYY-####`
- Invoices: `INV-YYYY-####`
- Contracts: `CT-YYYY-####`

### Timestamps
All timestamps use `TIMESTAMPTZ` (timezone-aware)
Default timezone: CAT (UTC+2)

### Activity Logging
- All booking changes are automatically logged
- Triggers capture create, update, and delete operations
- Logs include old and new values for audit trail

---

## 🐛 Troubleshooting

### Issue: "relation already exists"
**Solution**: Tables were already created. Safe to ignore or drop tables and re-run.

### Issue: "permission denied"
**Solution**: Ensure you're using the service role key with proper permissions.

### Issue: RLS blocking queries
**Solution**: Verify user has correct role in `users` table.

### Issue: Conflict detection not working
**Solution**: Ensure `check_booking_conflict` function is created (script 07).

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Project ERD](../docs/database_erd.md) (to be created)

---

**Database Version**: 1.0.0  
**Last Updated**: October 31, 2025  
**Status**: Ready for Production
