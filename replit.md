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
2. **ERP** (`/erp`) - ERP module with collapsible sidebar sub-pages: Finance, Procurement, Inventory, Payments. Includes Qashio and Tagway external links. Routes: `/erp/finance`, `/erp/procurement`, `/erp/inventory`, `/erp/payments`.
   - **Requisitions List** (`/erp/procurement/requisitions`) - Table view with search, status filter, inline status editing (Submitted/Awaiting Approval/PO Created/Rejected), click-through to detail, per-row PDF download
   - **Requisition ARF** (`/erp/procurement/requisitions/new`) - Approval Request Form with 6 sections: request info, description, justification, budget details (AED cost, budgeted yes/no, vendor), file uploads (JPG/PNG/PDF), timeline
   - **Requisition Detail** (`/erp/procurement/requisitions/:id`) - Full detail view with status change, summary cards, all sections, attachment download
3. **HR** (`/hr`) - Kayan HRMS for employee directory, payroll, leaves
4. **Customer DB** (`/applications/customer-db`) - Multi-source Customer Database with 6 data sources (Pony Camp, Contact Form, Calls, Livery Clients, Riding Schools, Therapeutic). Each source has its own JSONB-based records table with dynamic columns. Features: source selector cards with record counts, dynamic table rendering, column sorting, search, pagination (25/page), Excel import with auto-mapping save, import history per source, Data Cleanup with duplicate scan/merge/delete per source. Accessible to all authenticated users (read-only for non-admins; import/edit restricted to superadmin). Listed in `pageRegistry` for per-user access control.
5. **Projects** (`/projects`) - Full project management system with create/edit, team assignments, deadline management, commenting, Collaboration Stamps, deadline alert badges (Overdue/Due Soon), Team Workload report tab. Monday and Tuesday views are independent — each space has a `viewType` ("monday" or "tuesday") and only appears in its respective view.
6. **DT Support / AKS Request Center** (`/intranet`) - Dual-department ticket management system (IT Support + Digital Transformation) with metrics dashboard, Analytics tab (avg resolution time, SLA breaches, department load), SLA overdue badges on tickets, category/subcategory filtering, assignee management, comments, status tracking (New → In Progress → Under Review → Resolved → Closed). Also includes Requisition ARF section (`/intranet/requisitions`) — same functionality as under Procurement, with context-aware navigation
7. **My Tickets** (`/my-tickets`) - User's submitted tickets with status filter, priority color-coded borders, status summary bar, create dialog supporting department/subcategory selection
8. **Admin Tickets** (`/admin-tickets`) - Admin ticket management with category/status filters, assignee management
9. **Veterinary** (`/veterinary`) - Veterinary management system
7. **Settings** (`/settings`) - User profile with avatar upload, notification preferences (ticket updates, project deadlines, system alerts, import notifications), theme preferences
8. **Admin** (`/admin`) - User management (admin only)
9. **Legal** (`/legal`) - Legal & Compliance with contracts, compliance alerts, document categories
10. **Performance & KPIs** (`/performance-kpi`) - KPI tracking, metrics dashboard, performance alerts
11. **OPS & FM** (`/ops-fm`) - Operations & Facility Management with work orders, maintenance, utilities
12. **IT Service Desk** (`/it-dt`) - IT Service Desk ticket management (same interface as Ticket Management). Accessible to all authenticated users. Non-admin users see only their own tickets; admin controls (status change, assignee) are hidden for non-admins. Backend enforces ticket ownership at all endpoints.

