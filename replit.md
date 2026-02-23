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
2. **ERP** (`/erp`) - NetSuite Enterprise with Finance/Procurement/Inventory tabs, includes Qashio and Tagway modules. Procurement tab has Requisition ARF tile linking to new form.
   - **Requisitions List** (`/erp/procurement/requisitions`) - Table view with search, status filter, inline status editing (Submitted/Awaiting Approval/Approved/Rejected), click-through to detail
   - **Requisition ARF** (`/erp/procurement/requisitions/new`) - Approval Request Form with 6 sections: request info, description, justification, budget details (AED cost, budgeted yes/no, vendor), file uploads (JPG/PNG/PDF), timeline
   - **Requisition Detail** (`/erp/procurement/requisitions/:id`) - Full detail view with status change, summary cards, all sections, attachment download
3. **HR** (`/hr`) - Kayan HRMS for employee directory, payroll, leaves
4. **Customer DB** (`/applications/customer-db`) - Master Customer Database consolidating Mall, Equestrian, Corporate units. Column sorting (click headers), clickable Business Unit filter cards, import history log tab, Excel import with duplicate detection, Data Cleanup with merge tools, pagination
5. **Projects** (`/projects`) - Full project management system with create/edit, team assignments, deadline management, commenting, Collaboration Stamps, deadline alert badges (Overdue/Due Soon), Team Workload report tab
6. **DT Support** (`/intranet`) - Dual-department ticket management system (IT Support + Digital Transformation) with metrics dashboard, Analytics tab (avg resolution time, SLA breaches, department load), SLA overdue badges on tickets, category/subcategory filtering, assignee management, comments, status tracking (New → In Progress → Under Review → Resolved → Closed)
7. **My Tickets** (`/my-tickets`) - User's submitted tickets with status filter, priority color-coded borders, status summary bar, create dialog supporting department/subcategory selection
8. **Admin Tickets** (`/admin-tickets`) - Admin ticket management with category/status filters, assignee management
9. **Veterinary** (`/veterinary`) - Veterinary management system
7. **Settings** (`/settings`) - User profile with avatar upload, notification preferences (ticket updates, project deadlines, system alerts, import notifications), theme preferences
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

### Project Hierarchy (Space → Project → Task)
The Projects section uses a 3-level hierarchy for organizing work:
- **Spaces** (`spaces` table): Department-level grouping (e.g., "IT & Digital", "Operations", "HR & Admin"). Each has a name, color, description, and owner.
- **Project Groups** (`project_groups` table): Projects within a space (e.g., "Unified Portal", "Infrastructure Upgrade"). Belong to a space via `spaceId`. Have status, date range, color.
- **Tasks** (`projects` table): Individual work items within a project group. Linked via `projectGroupId` column. Tasks without a `projectGroupId` appear in an "Unassigned" section.
- **Monday View**: Shows hierarchy as collapsible Space → Project → Task tree with inline status/priority editing
- **Kanban View**: Flat drag-and-drop board grouped by status
- **API**: `/api/spaces/hierarchy` returns full nested structure (SpaceWithHierarchy type)
- **Seed Data**: 3 sample spaces, 4 project groups, 14 sample tasks seeded on first run

### Collaboration Stamp System
The portal includes a Collaboration Stamp feature for tracking development status across sections:
- **Database Table**: `collaboration_blueprints` stores section name, status, ETA, notes, missing items, and ideas
- **Status Options**: In Development, In Review, Live, Enhancement Needed
- **Page Header Stamps**: `PageCollaborationStamp` component displays at top of each page when a blueprint exists
- **Management UI**: Projects page → Collaboration Stamps tab for creating/editing stamps
- **Section Names**: dashboard, business_units, erp, hrms, customer_db, equestrian, asset_lease, events, media_marketing, intranet, projects, legal, performance_kpi, ops_fm, it_dt

### Unified Section-Based Page Architecture
All service pages use a unified architecture driven by backend-configured sections:
- **Database Tables**: `section_templates` (12 reusable template types) and `page_sections` (35+ sections linked to services)
- **Section Templates**: cards_grid, data_table, list, metrics_row, iframe_embed, hero_banner, tabs, activity_feed, quick_links
- **ServicePageLayout** (`components/service-page-layout.tsx`): Unified wrapper that fetches sections from `/api/services/:id/sections`, renders page header, sub-sidebar, and section content
- **ServiceSubSidebar** (`components/service-sub-sidebar.tsx`): Secondary collapsible sidebar inside service pages showing subsections, independent from main sidebar
- **Refactored Pages**: performance-kpi, ops-fm, business-units, equestrian, asset-lease, events, legal, hrms, media-marketing all use ServicePageLayout with renderSection pattern
- **Admin Management**: System Settings → Page Sections tab for managing templates and section assignments per service

### Reusable UI Components
- **ExpandableSection** (`components/expandable-section.tsx`): Desktop-window style 3-state system: normal (inline), expanded (fills page area with larger card), minimized (collapses to bottom taskbar strip). MinimizedSectionsProvider context manages minimized sections globally. MinimizedTaskbar shows all minimized sections for quick restore. Cleanup on unmount prevents stale taskbar entries.
- **DetailPanel** (`components/detail-panel.tsx`): Right-side slide-in panel for previewing items (announcements, records). Supports Escape key, backdrop click to close, header/content/footer zones.
- **NotificationDropdown** (`components/notification-dropdown.tsx`): Bell icon popover in the header showing notifications with read/unread states and mark-all-read action.
- **NotificationReminder** (`components/notification-reminder.tsx`): Floating bottom-right popup with Snooze/Dismiss actions, Microsoft Outlook-style reminder system.

### Key Design Decisions
1. **Monorepo Structure**: Client and server share types through `shared/` directory
2. **Enterprise Glassmorphism**: Professional, high-tech design with glassmorphism effects
3. **Collapsible Sidebar**: Fixed-width sidebar navigation matching Linear/Retool patterns, h-9 nav items, 10px section labels
4. **Global Search**: Universal search in header for systems, reports, or employees
5. **Notification System**: Bell dropdown popover + floating reminder popup with Snooze/Dismiss
6. **Sticky Header**: 56px (h-14) sticky header with search, notifications, and theme toggle
7. **Dashboard Layout**: Dark hero section, 3-column grid (2+1), business app cards, intranet updates with slide-in detail panel, Power BI in ExpandableSection
8. **Section-Based Architecture**: All service pages built from configurable section templates stored in backend, with enable/disable and ordering controls
9. **Icon Library System**: Backend-managed `icon_library` table with 29 pre-seeded Lucide icons. IconPicker component shows all icons in a categorized grid; icons already assigned to other services are grayed out (unique per service). Admins can add custom Lucide icons with live preview and validation. Integrated into service create/edit dialogs.

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
