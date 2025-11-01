# Rainbow Towers Conference & Event Booking System
## Deployment Guide

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Database Setup](#database-setup)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js:** v20.x or later
- **npm:** v10.x or later
- **Git:** Latest version
- **Code Editor:** VS Code (recommended)

### Required Accounts
- **Supabase:** Free tier or higher
- **Vercel:** Free tier for hosting (recommended)
- **GitHub:** For version control and CI/CD

### System Requirements
- **OS:** Windows 10+, macOS 10.15+, or Linux
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 2GB free space

---

## Environment Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/rainbow-towers-booking.git

# Navigate to project directory
cd rainbow-towers-booking/app
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Expected packages: ~834 packages
# Installation time: 1-2 minutes
```

### Step 3: Environment Variables

Create `.env.local` file in the root directory:

```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
```

**Required Environment Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Rainbow Towers Booking System"

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
```

**Security Notes:**
- ✅ Never commit `.env.local` to version control
- ✅ `.env.local` is in `.gitignore` by default
- ✅ Use different keys for development and production
- ✅ Service role key is for server-side only

---

## Supabase Configuration

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in details:
   - **Name:** rainbow-towers-booking
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get API Keys

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Paste into `.env.local`

### Step 3: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Configure settings:
   - **Enable Email Confirmations:** Yes (recommended)
   - **Enable Email Change Confirmations:** Yes
   - **Mailer:** Use Supabase SMTP or configure custom SMTP

**Custom SMTP (Optional):**
```
SMTP Host: smtp.your-provider.com
SMTP Port: 587
SMTP User: your-email@domain.com
SMTP Password: your-smtp-password
```

4. **Email Templates:**
   - Go to **Authentication** → **Email Templates**
   - Customize templates for:
     - Confirmation email
     - Password reset
     - Magic link
     - Email change confirmation

### Step 4: Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL:** `https://your-domain.com` (production)
   - **Redirect URLs:** 
     ```
     https://your-domain.com/auth/callback
     http://localhost:3000/auth/callback (for development)
     ```

### Step 5: Enable Row Level Security

1. Go to **Database** → **Tables**
2. For each table, enable RLS:
   - Click table name
   - Click **"Enable RLS"** if not enabled
3. RLS policies will be created in database setup

---

## Database Setup

### Method 1: SQL Editor (Recommended)

#### Step 1: Create Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy and paste the following schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'reservations', 'sales', 'finance', 'auditor')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients table
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

-- Create rooms table
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

-- Create event_types table
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create addons table
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

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  event_type_id UUID NOT NULL REFERENCES event_types(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking_addons junction table
CREATE TABLE booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
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

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('quotation', 'invoice')),
  document_number VARCHAR(100) NOT NULL UNIQUE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES users(id),
  file_url TEXT
);

-- Create audit_logs table
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

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_organization ON clients(organization);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_room_date ON bookings(room_id, booking_date);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_booking_addons_booking ON booking_addons(booking_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_documents_booking ON documents(booking_id);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

4. Click **"Run"** to execute
5. Verify tables created under **Database** → **Tables**

#### Step 2: Create Functions and Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply audit trail trigger
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_bookings AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

#### Step 3: Set Up RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Clients policies
CREATE POLICY "Authenticated users can view active clients" ON clients
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can create clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'reservations', 'sales')
    )
  );

-- Rooms policies
CREATE POLICY "Everyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Bookings policies
CREATE POLICY "Users can view bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Staff can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'reservations', 'sales')
    )
  );

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Booking addons policies
CREATE POLICY "Users can view booking addons" ON booking_addons
  FOR SELECT USING (true);

-- Payments policies
CREATE POLICY "Users can view payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Finance can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'finance')
    )
  );

-- Audit logs policies
CREATE POLICY "Admins and auditors can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'auditor')
    )
  );
