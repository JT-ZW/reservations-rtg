# 🌈 Rainbow Towers Conference & Event Booking System

A comprehensive web-based booking management system for conference rooms and event spaces, built with Next.js 15 and Supabase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/tests-41%20passing-success)](./TESTING.md)

---

## 🌟 Features

### Core Functionality
- ✅ **Booking Management** - Create, edit, view, and cancel bookings
- ✅ **Conflict Detection** - Real-time validation prevents double-booking
- ✅ **Calendar View** - Interactive calendar with month/week/day views
- ✅ **Client Management** - Comprehensive client database with history
- ✅ **Reports & Analytics** - Revenue reports, utilization metrics, client insights
- ✅ **Document Generation** - Professional PDF quotations and invoices
- ✅ **Role-Based Access Control** - 5 user roles with granular permissions
- ✅ **Audit Trail** - Complete system activity logging

### User Roles
1. **Admin** - Full system access and configuration
2. **Reservations** - Booking and client management
3. **Sales** - Client-facing operations
4. **Finance** - Payment and invoice management
5. **Auditor** - Read-only access to all data

### Technical Highlights
- 🚀 **Next.js 15** with App Router for optimal performance
- 🔐 **Supabase Auth** with Row Level Security (RLS)
- 📊 **Real-time Analytics** with interactive charts (Recharts)
- 📱 **Responsive Design** optimized for desktop and mobile
- 🧪 **Comprehensive Testing** - 41 tests with Jest & React Testing Library
- 🔒 **Security First** - Input validation, XSS protection, HTTPS enforcement
- ⚡ **Fast Performance** - < 2s page load, optimized queries

---

## � Quick Start

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/rainbow-towers-booking.git
cd rainbow-towers-booking/app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📚 Documentation

Comprehensive documentation is available:

- **[Technical Documentation](TECHNICAL_DOCS.md)** - Architecture, database schema, API reference
- **[User Guide](USER_GUIDE.md)** - End-user instructions for all features
- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Testing Guide](TESTING.md)** - Testing strategy and how to run tests
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Pre-deployment verification

---

## 📁 Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── bookings/      # Booking management
│   │   │   ├── calendar/      # Calendar view
│   │   │   ├── reports/       # Analytics & reports
│   │   │   └── admin/         # Admin functions
│   │   └── api/               # API route handlers
│   │       ├── bookings/      # Booking endpoints
│   │       ├── clients/       # Client endpoints
│   │       ├── rooms/         # Room endpoints
│   │       ├── users/         # User management
│   │       ├── reports/       # Analytics endpoints
│   │       └── documents/     # PDF generation
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Business logic
│   │   ├── supabase/         # Supabase clients
│   │   ├── auth/             # Authentication
│   │   ├── documents/        # PDF generation
│   │   ├── utils/            # Utilities
│   │   └── validations/      # Zod schemas
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── .github/
│   └── workflows/            # CI/CD pipelines
└── documentation files       # Comprehensive guides
```

---

## � Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript 5.x (strict mode)
- **Styling:** TailwindCSS 4
- **Forms:** React Hook Form + Zod validation
- **Calendar:** FullCalendar v6
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable

### Backend
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes
- **Validation:** Zod schemas

### Development
- **Testing:** Jest + React Testing Library
- **CI/CD:** GitHub Actions
- **Type Checking:** TypeScript
- **Linting:** ESLint

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
```

---

## 🧪 Testing

### Test Coverage

```
Test Suites: 5 passed
Tests:       41 passed
Coverage:    Component coverage > 80%
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

See [TESTING.md](TESTING.md) for detailed testing guide.

---

## 🚀 Deployment

### Quick Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

---

## 📈 Project Status

### Completed Phases

- ✅ Phase 1: Foundation & Infrastructure
- ✅ Phase 2: Database Schema & Security
- ✅ Phase 3: Authentication & Authorization
- ✅ Phase 4: Core Business Logic & APIs
- ✅ Phase 5: UI Components & Layout
- ✅ Phase 6: Booking Management Module
- ✅ Phase 7: Calendar Interface
- ✅ Phase 8: Document Generation
- ✅ Phase 9: Reports & Analytics
- ✅ Phase 10: Admin & Settings Module
- ✅ Phase 11: Testing & Quality Assurance
- ✅ Phase 12: Documentation & Deployment

**Status:** Production Ready 🚀

---

## � Security

### Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ HTTPS enforcement
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ Input validation (Zod schemas)
- ✅ Secure session management
- ✅ Role-based access control
- ✅ Comprehensive audit logging

---

## 📞 Support

### Getting Help

- 📖 **Documentation:** Start with [User Guide](USER_GUIDE.md)
- 🐛 **Bug Reports:** GitHub Issues
- 📧 **Email:** support@rainbowtowers.com
- 📞 **Phone:** +263 (4) 123-4567

---

## � Acknowledgments

- **Next.js Team** - Amazing React framework
- **Supabase Team** - Excellent backend platform
- **Vercel** - Seamless deployment experience
- **Open Source Community** - Countless helpful libraries

---

**Built with ❤️ by Rainbow Towers Development Team**

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** Production Ready ✅