### Equestrian - StableMaster Hub
The StableMaster Hub (`/equestrian/stable-master`) is a separate implementation from Stable Assets Management (`/equestrian/stable-assets`), built from an external spec. It shares the same `sm_*` database tables and `/api/sm/` API endpoints, but has its own distinct frontend:
- **File structure**: `client/src/pages/stable-master-hub/` directory with separate files per page (index.tsx, horses.tsx, customers.tsx, items-services.tsx, facilities.tsx, livery-packages.tsx, agreements.tsx, new-agreement.tsx, billing.tsx, billing-elements.tsx, livery-report.tsx, livery-reports.tsx, schedule.tsx)
- **Navigation**: 5 collapsible groups in sidebar — Activities (Post Billing, Schedule), Billing Elements (Billing Elements), Livery (Agreements, New Agreement, Packages, Revenue Report), Reports (Livery Reports), Others (Horses, Customers, Stables & Boxes, Items & Services). No Administration section (handled by main portal).
- **Billing Elements page**: Adds extra charges to horses. Two modes: livery (auto-filled from active agreement context) and non-livery (manual customer/horse selection). Searchable dropdowns, price auto-computation `(unitPrice/100)*qty`, history table with delete. Uses `GET /api/sm/billing-elements/enriched`, `GET /api/sm/horses-with-agreements`, `POST /api/sm/billing-elements`.
- **Key differences from Stable Assets**: Items page is read-only (no CRUD), Facilities combines stables+boxes with server-side bulk generate endpoint, Billing shows active agreements with pre-filled dialog, Livery Report has KPI cards and monthly revenue breakdown, Livery Packages have covered items checkboxes, internal sidebar navigation
- **Backend additions**: `POST /api/sm/boxes/generate` (bulk box creation), `POST /api/sm/billing-elements/mark-billed` (batch mark as billed), `GET /api/sm/billing-elements/enriched` (enriched with entity names), `GET /api/sm/horses-with-agreements` (active agreements with enriched data), `netsuiteItemId` field on smItemServices, `agreementId` and `billingMonth` fields on smBillingElements

### Business Units
The Master Customer Database consolidates data from three business units:
- **Boutique Mall** - Retail tenant customers
- **Equestrian Center** - Horse stable and riding customers
- **Corporate** - Business and corporate clients

### Project Hierarchy (Space → Project → Task)
The Projects section uses a 3-level hierarchy for organizing work:
- **Spaces** (`spaces` table): Department-level grouping (e.g., "IT & Digital", "Operations", "HR & Admin"). Each has a name, color, description, and owner (`ownerId`). Any authenticated user can create a space (no admin required). Spaces with `ownerId=null` are legacy/public (visible to all). Spaces with an ownerId are private — visible only to owner and invited members.
- **Space Members** (`space_members` table): Junction table for space sharing. `POST /api/spaces/:id/members` (owner/admin), `DELETE /api/spaces/:id/members/:userId` (owner/admin), `GET /api/spaces/:id/members` (owner/admin/member). Unique constraint on `(spaceId, userId)`. Returns sanitized user DTO (no sensitive fields).
- **Project Groups** (`project_groups` table): Projects within a space (e.g., "Unified Portal", "Infrastructure Upgrade"). Belong to a space via `spaceId`. Have status, date range, color.
- **Tasks** (`projects` table): Individual work items within a project group. Linked via `projectGroupId` column. Tasks without a `projectGroupId` appear in an "Unassigned" section.
- **Monday View**: Shows hierarchy as collapsible Space → Project → Task tree with inline status/priority editing. All spaces/projects are synchronized and visible in both Monday and Tuesday views
- **Kanban View**: Flat drag-and-drop board grouped by status
- **API**: `/api/spaces/hierarchy?userId=<id>` returns full nested structure filtered by user visibility (SpaceWithHierarchy type)
- **Seed Data**: 3 sample spaces (no ownerId — public/backward-compat), 4 project groups, 14 sample tasks seeded on first run

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
- **Custom auth**: Username/password authentication with role-based access control (Superadmin, Admin, Finance, Procurement, Others). Only Superadmin can import data (Excel imports). Admin and Superadmin have full admin panel access.
- **Password Reset**: `password_reset_tokens` table stores tokens with expiry. Endpoints: `POST /api/auth/forgot-password` (generates token, sends email via SendGrid), `POST /api/auth/reset-password` (validates token, sets new password), `POST /api/admin/users/:id/reset-password-link` (admin generates reset link for a user). Frontend pages: `/forgot-password`, `/reset-password/:token`. In development mode only, if SendGrid fails, the token is returned in the API response as fallback.
- **SendGrid**: Configured via Replit SendGrid integration (connector). Helper: `server/sendgrid.ts` provides `getUncachableSendGridClient()` which returns `{ client, fromEmail }`. Uses Replit connector secrets (no manual API key needed). Used for password reset emails.