```

#### Step 4: Seed Initial Data

```sql
-- Insert default event types
INSERT INTO event_types (name, description) VALUES
  ('Conference', 'Corporate conferences and meetings'),
  ('Wedding', 'Wedding ceremonies and receptions'),
  ('Training', 'Training sessions and workshops'),
  ('Party', 'Private parties and celebrations'),
  ('Seminar', 'Educational seminars');

-- Insert sample rooms
INSERT INTO rooms (name, capacity, rate, description) VALUES
  ('Conference Room A', 50, 500.00, 'Main conference room with projector and whiteboard'),
  ('Conference Room B', 30, 300.00, 'Medium-sized room with AV equipment'),
  ('Boardroom', 20, 250.00, 'Executive boardroom with video conferencing'),
  ('Training Room', 40, 400.00, 'Large room with training setup'),
  ('Banquet Hall', 200, 2000.00, 'Large hall for events and weddings');

-- Insert sample addons
INSERT INTO addons (name, description, rate, unit) VALUES
  ('Projector & Screen', 'HD projector with large screen', 50.00, 'per_unit'),
  ('Sound System', 'Professional audio system', 100.00, 'per_day'),
  ('Catering - Lunch', 'Buffet lunch per person', 15.00, 'per_person'),
  ('Catering - Snacks', 'Tea/coffee and snacks', 5.00, 'per_person'),
  ('Extra Tables', 'Additional tables', 10.00, 'per_unit'),
  ('Extra Chairs', 'Additional chairs', 5.00, 'per_unit');
```

### Step 5: Create Admin User

```sql
-- After creating your first user via Supabase Auth,
-- add them to users table and set as admin
INSERT INTO users (id, email, full_name, role, phone)
VALUES (
  'auth-user-id-here',  -- Replace with actual user ID from auth.users
  'admin@rainbowtowers.com',
  'System Administrator',
  'admin',
  '+263771234567'
);
```

**To get user ID:**
1. Go to **Authentication** → **Users**
2. Create new user or find existing
3. Copy the UUID
4. Use in above query

---

## Local Development

### Step 1: Start Development Server

```bash
# Start Next.js development server
npm run dev
```

Server starts at: `http://localhost:3000`

### Step 2: Verify Setup

1. **Open browser:** `http://localhost:3000`
2. **Expected:** Login page appears
3. **Login** with admin credentials
4. **Verify:** Dashboard loads successfully

### Step 3: Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Expected: All 41 tests passing
```

### Step 4: Type Checking

```bash
# Run TypeScript compiler check
npx tsc --noEmit

# Expected: No errors
```

### Step 5: Linting

```bash
# Run ESLint
npm run lint

# Expected: No errors or warnings
```

---

## Production Deployment

### Option 1: Vercel (Recommended)

#### Prerequisites
- GitHub repository with code
- Vercel account connected to GitHub

#### Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Push to main branch
git push origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

#### Step 3: Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

3. Click **"Save"**

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Deployment URL provided: `https://your-project.vercel.app`

#### Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

### Option 2: Custom Server

