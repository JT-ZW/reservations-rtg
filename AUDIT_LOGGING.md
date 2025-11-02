# Audit Logging System Documentation

## Overview
The audit logging system tracks all user activities and system events for compliance, security, and troubleshooting purposes. All logs are immutable and accessible only to administrators.

---

## Database Schema

### Table: `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who performed the action (nullable) |
| `user_email` | TEXT | Email of the user |
| `user_role` | TEXT | Role of the user (admin/staff) |
| `action` | TEXT | Type of action (CREATE, UPDATE, DELETE, VIEW, LOGIN, etc.) |
| `resource_type` | TEXT | Type of resource (booking, client, room, user, etc.) |
| `resource_id` | TEXT | ID of the affected resource |
| `resource_name` | TEXT | Human-readable name of the resource |
| `description` | TEXT | Human-readable description |
| `changes` | JSONB | Before/after values for UPDATE actions |
| `metadata` | JSONB | Additional context (timestamps, amounts, etc.) |
| `ip_address` | TEXT | IP address of the request |
| `user_agent` | TEXT | Browser/client user agent |
| `request_method` | TEXT | HTTP method (GET, POST, PUT, DELETE) |
| `request_path` | TEXT | API endpoint called |
| `status` | TEXT | Status of action (success, failed, error) |
| `error_message` | TEXT | Error message if status is failed/error |
| `created_at` | TIMESTAMPTZ | Timestamp of the action |

### Security Features
- **Row Level Security (RLS)**: Enabled on the table
- **Admin-Only Access**: Only admin users can view logs
- **Immutable Logs**: No updates or deletes allowed via policies
- **Automatic Logging**: System can insert logs without user restrictions

---

## Usage

### 1. Basic Logging

```typescript
import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';

// In an API route
export async function POST(request: Request) {
  // ... your business logic ...
  
  await logAudit(
    {
      action: 'CREATE',
      resourceType: 'booking',
      resourceId: booking.id,
      resourceName: booking.event_name,
      description: `Created booking ${booking.booking_number} for ${booking.event_name}`,
      metadata: {
        booking_number: booking.booking_number,
        total_amount: booking.total_amount,
        status: booking.status,
      },
    },
    extractRequestContext(request)
  );
  
  return successResponse(booking, 'Booking created successfully', 201);
}
```

### 2. Tracking Changes (UPDATE actions)

```typescript
import { logAudit, getObjectDiff, extractRequestContext } from '@/lib/audit/audit-logger';

export async function PUT(request: Request) {
  // Get the resource before update
  const { data: oldBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();
  
  // Perform the update
  const { data: newBooking } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single();
  
  // Log the changes
  await logAudit(
    {
      action: 'UPDATE',
      resourceType: 'booking',
      resourceId: newBooking.id,
      resourceName: newBooking.event_name,
      description: `Updated booking ${newBooking.booking_number}`,
      changes: getObjectDiff(oldBooking, newBooking),
    },
    extractRequestContext(request)
  );
  
  return successResponse(newBooking);
}
```

### 3. Authentication Events

```typescript
import { logAuthEvent, extractRequestContext } from '@/lib/audit/audit-logger';

// On successful login
await logAuthEvent(
  'LOGIN',
  user.email,
  true,
  extractRequestContext(request)
);

// On failed login attempt
await logAuthEvent(
  'LOGIN',
  email,
  false,
  extractRequestContext(request),
  'Invalid credentials'
);

// On logout
await logAuthEvent(
  'LOGOUT',
  user.email,
  true,
  extractRequestContext(request)
);
```

### 4. Failed Actions

```typescript
try {
  // Attempt some action
  await deleteResource(id);
  
  await logAudit({
    action: 'DELETE',
    resourceType: 'client',
    resourceId: id,
    description: 'Deleted client',
    status: 'success',
  }, extractRequestContext(request));
} catch (error) {
  await logAudit({
    action: 'DELETE',
    resourceType: 'client',
    resourceId: id,
    description: 'Failed to delete client',
    status: 'failed',
    errorMessage: error.message,
  }, extractRequestContext(request));
  
  throw error;
}
```

---

## Action Types

| Action | Description | Use Case |
|--------|-------------|----------|
| `CREATE` | Resource created | New booking, client, room, user |
| `UPDATE` | Resource modified | Edit booking details, update rates |
| `DELETE` | Resource deleted | Remove client, cancel booking |
| `VIEW` | Resource viewed | View sensitive information |
| `LOGIN` | User logged in | Authentication event |
| `LOGOUT` | User logged out | Session termination |
| `EXPORT` | Data exported | Download CSV, generate report |
| `PRINT` | Document printed | Print invoice, quotation |
| `APPROVE` | Action approved | Approve booking, approve payment |
| `REJECT` | Action rejected | Reject booking request |
| `CANCEL` | Action cancelled | Cancel booking |
| `RESTORE` | Resource restored | Restore deleted item |

---

## Resource Types

