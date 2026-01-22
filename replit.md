# Unified Portal - Enterprise Operations

## Overview

This is an enterprise operations portal called "Unified Portal" that provides a centralized hub for accessing business operational units, BI tools, and support systems. The portal integrates data from multiple business units: Boutique Mall, Equestrian Center, and Corporate.

The portal follows an "Enterprise Glassmorphism" design style - professional and high-tech, using Outfit font for headers and Inter for UI elements. It prioritizes data density, efficient navigation, and clear information hierarchy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Typography**: Outfit for headers (font-outfit), Inter for UI text
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains database tables and TypeScript types
- **Validation**: Zod schemas generated from Drizzle tables via drizzle-zod
- **Database**: PostgreSQL with tables for customers, profiles, users, tickets, etc.

### Project Structure
```
client/           # React frontend application
  src/
    components/   # Reusable UI components
    components/ui # shadcn/ui primitives
    pages/        # Route-level page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Data access layer
shared/           # Shared code between client/server
  schema.ts       # Database schema and types
```

### Key Pages & Routes
1. **Dashboard** (`/dashboard`) - Main landing page with hero section, metrics cards, business applications grid, intranet updates
2. **ERP** (`/erp`) - NetSuite Enterprise with Finance/Procurement/Inventory tabs, includes Qashio and Tagway modules
3. **HR** (`/hr`) - Kayan HRMS for employee directory, payroll, leaves
4. **Customer DB** (`/applications/customer-db`) - Master Customer Database consolidating Mall, Equestrian, Corporate units
5. **Projects** (`/projects`) - Monday.com-style project management
6. **Veterinary** (`/veterinary`) - Veterinary management system
7. **Settings** (`/settings`) - User profile and preferences
8. **Admin** (`/admin`) - User management (admin only)
9. **Legal** (`/legal`) - Legal & Compliance with contracts, compliance alerts, document categories
10. **Performance & KPIs** (`/performance-kpi`) - KPI tracking, metrics dashboard, performance alerts
11. **OPS & FM** (`/ops-fm`) - Operations & Facility Management with work orders, maintenance, utilities
12. **IT & DT** (`/it-dt`) - IT & Digital Transformation with system status, projects, security

### Business Units
The Master Customer Database consolidates data from three business units:
- **Boutique Mall** - Retail tenant customers
- **Equestrian Center** - Horse stable and riding customers
- **Corporate** - Business and corporate clients

### Collaboration Stamp System
The portal includes a Collaboration Stamp feature for tracking development status across sections:
- **Database Table**: `collaboration_blueprints` stores section name, status, ETA, notes, missing items, and ideas
- **Status Options**: In Development, In Review, Live, Enhancement Needed
- **Page Header Stamps**: `PageCollaborationStamp` component displays at top of each page when a blueprint exists
- **Management UI**: Projects page → Collaboration Stamps tab for creating/editing stamps
- **Section Names**: dashboard, business_units, erp, hrms, customer_db, equestrian, asset_lease, events, media_marketing, intranet, projects, legal, performance_kpi, ops_fm, it_dt

### Key Design Decisions
1. **Monorepo Structure**: Client and server share types through `shared/` directory
2. **Enterprise Glassmorphism**: Professional, high-tech design with glassmorphism effects
3. **Collapsible Sidebar**: Fixed-width sidebar navigation matching Linear/Retool patterns
4. **Global Search**: Universal search in header for systems, reports, or employees
5. **Notification System**: Bell icon with badge count in header

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema management (`drizzle-kit push`)

### UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-styled component library (new-york style variant)
- **Lucide React**: Icon library

### Data Fetching
- **TanStack Query**: Server state management with caching and refetching

### Build & Development
- **Vite**: Frontend dev server and bundler
- **TSX**: TypeScript execution for server
- **Tailwind CSS**: Utility-first CSS framework

### Authentication & Session
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware
- **bcryptjs**: Password hashing
- **Custom auth**: Username/password authentication with role-based access control (Admin, Editor, Viewer)
