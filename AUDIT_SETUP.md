# Setting Up Audit Logging

## Quick Start

Follow these steps to enable audit logging in your system:

### 1. Run Database Migration

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/08_audit_logs.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

**Option B: Using psql Command Line**
```bash
psql -d your_database_url < database/08_audit_logs.sql
```

**Option C: Using Supabase CLI**
```bash
supabase db push
```

### 2. Verify Installation

After running the migration, verify the table was created:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
);

-- Check RLS policies
SELECT policyname, tablename, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'audit_logs';
```

### 3. Access Audit Logs

1. Log in as an **admin** user
2. Navigate to **Admin → Audit Logs** in the sidebar
3. Or go directly to: `http://localhost:3000/admin/audit-logs`

### 4. Test the System

1. Create a new booking
2. Navigate to Audit Logs
3. You should see an entry for "Created booking..."

---

## Features

✅ **Comprehensive Tracking**: Logs all user actions with full context  
✅ **Admin-Only Access**: RLS policies ensure only admins can view logs  
✅ **Immutable Logs**: No updates or deletes allowed  
✅ **Advanced Filtering**: Filter by user, action, resource type, date range  
✅ **CSV Export**: Download filtered logs for compliance reports  
✅ **Detailed View**: See full changes, metadata, and request context  

---

## What Gets Logged

Currently logged actions:
- ✅ **Booking Creation** - Automatically logged when bookings are created

To add logging to other actions, see `AUDIT_LOGGING.md` for integration guide.

---

## Next Steps

1. **Review the logs**: Check what's being captured
2. **Add more logging**: Follow the integration guide in `AUDIT_LOGGING.md`
3. **Set retention policy**: Decide how long to keep logs (recommend 3-7 years)
4. **Export reports**: Use CSV export for compliance documentation

---

## Troubleshooting

**Problem**: "audit_logs table does not exist"  
**Solution**: Run the database migration (Step 1 above)

**Problem**: "Permission denied for table audit_logs"  
**Solution**: Ensure RLS policies are created (included in migration)

**Problem**: "Only admins can view logs"  
**Solution**: This is expected - log in with an admin account

**Problem**: No logs appearing  
**Solution**: Perform an action (create booking) and refresh the page

---

## Documentation

- **Full Documentation**: See `AUDIT_LOGGING.md`
- **Database Schema**: See `database/08_audit_logs.sql`
- **Code Examples**: See `/lib/audit/audit-logger.ts`

---

## Migration File Location

```
database/08_audit_logs.sql
```

This file contains:
- Table creation
- Indexes for performance
- RLS policies for security
- Audit log summary view
- Complete documentation