| Resource Type | Description |
|---------------|-------------|
| `booking` | Booking/reservation |
| `client` | Client/customer |
| `room` | Meeting room |
| `user` | System user |
| `addon` | Add-on service |
| `event_type` | Event category |
| `document` | Invoice, quotation, etc. |
| `report` | Analytics report |
| `auth` | Authentication event |

---

## Viewing Audit Logs

### Admin UI
Navigate to **Admin → Audit Logs** (`/admin/audit-logs`)

Features:
- **Filters**: Search by user, action, resource type, status, date range
- **Details Modal**: View full log entry with changes, metadata, request context
- **Export**: Download filtered logs as CSV
- **Pagination**: 50 logs per page

### API Endpoint
**GET** `/api/admin/audit-logs`

Query Parameters:
- `user_id` - Filter by user UUID
- `action` - Filter by action type (CREATE, UPDATE, etc.)
- `resource_type` - Filter by resource (booking, client, etc.)
- `status` - Filter by status (success, failed, error)
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)
- `search` - Search in email, resource name, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

Response:
```json
{
  "logs": [
    {
      "id": "uuid",
      "created_at": "2025-01-15T10:30:00Z",
      "user_email": "admin@example.com",
      "user_role": "admin",
      "action": "CREATE",
      "resource_type": "booking",
      "resource_name": "Annual Conference",
      "description": "Created booking BK-2025-001",
      "status": "success",
      "ip_address": "192.168.1.100"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Export Logs
**POST** `/api/admin/audit-logs`

Request Body:
```json
{
  "filters": {
    "action": "CREATE",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

Response: CSV file download

---

## Integration Checklist

When adding audit logging to an API endpoint:

1. ✅ Import audit utilities:
   ```typescript
   import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';
   ```

2. ✅ Choose appropriate action type (CREATE, UPDATE, DELETE, etc.)

3. ✅ Identify resource type and resource info (ID, name)

4. ✅ Write descriptive, human-readable description

5. ✅ For UPDATE actions, include `changes` with before/after values

6. ✅ Add relevant metadata (amounts, dates, statuses, etc.)

7. ✅ Extract request context for IP, user agent, method, path

8. ✅ Handle errors - log failed actions with error messages

9. ✅ Test: Perform action, check Admin → Audit Logs

---

## Database Migration

To set up the audit logging system:

```bash
# Run the migration file
psql -d your_database < database/08_audit_logs.sql
```

Or in Supabase SQL Editor, execute the contents of `database/08_audit_logs.sql`

---

## Compliance & Privacy

### Data Retention
- **Recommendation**: Keep logs for regulatory period (typically 3-7 years)
- **Implementation**: Set up automated archiving after retention period
- **Storage**: Consider moving old logs to cold storage

### GDPR Considerations
- Audit logs contain personal data (email, IP address, user agent)
- Logs are necessary for legitimate interests (security, compliance)
- Document legal basis for processing in privacy policy
- Honor data subject access requests (DSARs) - provide user's audit history
- Consider pseudonymization for long-term retention

### Security
- Admin-only access enforced via RLS policies
- Immutable logs prevent tampering
- Regular backups recommended
- Monitor for suspicious patterns (multiple failed logins, unauthorized access attempts)

---

## Troubleshooting

### Logs not appearing
1. Check RLS policies are enabled
2. Verify user is authenticated when logging
3. Check browser console for errors
4. Verify audit_logs table exists in database

### Permission denied errors
1. Ensure user role is 'admin' for viewing logs
2. Check RLS policies are correctly configured
3. Verify INSERT policy allows system-wide inserts

### Performance issues
1. Indexes are created on common query fields
2. Consider partitioning by date for large datasets
3. Archive old logs to separate table
4. Use pagination in UI (already implemented)

---

## Future Enhancements

- [ ] Real-time notifications for critical actions
- [ ] Anomaly detection (unusual activity patterns)
- [ ] Scheduled audit reports (weekly/monthly summaries)
- [ ] Integration with external SIEM systems
- [ ] Automated log archiving based on retention policy
- [ ] Advanced analytics dashboard for audit trends
- [ ] Role-based access (different views for different admin levels)

---

## Example Queries

### Most active users (last 30 days)
```sql
SELECT user_email, COUNT(*) as action_count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_email
ORDER BY action_count DESC
LIMIT 10;
```

### Failed login attempts
```sql
SELECT user_email, ip_address, created_at, error_message
FROM audit_logs
WHERE action = 'LOGIN' AND status = 'failed'
ORDER BY created_at DESC;
```

### Resource deletions
```sql
SELECT user_email, resource_type, resource_name, created_at
FROM audit_logs
WHERE action = 'DELETE'
ORDER BY created_at DESC;
```

### User activity timeline
```sql
SELECT created_at, action, resource_type, resource_name, description
FROM audit_logs
WHERE user_email = 'user@example.com'
ORDER BY created_at DESC;
```

---

## Support

For questions or issues with the audit logging system:
1. Check this documentation
2. Review the code in `/lib/audit/audit-logger.ts`
3. Check database schema in `database/08_audit_logs.sql`
4. Contact system administrator