### Access Control System
- **Roles**: `superadmin`, `admin`, `finance`, `procurement`, `others`
- **Middleware**: `isAuthenticated`, `isAdmin` (admin+superadmin), `isSuperAdmin`, `isAdminOrAuthenticated`, `checkSubmoduleAccess(service, submodule)`
- **Superadmin Protection**: Only superadmins can create/modify/delete superadmin accounts or assign the superadmin role. Enforced in POST/PATCH/DELETE `/api/admin/users` routes
- **Service-Level Access**: `userServices` table maps users to enabled services. Sidebar filters services via `GET /api/my-services` (admins/superadmins see all). All data endpoints require authentication
- **Submodule Access**: `submoduleRegistry` in `shared/schema.ts` defines submodules for ERP (finance, procurement, inventory, payments), Equestrian (stable-assets, stable-master), Projects (monday, tuesday). `allowed_submodules` JSONB column on `managed_users`. `checkSubmoduleAccess` middleware on SM and requisition routes. Superadmins bypass all restrictions
- **Admin UI**: `UserServicesCell` in admin dashboard shows nested submodule checkboxes. `GET/PUT /api/admin/users/:id/submodules` endpoints
- **Page-Level Access**: `pageRegistry` in `shared/schema.ts` defines all portal pages (path + label). `allowed_pages` JSONB column on `managed_users` stores array of allowed paths per user. Null/empty means all pages allowed (no restrictions). `ProtectedRoutes` in App.tsx checks `user.allowedPages`; sidebar filters items via `canAccessPage()`. `UserPagesCell` in admin dashboard provides checkbox UI. `GET/PUT /api/admin/users/:id/pages` endpoints with server-side validation against pageRegistry. Admins/superadmins always have full access
- **Frontend Guards**: `canAccessSubmodule()` and `canAccessPage()` in sidebar, `ProtectedRoutes` in App.tsx checks `user.allowedPages` for per-user route restrictions, component-level guards on admin-dashboard, it-dt, sprint-management, system-settings pages
- **Data Sanitization**: All user-facing endpoints strip `password`, `mfaSecret`, `mfaBackupCodes` before responding (login, auth/user, /api/me, admin user CRUD)
- **SSO Tokens**: `sso_tokens` table stores one-time tokens for cross-app SSO with stable-master.replit.app. `POST /api/sso/generate-token` (authenticated, creates 5-min token), `POST /api/sso/verify-token` (public, validates & consumes token, returns user data). Sidebar "Stable Master MVP" link generates token on click and opens external app with `?token=` param.
- **Session Security**: Session regeneration on login (prevents session fixation), sameSite=lax cookie, httpOnly, secure in production
- **Security Headers**: Helmet middleware provides HSTS, CSP (self + inline styles/scripts for Vite/React, Monday.com iframe allowed), X-Content-Type-Options, X-Frame-Options
- **Rate Limiting**: `express-rate-limit` on `/api/auth/login` (5/min), `/api/auth/forgot-password` (3/min), `/api/sso/verify-token` (10/min). Registered in `server/index.ts` before auth routes to ensure correct middleware order
- **CORS**: Targeted CORS on `/api/sso/verify-token` only — allows `https://stable-master.replit.app` (configurable via `SSO_ALLOWED_ORIGINS` env var, comma-separated). No blanket CORS on other routes
- **Token Cleanup**: Hourly `setInterval` job deletes expired SSO tokens, used SSO tokens older than 1 hour, expired password-reset tokens, and used password-reset tokens. Method: `storage.cleanupExpiredTokens()`
- **Sensitive Log Redaction**: API response bodies are not logged for `/api/sso/generate-token`, `/api/sso/verify-token`, `/api/auth/login` to prevent token/credential leakage
- **Route Protection**: System management routes (blueprints, spaces, project-groups, project-tags, data-source settings) require `isAdmin`; DB operations (setUserServices, reorderPageSections) wrapped in transactions
- **SQL Safety**: getDsRecords sortBy parameter sanitized (alphanumeric + underscore only)

### Database Integrity (added March 2026)
- **Foreign Key Constraints**: All logical FK relationships now have `.references()` constraints in Drizzle schema with appropriate `onDelete` behavior (`cascade` for dependent data like comments/assignments, `set null` for optional references)
- **Database Indexes**: Added indexes on all FK columns and frequently filtered columns (role, category, status, isActive) across all tables for query performance
- **Tables with FK constraints**: `password_reset_tokens`, `tickets`, `ticket_comments`, `audit_logs`, `import_logs`, `spaces`, `project_groups`, `projects`, `project_assignments`, `project_comments`, `sm_billing_elements`, `sm_livery_agreements`, `sm_invoices`, `sm_invoice_lines`

### Error Handling
- **Global error handler** in `server/index.ts` logs errors via `console.error` without re-throwing (prevents process crashes)
- **Vite dev server** error handler logs errors without calling `process.exit(1)` (prevents server crashes on HMR issues)
