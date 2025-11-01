# Rainbow Towers Conference & Event Booking System
## Technical Documentation

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Authentication & Authorization](#authentication--authorization)
5. [Frontend Architecture](#frontend-architecture)
6. [Code Structure](#code-structure)
7. [Key Features](#key-features)
8. [Security Implementation](#security-implementation)

---

## System Architecture

### Technology Stack

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **Styling:** TailwindCSS 4
- **UI Components:** Custom component library
- **State Management:** React hooks + Context API
- **Forms:** React Hook Form + Zod validation
- **Calendar:** FullCalendar v6
- **Charts:** Recharts
- **PDF Generation:** jsPDF + jspdf-autotable

#### Backend
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes (Route Handlers)
- **Validation:** Zod schemas
- **File Storage:** Supabase Storage (future)

#### Development & Testing
- **Testing:** Jest + React Testing Library
- **Type Safety:** TypeScript strict mode
- **Code Quality:** ESLint + Prettier
- **Version Control:** Git

### Architecture Patterns

#### App Router (Next.js 15)
```
app/
├── (auth)/               # Authentication routes
│   ├── login/
│   └── unauthorized/
├── (dashboard)/          # Protected dashboard routes
│   ├── dashboard/
│   ├── bookings/
│   ├── calendar/
│   ├── reports/
│   └── admin/
├── api/                  # API route handlers
│   ├── bookings/
│   ├── clients/
│   ├── rooms/
│   ├── users/
│   ├── reports/
│   └── documents/
└── layout.tsx            # Root layout
```

#### Component Architecture
```
components/
├── ui/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Table.tsx
│   └── ...
└── layout/               # Layout components
    └── DashboardLayout.tsx
```

#### Service Layer
```
lib/
├── supabase/             # Supabase clients
│   ├── client.ts         # Browser client
│   ├── server.ts         # Server client
│   └── middleware.ts     # Auth middleware
├── auth/                 # Authentication services
│   ├── auth-service.ts
│   ├── server-auth.ts
│   └── hooks.ts
├── api/                  # API utilities
│   └── utils.ts
├── documents/            # PDF generation
│   └── pdf-generator.ts
├── utils/                # Utility functions
│   ├── dates.ts
│   ├── errors.ts
│   └── validation.ts
└── validations/          # Zod schemas
    └── schemas.ts
```

---

## Database Schema

### Tables Overview

#### 1. `users`
Stores user information and roles.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'reservations', 'sales', 'finance', 'auditor')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_users_email` on email
- `idx_users_role` on role

**RLS Policies:**
- Users can read their own data
- Admins can read all users
- Only admins can create/update/delete users

#### 2. `clients`
Stores client/customer information.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_clients_email` on email
- `idx_clients_organization` on organization

**RLS Policies:**
- All authenticated users can read active clients
- Reservations/sales roles can create clients
- Only admins can delete clients

#### 3. `rooms`
Conference room/venue information.

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_rooms_is_active` on is_active

**RLS Policies:**
- All authenticated users can read active rooms
- Only admins can create/update/delete rooms

#### 4. `event_types`
Types of events (conference, wedding, training, etc.).

```sql
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- All authenticated users can read active event types
- Admins/managers can create/update event types

#### 5. `addons`
Additional services (catering, equipment, etc.).

```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rate DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL CHECK (unit IN ('per_unit', 'per_day', 'per_hour', 'per_person')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- All authenticated users can read active addons
- Admins/managers can create/update addons

#### 6. `bookings`
Main booking records.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  event_type_id UUID NOT NULL REFERENCES event_types(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_bookings_date` on booking_date
- `idx_bookings_status` on status
- `idx_bookings_room_date` on (room_id, booking_date)
- `idx_bookings_client` on client_id

**RLS Policies:**
- All authenticated users can read bookings
- Reservations/sales roles can create bookings
- Only creator or admin can update/cancel bookings

#### 7. `booking_addons`
Junction table for booking-addon relationship.

```sql
CREATE TABLE booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_booking_addons_booking` on booking_id

#### 8. `payments`
Payment records for bookings.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_payments_booking` on booking_id
- `idx_payments_date` on payment_date

#### 9. `documents`
Generated documents (quotations, invoices).

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('quotation', 'invoice')),
  document_number VARCHAR(100) NOT NULL UNIQUE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES users(id),
  file_url TEXT
);
```

**Indexes:**
- `idx_documents_booking` on booking_id
- `idx_documents_number` on document_number

#### 10. `audit_logs`
System audit trail.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_audit_logs_user` on user_id
- `idx_audit_logs_table` on table_name
- `idx_audit_logs_created` on created_at

### Database Functions

#### 1. `update_updated_at_column()`
Automatically updates the `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to:** users, clients, rooms, event_types, addons, bookings

#### 2. `log_audit_trail()`
Automatically logs changes to audit_logs.

```sql
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to:** bookings, payments, users, clients, rooms

#### 3. `calculate_booking_total()`
Calculates total booking cost including room rate and addons.

```sql
CREATE OR REPLACE FUNCTION calculate_booking_total(
  p_room_id UUID,
  p_start_time TIME,
  p_end_time TIME,
  p_addons JSONB
) RETURNS DECIMAL AS $$
DECLARE
  room_rate DECIMAL;
  duration_hours DECIMAL;
  total DECIMAL := 0;
BEGIN
  -- Get room rate
  SELECT rate INTO room_rate FROM rooms WHERE id = p_room_id;
  
  -- Calculate duration in hours
  duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
  
  -- Calculate room cost (assuming daily rate / 8 hours)
  total := (room_rate / 8) * duration_hours;
  
  -- Add addon costs
  -- (simplified - actual implementation handles different unit types)
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;
```

### Relationships

```
users (1) ──────── (*) bookings
users (1) ──────── (*) clients (created_by)
users (1) ──────── (*) payments (created_by)

clients (1) ────── (*) bookings
rooms (1) ──────── (*) bookings
event_types (1) ── (*) bookings

bookings (1) ───── (*) booking_addons
bookings (1) ───── (*) payments
bookings (1) ───── (*) documents

addons (1) ────── (*) booking_addons
```

---

## API Reference

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Authentication
All API endpoints require authentication via Supabase Auth. Include the session token in requests.

### Bookings API

#### `GET /api/bookings`
Get list of bookings with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled, completed)
- `startDate` (optional): Filter bookings from this date (YYYY-MM-DD)
- `endDate` (optional): Filter bookings until this date (YYYY-MM-DD)
- `clientId` (optional): Filter by client ID
- `roomId` (optional): Filter by room ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "booking_date": "2025-02-01",
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "status": "confirmed",
      "total_amount": 500.00,
      "client": {
        "id": "uuid",
        "name": "John Doe",
        "organization": "ABC Corp"
      },
      "room": {
        "id": "uuid",
        "name": "Conference Room A",
        "capacity": 50
      },
      "event_type": {
        "id": "uuid",
        "name": "Conference"
      }
    }
  ]
}
```

#### `POST /api/bookings`
Create a new booking.

**Request Body:**
```json
{
  "client_id": "uuid",
  "room_id": "uuid",
  "event_type_id": "uuid",
  "booking_date": "2025-02-01",
  "start_time": "09:00",
  "end_time": "17:00",
  "attendees": 30,
  "notes": "Optional notes",
  "addons": [
    {
      "addon_id": "uuid",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "booking_date": "2025-02-01",
    "status": "pending",
    "total_amount": 650.00
  }
}
```

#### `GET /api/bookings/[id]`
Get single booking details.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "booking_date": "2025-02-01",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "status": "confirmed",
    "total_amount": 500.00,
    "notes": "Special requirements",
    "client": { ... },
    "room": { ... },
    "event_type": { ... },
    "addons": [
      {
        "addon": { "name": "Projector", "rate": 50.00 },
        "quantity": 2,
        "subtotal": 100.00
      }
    ]
  }
}
```

#### `PUT /api/bookings/[id]`
Update booking details.

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Updated notes"
}
```

#### `DELETE /api/bookings/[id]`
Cancel/soft delete a booking.

**Response:**
```json
{
  "message": "Booking cancelled successfully"
}
```

#### `POST /api/bookings/check-conflict`
Check for booking conflicts.

**Request Body:**
```json
{
  "room_id": "uuid",
  "booking_date": "2025-02-01",
  "start_time": "09:00",
  "end_time": "17:00",
  "exclude_booking_id": "uuid" // optional, for updates
}
```

**Response:**
```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "id": "uuid",
      "booking_date": "2025-02-01",
      "start_time": "14:00:00",
      "end_time": "18:00:00",
      "client": { "name": "Jane Smith" }
    }
  ]
}
```

### Clients API

#### `GET /api/clients`
Get list of clients.

#### `POST /api/clients`
Create a new client.

#### `GET /api/clients/[id]`
Get client details.

#### `PUT /api/clients/[id]`
Update client information.

#### `DELETE /api/clients/[id]`
Soft delete a client.

### Rooms API

#### `GET /api/rooms`
Get list of rooms.

#### `POST /api/rooms`
Create a new room (admin only).

#### `GET /api/rooms/[id]`
Get room details.

#### `PUT /api/rooms/[id]`
Update room information (admin only).

#### `DELETE /api/rooms/[id]`
Deactivate a room (admin only).

### Users API

#### `GET /api/users`
Get list of users (admin/manager only).

#### `POST /api/users`
Create a new user (admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role": "reservations",
  "phone": "+263771234567"
}
```

#### `PUT /api/users/[id]`
Update user details (admin only for role changes).

#### `DELETE /api/users/[id]`
Deactivate a user (admin only, cannot deactivate self).

### Reports API

#### `GET /api/reports/revenue`
Get revenue analytics.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `groupBy`: Grouping (day, week, month, year)

**Response:**
```json
{
  "data": [
    {
      "period": "2025-01",
      "total_bookings": 25,
      "confirmed_bookings": 20,
      "cancelled_bookings": 5,
      "total_revenue": 12500.00
    }
  ]
}
```

#### `GET /api/reports/utilization`
Get room utilization metrics.

**Response:**
```json
{
  "data": [
    {
      "room_id": "uuid",
      "room_name": "Conference Room A",
      "capacity": 50,
      "total_bookings": 15,
      "confirmed_bookings": 12,
      "total_revenue": 7500.00
    }
  ]
}
```

#### `GET /api/reports/clients`
Get client analytics (top clients by revenue).

**Response:**
```json
{
  "data": [
    {
      "client_id": "uuid",
      "client_name": "ABC Corp",
      "total_bookings": 10,
      "total_spent": 5000.00,
      "last_booking_date": "2025-01-15"
    }
  ]
}
```

### Documents API

#### `POST /api/documents/quotation`
Generate quotation PDF.

**Request Body:**
```json
{
  "booking_id": "uuid"
}
```

**Response:** PDF file download

#### `POST /api/documents/invoice`
Generate invoice PDF.

**Request Body:**
```json
{
  "booking_id": "uuid"
}
```

**Response:** PDF file download

---

## Authentication & Authorization

### Authentication Flow

1. **Login:** User submits credentials via `/login`
2. **Validation:** Supabase Auth validates credentials
3. **Session:** Auth token stored in HTTP-only cookie
4. **Middleware:** `middleware.ts` validates session on protected routes
5. **API Access:** Session token included in API requests

### Role-Based Access Control (RBAC)

#### Roles
1. **Admin** - Full system access
2. **Reservations** - Manage bookings, clients, rooms
3. **Sales** - Create bookings, view reports
4. **Finance** - View bookings, manage payments, generate invoices
5. **Auditor** - Read-only access to all data

#### Permission Matrix

| Feature | Admin | Reservations | Sales | Finance | Auditor |
|---------|-------|--------------|-------|---------|---------|
| View Bookings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Bookings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update Bookings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancel Bookings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Clients | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Rooms | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Payments | ✅ | ❌ | ❌ | ✅ | ❌ |
| Generate Documents | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ | ✅ |

### Authorization Checks

#### Server-Side (API Routes)
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!['admin', 'reservations'].includes(userData?.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Proceed with authorized operation
}
```

#### Client-Side (React Components)
```typescript
import { useAuth } from '@/lib/auth/hooks'

function AdminPanel() {
  const { user, userRole } = useAuth()
  
  if (userRole !== 'admin') {
    return <UnauthorizedMessage />
  }
  
  return <AdminContent />
}
```

---

## Frontend Architecture

### Page Structure

#### Public Pages
- `/login` - Authentication page

#### Protected Pages
- `/dashboard` - Main dashboard with statistics
- `/bookings` - Booking list and management
- `/bookings/new` - Create new booking
- `/bookings/[id]` - Booking details
- `/bookings/[id]/edit` - Edit booking
- `/calendar` - Calendar view of bookings
- `/reports` - Analytics and reports
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/rooms` - Room configuration
- `/admin/addons` - Addons & event types management

### State Management

#### React Context (Authentication)
```typescript
// lib/auth/auth-context.tsx
const AuthContext = createContext<AuthContextType>()

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>()
  
  // Auth state management
  
  return (
    <AuthContext.Provider value={{ user, userRole, ... }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### React Hook Form (Forms)
```typescript
const form = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema),
  defaultValues: { ... }
})

const onSubmit = async (data: BookingFormData) => {
  // Handle form submission
}
```

### Data Fetching

#### Server Components (Default)
```typescript
async function BookingsPage() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
  
  return <BookingsList bookings={bookings} />
}
```

#### Client Components (Interactive)
```typescript
'use client'

function BookingForm() {
  const [bookings, setBookings] = useState([])
  
  useEffect(() => {
    fetchBookings()
  }, [])
  
  const fetchBookings = async () => {
    const response = await fetch('/api/bookings')
    const { data } = await response.json()
    setBookings(data)
  }
  
  return <Form />
}
```

---

## Code Structure

### Project Organization

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group routes
│   │   ├── (dashboard)/       # Protected routes
│   │   ├── api/               # API route handlers
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Business logic
│   │   ├── supabase/          # Supabase clients
│   │   ├── auth/              # Authentication
│   │   ├── api/               # API utilities
│   │   ├── documents/         # PDF generation
│   │   ├── utils/             # Utility functions
│   │   └── validations/       # Zod schemas
│   └── types/                 # TypeScript types
│       ├── database.types.ts  # Supabase generated
│       └── index.ts           # Custom types
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── jest.config.ts             # Jest configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

### Naming Conventions

- **Components:** PascalCase (`Button.tsx`, `BookingForm.tsx`)
- **Utilities:** camelCase (`formatDate.ts`, `calculateTotal.ts`)
- **API Routes:** kebab-case folders (`/api/booking-addons`)
- **Types:** PascalCase (`BookingType`, `UserRole`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_CAPACITY`, `DEFAULT_DURATION`)

---

## Key Features

### 1. Booking Conflict Detection
Real-time conflict checking prevents double-booking of rooms.

**Algorithm:**
```typescript
function hasConflict(
  newBooking: { date, startTime, endTime },
  existingBookings: Booking[]
): boolean {
  return existingBookings.some(booking => {
    // Same date and overlapping time
    return booking.date === newBooking.date &&
      !(newBooking.endTime <= booking.startTime ||
        newBooking.startTime >= booking.endTime)
  })
}
```

### 2. Dynamic Cost Calculation
Automatically calculates booking total based on room rate, duration, and addons.

### 3. Document Generation
Professional PDF generation for quotations and invoices with branding.

### 4. Audit Trail
Comprehensive logging of all system changes for compliance and tracking.

### 5. Role-Based Dashboard
Customized dashboard experience based on user role.

### 6. Advanced Reporting
Revenue analytics, utilization metrics, and client insights with data visualization.

### 7. Calendar View
Interactive calendar with drag-and-drop, filtering, and color-coding by status.

---

## Security Implementation

### Data Protection
- **RLS Policies:** Row-level security on all tables
- **API Validation:** Zod schema validation on all inputs
- **SQL Injection:** Parameterized queries via Supabase
- **XSS Protection:** React auto-escaping + Content Security Policy

### Authentication Security
- **Password Hashing:** Bcrypt via Supabase Auth
- **Session Management:** HTTP-only cookies
- **Token Expiry:** Automatic session expiration
- **Email Verification:** Required for new accounts

### Authorization
- **Role Checks:** Server-side validation on every API call
- **Route Protection:** Middleware guards protected routes
- **Action Permissions:** Granular permission checks

### Best Practices
- Environment variables for secrets
- HTTPS enforcement in production
- CORS configuration
- Rate limiting (to be implemented)
- Input sanitization
- Error message sanitization (no sensitive data leakage)

---

## Performance Optimizations

### Frontend
- Server components for static content
- Client components only when needed
- React.lazy() for code splitting
- Image optimization with Next.js Image
- Tailwind CSS purging

### Backend
- Database indexes on frequently queried fields
- Query optimization with selective field fetching
- Connection pooling via Supabase
- Caching strategy (to be implemented)

### Build Optimization
- TypeScript strict mode
- Tree shaking
- Minification
- Static page generation where possible

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** Rainbow Towers Development Team
