# Database Entity Relationship Diagram (ERD)

## Rainbow Towers Conference & Event Booking System

---

## 📊 Visual Schema Overview

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
└────────┬────────┘
         │
         │ extends
         ▼
┌─────────────────┐       ┌──────────────────┐
│     users       │       │   event_types    │
├─────────────────┤       ├──────────────────┤
│ • id (PK)       │       │ • id (PK)        │
│ • email         │       │ • name           │
│ • full_name     │       │ • description    │
│ • role          │       │ • is_active      │
│ • is_active     │       └──────────────────┘
│ • phone         │                │
│ • created_by    │                │
└────────┬────────┘                │
         │                         │
         │ created_by/updated_by   │
         ▼                         │
┌─────────────────┐                │
│     rooms       │                │
├─────────────────┤                │
│ • id (PK)       │                │
│ • name          │                │
│ • capacity      │                │
│ • rate_per_day  │                │
│ • amenities []  │                │
│ • is_available  │                │
└────────┬────────┘                │
         │                         │
         │                         │
┌─────────────────┐                │
│    clients      │                │
├─────────────────┤                │
│ • id (PK)       │                │
│ • org_name      │                │
│ • contact       │                │
│ • email         │                │
│ • phone         │                │
└────────┬────────┘                │
         │                         │
         └─────┬───────────────────┘
               │
               ▼
       ┌──────────────────┐
       │    bookings      │◄────────┐
       ├──────────────────┤         │
       │ • id (PK)        │         │
       │ • booking_number │         │
       │ • client_id (FK) │         │
       │ • room_id (FK)   │         │
       │ • event_type (FK)│         │
       │ • start_date     │         │
       │ • end_date       │         │
       │ • status         │         │
       │ • total_amount   │         │
       │ • final_amount   │         │
       └────────┬─────────┘         │
                │                   │
                │                   │
         ┌──────┴──────┐           │
         │             │           │
         ▼             ▼           │
┌─────────────┐ ┌──────────────┐  │
│   addons    │ │  documents   │  │
├─────────────┤ ├──────────────┤  │
│ • id (PK)   │ │ • id (PK)    │  │
│ • name      │ │ • booking_id │──┘
│ • rate      │ │ • doc_type   │
│ • unit      │ │ • doc_number │
└──────┬──────┘ │ • file_path  │
       │        └──────────────┘
       │
       │ many-to-many
       ▼
┌──────────────────┐
│ booking_addons   │
├──────────────────┤
│ • id (PK)        │
│ • booking_id(FK) │
│ • addon_id (FK)  │
│ • quantity       │
│ • rate           │
│ • subtotal       │
└──────────────────┘


┌─────────────────────────────┐
│     activity_logs           │
├─────────────────────────────┤
│ • id (PK)                   │
│ • user_id (FK)              │
│ • action                    │
│ • entity_type               │
│ • entity_id                 │
│ • details (JSONB)           │
│ • ip_address                │
│ • created_at                │
└─────────────────────────────┘

┌─────────────────────────────┐
│    auth_activity_log        │
├─────────────────────────────┤
│ • id (PK)                   │
│ • user_id (FK)              │
│ • email                     │
│ • action                    │
│ • success                   │
│ • ip_address                │
│ • created_at                │
└─────────────────────────────┘
```

---

## 🔑 Key Relationships

### 1. Users & Authentication
- Extends Supabase's `auth.users`
- One-to-one relationship with auth system
- Tracks created_by/updated_by on all entities

### 2. Bookings (Core Entity)
**Relationships:**
- `client_id` → `clients.id` (Many bookings to one client)
- `room_id` → `rooms.id` (Many bookings to one room)
- `event_type_id` → `event_types.id` (Many bookings to one event type)
- `created_by` → `users.id` (Tracking user)

### 3. Booking Addons (Junction)
- Many-to-many relationship between bookings and addons
- Stores quantity and rate at time of booking
- Calculated subtotal column

### 4. Documents
- One-to-many with bookings (multiple docs per booking)
- Stores file paths in Supabase Storage

### 5. Activity Logging
- Tracks all changes to entities
- No foreign key constraints (allows orphaned logs)
- JSONB details for flexible data storage

---

## 📋 Table Details

### Primary Tables (7)
1. **users** - User accounts with roles
2. **rooms** - Conference rooms/venues
3. **clients** - Client organizations
4. **bookings** - Event bookings
5. **addons** - Additional services
6. **event_types** - Event categories
7. **booking_addons** - Junction table

### Supporting Tables (3)
8. **activity_logs** - Audit trail
9. **auth_activity_log** - Login tracking
10. **documents** - Generated files

---

## 🔒 Security Model

### Row Level Security (RLS)

Every table has policies based on user roles:

```
Admin        → Full Access
Reservations → Manage bookings, clients
Sales        → View/create quotations
Finance      → View confirmed bookings
Auditor      → Read-only logs
```

---

## 🎯 Key Features

### Automatic Triggers
- ✅ Updated timestamps (`updated_at`)
- ✅ Activity logging (all changes tracked)
- ✅ Auto-generated booking numbers
- ✅ Auto-generated document numbers

### Computed Columns
- `bookings.final_amount` = total_amount - discount_amount
- `booking_addons.subtotal` = quantity * rate

### Constraints
- Date range validation
- Time range validation
- Unique booking numbers
- Prevent negative amounts

### Indexes (25+)
- Primary keys (all tables)
- Foreign keys (relationships)
- Status fields (filtering)
- Date fields (range queries)
- Composite indexes (conflict detection)

---

## 📊 Sample Data Flow

### Creating a Booking

```
1. User selects client (clients table)
2. User selects room (rooms table)
3. User selects event type (event_types table)
4. System checks conflicts (check_booking_conflict)
5. User adds addons (booking_addons table)
6. System calculates total (total_amount)
7. System generates booking number (BK-YYYY-####)
8. Booking created (bookings table)
9. Activity logged (activity_logs table)
10. Status: tentative → confirmed
```

### Generating Invoice

```
1. Retrieve booking details (bookings + client + room)
2. Get all addons (booking_addons)
3. Generate document number (get_next_document_number)
4. Create PDF
5. Upload to Supabase Storage
6. Save reference (documents table)
```

---

## 🧮 Calculated Fields

### Booking Financials
```sql
total_amount = (room_rate * days) + SUM(addon_subtotals)
discount_amount = user_entered_discount
final_amount = total_amount - discount_amount (STORED)
```

### Booking Days
```sql
days = (end_date - start_date) + 1
```

---

## 🔍 Important Views

### booking_details
Combines booking with client, room, event type info

### room_utilization  
Shows bookings per room and revenue

### client_booking_summary
Client history and total spending

---

**Schema Version**: 1.0.0  
**Total Tables**: 10  
**Total Indexes**: 25+  
**Total Triggers**: 15+  
**Total Functions**: 8