#### Prerequisites
- Ubuntu 20.04+ server
- Node.js 20+ installed
- Nginx installed
- SSL certificate (Let's Encrypt)

#### Step 1: Server Setup

```bash
# Connect to server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt-get install nginx
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/rainbow-towers-booking.git
cd rainbow-towers-booking/app

# Install dependencies
npm install

# Create .env.local with production values
nano .env.local
# Add all environment variables

# Build application
npm run build

# Start with PM2
pm2 start npm --name "rainbow-towers" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/rainbow-towers

# Add configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rainbow-towers /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

---

## Post-Deployment

### Step 1: Verify Deployment

**Checklist:**
- [ ] Application loads successfully
- [ ] Login works with test credentials
- [ ] Dashboard displays correctly
- [ ] Can create test booking
- [ ] Calendar loads and displays bookings
- [ ] Reports generate correctly
- [ ] PDF generation works
- [ ] All API endpoints respond

### Step 2: Create Admin User

```sql
-- In Supabase SQL Editor
INSERT INTO users (id, email, full_name, role, phone, is_active)
VALUES (
  'get-from-auth-users',
  'admin@rainbowtowers.com',
  'System Administrator',
  'admin',
  '+263771234567',
  true
);
```

### Step 3: Configure Email

1. **Supabase Email Settings:**
   - Verify SMTP configuration
   - Test email delivery
   - Customize templates

2. **Test Emails:**
   - Password reset
   - User creation
   - Booking confirmations (future feature)

### Step 4: Set Up Monitoring

**Recommended Tools:**
- **Vercel Analytics** (if using Vercel)
- **Sentry** for error tracking
- **LogRocket** for session replay
- **UptimeRobot** for uptime monitoring

### Step 5: Backup Strategy

**Database Backups:**
```bash
# Supabase provides automatic daily backups
# To create manual backup:
# Go to Supabase Dashboard → Database → Backups
# Click "Backup now"
```

**Code Backups:**
- Git repository serves as code backup
- Tag releases: `git tag v1.0.0`
- Push tags: `git push --tags`

### Step 6: Documentation

**Update Documentation:**
- [ ] Production URL in docs
- [ ] Admin credentials shared securely
- [ ] Deployment date recorded
- [ ] Known issues documented
- [ ] Maintenance procedures documented

---

## Troubleshooting

### Build Failures

**Issue:** Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors in reported files
# Re-run build
npm run build
```

**Issue:** Module not found errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Issue:** "Invalid Supabase URL" error

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` in environment variables
- Check URL format: `https://xxx.supabase.co`
- Restart server after changes

**Issue:** "Unauthorized" on all API calls

**Solution:**
- Check Supabase API keys are correct
- Verify RLS policies are applied
- Check user is authenticated
- Review auth middleware configuration

### Database Issues

**Issue:** Cannot connect to database

**Solution:**
- Verify Supabase project is active
- Check network connectivity
- Verify connection pooling settings
- Check Supabase status page

**Issue:** RLS policy blocking queries

**Solution:**
```sql
-- Check policies for table
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for testing (not for production!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Performance Issues

**Issue:** Slow page loads

**Solution:**
- Enable Vercel Edge Caching
- Optimize database queries
- Add indexes to frequently queried columns
- Use React Suspense for data loading
- Implement pagination on large lists

**Issue:** Slow database queries

**Solution:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM bookings WHERE...;

-- Add missing indexes
CREATE INDEX idx_name ON table_name(column_name);
```

---

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Monitor error logs
- [ ] Check system health
- [ ] Review failed jobs

**Weekly:**
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Update dependencies (if needed)

**Monthly:**
- [ ] Database backup verification
- [ ] Security updates
- [ ] Performance optimization review
- [ ] User access audit

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Restart (Vercel auto-deploys, for custom server:)
pm2 restart rainbow-towers
```

### Database Migrations

```sql
-- Example: Adding new column
ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50);

-- Update RLS if needed
-- Run tests
-- Deploy
```

---

## Security Checklist

**Before Going Live:**
- [ ] All environment variables are production keys
- [ ] Service role key is never exposed to client
- [ ] RLS is enabled on all tables
- [ ] HTTPS is enforced
- [ ] CORS is configured correctly
- [ ] Rate limiting is implemented
- [ ] Input validation on all forms
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] Email verification required
- [ ] Strong password policy enforced
- [ ] Session timeout configured
- [ ] Audit logging active

---

## Support

### Getting Help

**Documentation:**
- Technical Docs: `TECHNICAL_DOCS.md`
- User Guide: `USER_GUIDE.md`
- Testing Guide: `TESTING.md`

**Community:**
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

**Professional Support:**
- Email: support@rainbowtowers.com
- Phone: +263 (4) 123-4567

---

**Deployment Checklist:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** January 2025
