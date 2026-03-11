# StableMaster - Complete Reconstruction Specification

## 1. Product Overview

### What the Application Does
StableMaster is a web-based equestrian stable management system for managing horses, customers, stables/boxes (stalls), items & services, billing elements, livery (boarding) agreements, livery packages, and revenue reporting. It is an MVP intended for a single-stable or small multi-stable equestrian operation.

### Main User Workflows
1. **Stable Setup**: Create stables, then generate boxes (stalls/storage/tacking rooms) in bulk with a prefix and count.
2. **Horse & Customer Management**: Add/edit horses and customers with status tracking (ACTIVE/INACTIVE).
3. **Items & Services Catalogue**: Read-only view of billable items/services with search, category filter, and active-only toggle. Items are seeded and managed externally (no create/edit UI).
4. **Livery Agreement Creation**: Browse available boxes in a grid, select one, then fill a dialog form with customer, optional horse (ghost agreements allowed), agreement type, dates, optional livery package. Creating an agreement marks the box as OCCUPIED.
5. **Post Billing Elements**: Browse active livery agreements, filter by stable/horse, click "Add" on an agreement row to open a pre-filled billing entry dialog (horse, customer, box auto-populated from agreement context).
6. **Livery Packages**: Create/edit reusable package templates with a monthly price and a set of covered items/services.
7. **Livery Revenue Report**: Date-range and customer-filterable report showing monthly breakdown of livery revenue (from packages) and ad-hoc revenue (from billing elements) per customer, with KPI summary cards.
8. **Demo Data Reset**: Global Settings page allows wiping all data and re-seeding demo records.

### Core Features
- Full CRUD for horses, customers, stables, livery packages
- Create-only for livery agreements, billing elements
- Read-only catalogue for items & services
- Bulk box generation (prefix + count + type)
- Ghost livery agreements (no horse assigned, customer reserves a box)
- Box occupancy tracking (AVAILABLE -> OCCUPIED on agreement creation)
- Livery revenue report with date range, customer filter, KPI cards
- Searchable dropdown (combobox) component used throughout
- Skeleton loading states on all pages
- Empty state components with action buttons
- Toast notifications for all mutations
- Demo data seeding on first startup + manual reset

---

## 2. Tech Stack

### Languages
- TypeScript (100% - both frontend and backend)

### Frameworks
- **Frontend**: React 18.3 (SPA, client-side rendering)
- **Backend**: Express 5.0 (REST API)
- **Build**: Vite 7.3 (dev server + production build)

### Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.60.5 | Server state management, data fetching |
| `wouter` | ^3.3.5 | Client-side routing |
| `drizzle-orm` | ^0.39.3 | PostgreSQL ORM |
| `drizzle-zod` | ^0.7.0 | Zod schema generation from Drizzle schemas |
| `zod` | ^3.24.2 | Runtime validation |
| `react-hook-form` | ^7.55.0 | Form state management (available but not actively used - forms use useState) |
| `@hookform/resolvers` | ^3.10.0 | Zod resolver for react-hook-form |
| `cmdk` | ^1.1.1 | Command palette / searchable combobox |
| `lucide-react` | ^0.453.0 | Icons |
| `tailwind-merge` | ^2.6.0 | Tailwind class merging |
| `clsx` | ^2.1.1 | Conditional classnames |
| `class-variance-authority` | ^0.7.1 | Component variant management |
| `date-fns` | ^3.6.0 | Date utilities (available but report uses native Date) |
| `recharts` | ^2.15.2 | Charting (available, not actively used in MVP) |
| `framer-motion` | ^11.13.1 | Animation (available, not actively used) |
| `pg` | ^8.16.3 | PostgreSQL client driver |
| `tailwindcss` | ^3.4.17 | CSS framework |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `@tailwindcss/typography` | ^0.5.15 | Typography plugin |
| `esbuild` | ^0.25.0 | Server bundle for production |
| `tsx` | ^4.20.5 | TypeScript execution (dev mode) |

### Radix UI Primitives (Shadcn UI foundation)
All `@radix-ui/react-*` packages: accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip.

### Runtime Environment
- Node.js (NixOS-based Linux container on Replit)
- PostgreSQL database (Replit-managed)

### External APIs
- None. The application is self-contained with no external API calls.

---

## 3. Architecture

### System Architecture
Single-process monolith: Express serves both the REST API and the React SPA from the same port.

```
Client Browser
    |
    v
Express Server (port from $PORT or 5000)
    |-- /api/* routes  -->  Storage Layer  -->  PostgreSQL
    |-- /* (SPA)       -->  Vite (dev) or static files (prod)
```

### Frontend Structure
- **SPA** with client-side routing via `wouter`
- **State**: TanStack Query for server state; React `useState` for local/form state
- **Data fetching**: Default query function fetches from `queryKey[0]` URL. Mutations use `apiRequest()` helper.
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Components**: Shadcn UI (New York style) with custom components (PageHeader, EmptyState, SearchableSelect)

### Backend Structure
- `server/index.ts` - Express app setup, middleware, HTTP server
- `server/routes.ts` - All `/api/*` route handlers (thin controllers)
- `server/storage.ts` - `IStorage` interface + `DatabaseStorage` class (repository pattern)
- `server/seed.ts` - Demo data seeding function
- `server/db.ts` - Database connection pool + Drizzle instance
- `server/vite.ts` - Vite dev server middleware setup
- `server/static.ts` - Production static file serving

### Data Flow
1. Frontend component renders, TanStack Query fires GET to `/api/resource`
2. Express route handler calls `storage.getResource()`
3. `DatabaseStorage` executes Drizzle query against PostgreSQL
4. JSON response returned to frontend, cached by TanStack Query
5. Mutations: component calls `apiRequest(method, url, body)` -> Express validates with Zod -> `storage.createResource(data)` -> invalidate query cache

### Authentication
- **None implemented**. The MVP has no authentication or authorization. All endpoints are publicly accessible. Session infrastructure (express-session, passport, passport-local) is installed but not wired up.

---

## 4. Database

### Full Schema

#### Table: `stables`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID generated server-side |
| `name` | `text` | NOT NULL | Stable name |
| `notes` | `text` | nullable | Optional notes |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Soft-active flag |

#### Table: `boxes`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `stable_id` | `varchar(36)` | NOT NULL | FK to stables (logical, not enforced) |
| `name` | `text` | NOT NULL | Box name (e.g., "A01", "BS01") |
| `box_type` | `text` | NOT NULL DEFAULT 'STALL' | Enum: STALL, STORAGE, TACKING_ROOM |
| `status` | `text` | NOT NULL DEFAULT 'AVAILABLE' | Enum: AVAILABLE, OCCUPIED, MAINTENANCE |
| `current_horse_id` | `varchar(36)` | nullable | FK to horses (logical) |
| `notes` | `text` | nullable | Optional notes |

#### Table: `horses`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `name` | `text` | NOT NULL | Horse name |
| `dob` | `text` | nullable | Date of birth (YYYY-MM-DD string) |
| `remarks` | `text` | nullable | Notes |
| `color` | `text` | nullable | Coat color |
| `sex` | `text` | nullable | Stallion, Mare, Gelding, Colt, Filly |
| `group` | `text` | nullable | Training, Competition, etc. |
| `status` | `text` | NOT NULL DEFAULT 'ACTIVE' | ACTIVE or INACTIVE |

#### Table: `customers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `name` | `text` | NOT NULL | Customer name |
| `email` | `text` | nullable | Email address |
| `phone` | `text` | nullable | Phone number |
| `remarks` | `text` | nullable | Notes |
| `status` | `text` | NOT NULL DEFAULT 'ACTIVE' | ACTIVE or INACTIVE |

#### Table: `item_services`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `netsuite_item_id` | `text` | nullable | External system reference |
| `description` | `text` | NOT NULL | Item/service name |
| `default_unit_price` | `numeric(10,2)` | NOT NULL DEFAULT '0' | Default price |
| `base_unit` | `text` | NOT NULL DEFAULT 'each' | Unit of measure (month, each, hour) |
| `is_active` | `boolean` | NOT NULL DEFAULT true | Active flag |
| `category` | `text` | NOT NULL DEFAULT 'SERVICE' | SERVICE or ITEM |

#### Table: `billing_elements`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `box_id` | `varchar(36)` | nullable | FK to boxes |
| `transaction_date` | `text` | NOT NULL | Date string YYYY-MM-DD |
| `ref_number` | `text` | nullable | Reference number |
| `remarks` | `text` | nullable | Notes |
| `horse_id` | `varchar(36)` | nullable | FK to horses (null for ghost) |
| `customer_id` | `varchar(36)` | NOT NULL | FK to customers |
| `item_service_id` | `varchar(36)` | NOT NULL | FK to item_services |
| `unit` | `text` | NOT NULL | Unit of measure |
| `unit_price` | `numeric(10,2)` | NOT NULL | Price per unit |
| `quantity` | `numeric(10,3)` | NOT NULL | Quantity |
| `billed` | `boolean` | NOT NULL DEFAULT false | Whether invoiced |
| `invoice_id` | `varchar(36)` | nullable | FK to invoices |
| `created_at` | `timestamp` | DEFAULT now() | Creation timestamp |

#### Table: `livery_packages`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `name` | `text` | NOT NULL | Package name |
| `monthly_price` | `numeric(10,2)` | NOT NULL | Monthly fee |
| `covered_item_service_ids` | `text` | NOT NULL DEFAULT '' | Comma-separated item_service IDs |

#### Table: `livery_agreements`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `agreement_type` | `text` | NOT NULL DEFAULT 'PERMANENT_AUTO_RENEW' | PERMANENT_AUTO_RENEW or TEMPORARY |
| `start_date` | `text` | NOT NULL | YYYY-MM-DD |
| `end_date` | `text` | nullable | YYYY-MM-DD (required for TEMPORARY) |
| `stable_id` | `varchar(36)` | NOT NULL | FK to stables |
| `box_id` | `varchar(36)` | NOT NULL | FK to boxes |
| `horse_id` | `varchar(36)` | nullable | FK to horses (null = ghost agreement) |
| `customer_id` | `varchar(36)` | NOT NULL | FK to customers |
| `customer_contact` | `text` | nullable | Contact info override |
| `ref_number` | `text` | nullable | Reference number |
| `livery_package_id` | `varchar(36)` | nullable | FK to livery_packages |
| `remarks` | `text` | nullable | Notes |

#### Table: `invoices`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `customer_id` | `varchar(36)` | NOT NULL | FK to customers |
| `invoice_date` | `text` | NOT NULL | YYYY-MM-DD |
| `invoice_ref` | `text` | nullable | Invoice reference |
| `total` | `numeric(12,2)` | NOT NULL DEFAULT '0' | Invoice total |
| `status` | `text` | NOT NULL DEFAULT 'DRAFT' | DRAFT, etc. |
| `created_at` | `timestamp` | DEFAULT now() | Creation timestamp |

#### Table: `invoice_lines`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar(36)` | PRIMARY KEY | UUID |
| `invoice_id` | `varchar(36)` | NOT NULL | FK to invoices |
| `description` | `text` | NOT NULL | Line item description |
| `quantity` | `numeric(10,3)` | NOT NULL | Quantity |
| `unit_price` | `numeric(10,2)` | NOT NULL | Unit price |
| `total` | `numeric(12,2)` | NOT NULL | Line total |
| `source` | `text` | NOT NULL DEFAULT 'ADHOC' | Origin type |
| `source_id` | `varchar(36)` | nullable | Source record ID |
| `billing_month` | `text` | nullable | YYYY-MM |

### Relationships (Logical, Not Enforced with FK Constraints)
- `boxes.stable_id` -> `stables.id`
- `boxes.current_horse_id` -> `horses.id`
- `billing_elements.box_id` -> `boxes.id`
- `billing_elements.horse_id` -> `horses.id`
- `billing_elements.customer_id` -> `customers.id`
- `billing_elements.item_service_id` -> `item_services.id`
- `billing_elements.invoice_id` -> `invoices.id`
- `livery_agreements.stable_id` -> `stables.id`
- `livery_agreements.box_id` -> `boxes.id`
- `livery_agreements.horse_id` -> `horses.id`
- `livery_agreements.customer_id` -> `customers.id`
- `livery_agreements.livery_package_id` -> `livery_packages.id`
- `invoices.customer_id` -> `customers.id`
- `invoice_lines.invoice_id` -> `invoices.id`

### Indexes
- Only primary key indexes. No additional indexes defined.

### Example Seed Records

**Horses:**
| Name | DOB | Color | Sex | Group | Status |
|------|-----|-------|-----|-------|--------|
| Thunder | 2018-04-15 | Bay | Stallion | Competition | ACTIVE |
| Whisper | 2019-08-22 | Grey | Mare | Training | ACTIVE |
| Storm | 2017-01-10 | Black | Gelding | Competition | ACTIVE |
| Daisy | 2020-06-03 | Chestnut | Filly | Training | ACTIVE |

**Customers:**
| Name | Email | Phone | Status |
|------|-------|-------|--------|
| Sarah Johnson | sarah@example.com | +44 7700 900001 | ACTIVE |
| James Wilson | james.w@example.com | +44 7700 900002 | ACTIVE |
| Emily Carter | emily.carter@example.com | +44 7700 900003 | ACTIVE |

**Items/Services:**
| Description | Category | Base Unit | Price | Active | NetSuite ID |
|-------------|----------|-----------|-------|--------|-------------|
| Full Livery | SERVICE | month | 850.00 | true | NS-001 |
| Part Livery | SERVICE | month | 550.00 | true | NS-002 |
| Hay Bale | ITEM | each | 12.50 | true | NS-003 |
| Farrier Visit | SERVICE | each | 95.00 | true | NS-004 |
| Arena Hire | SERVICE | hour | 25.00 | true | NS-005 |
| Horse Clipping | SERVICE | each | 65.00 | false | NS-006 |

**Stables:**
| Name | Notes | Active |
|------|-------|--------|
| Main Stable | Primary stabling facility | true |
| Outdoor Barn | Seasonal overflow barn | true |

**Generated Boxes:**
- Main Stable: A01-A10 (STALL), B01-B08 (STALL), BS01-BS02 (STORAGE)
- Outdoor Barn: C01-C04 (STALL), T01 (TACKING_ROOM)

**Livery Packages:**
| Name | Monthly Price | Covered Items |
|------|---------------|---------------|
| Premium Full Livery | 950.00 | Full Livery, Hay Bale, Farrier Visit |
| Basic Part Livery | 600.00 | Part Livery, Hay Bale |

---

## 5. API Layer

### All Endpoints

All endpoints are prefixed with `/api/`. No authentication required. All request/response bodies are JSON.

#### Stables
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/stables` | - | `Stable[]` | List all stables |
| POST | `/api/stables` | `{ name, notes?, isActive? }` | `Stable` | Create stable |
| PATCH | `/api/stables/:id` | Partial `InsertStable` | `Stable` | Update stable |

#### Boxes
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/boxes` | - | `Box[]` | List all boxes |
| POST | `/api/boxes` | `{ stableId, name, boxType?, status?, currentHorseId?, notes? }` | `Box` | Create single box |
| PATCH | `/api/boxes/:id` | Partial `InsertBox` | `Box` | Update box |
| POST | `/api/boxes/generate` | `{ stableId, prefix, count, boxType }` | `Box[]` | Bulk generate boxes |

**Generate Logic**: Creates `count` boxes named `{prefix}01`, `{prefix}02`, ... `{prefix}{count}` (zero-padded to 2 digits), all with status AVAILABLE.

#### Horses
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/horses` | - | `Horse[]` | List all |
| POST | `/api/horses` | `{ name, dob?, color?, sex?, group?, status?, remarks? }` | `Horse` | Create |
| PATCH | `/api/horses/:id` | Partial `InsertHorse` | `Horse` | Update |

#### Customers
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/customers` | - | `Customer[]` | List all |
| POST | `/api/customers` | `{ name, email?, phone?, status?, remarks? }` | `Customer` | Create |
| PATCH | `/api/customers/:id` | Partial `InsertCustomer` | `Customer` | Update |

#### Items & Services
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/item-services` | - | `ItemService[]` | List all (read-only, no POST/PATCH exposed) |

#### Billing Elements
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/billing-elements` | - | `BillingElement[]` | Sorted by transactionDate DESC, then createdAt DESC |
| POST | `/api/billing-elements` | `{ boxId?, transactionDate, refNumber?, remarks?, horseId?, customerId, itemServiceId, unit, unitPrice, quantity }` | `BillingElement` | Create billing entry |
| POST | `/api/billing-elements/mark-billed` | `{ ids: string[], invoiceId: string }` | `{ success: true }` | Mark entries as billed |

#### Livery Packages
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/livery-packages` | - | `LiveryPackage[]` | List all |
| POST | `/api/livery-packages` | `{ name, monthlyPrice, coveredItemServiceIds? }` | `LiveryPackage` | Create |
| PATCH | `/api/livery-packages/:id` | Partial `InsertLiveryPackage` | `LiveryPackage` | Update |

#### Livery Agreements
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/livery-agreements` | - | `LiveryAgreement[]` | List all |
| POST | `/api/livery-agreements` | `{ agreementType?, startDate, endDate?, stableId, boxId, horseId?, customerId, customerContact?, refNumber?, liveryPackageId?, remarks? }` | `LiveryAgreement` | Create. **Side effect**: Updates box status to OCCUPIED and sets currentHorseId. Validates box is AVAILABLE first. |

#### Invoices
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| GET | `/api/invoices` | - | `Invoice[]` | List all |
| POST | `/api/invoices` | `{ customerId, invoiceDate, invoiceRef?, total?, status? }` | `Invoice` | Create |
| GET | `/api/invoices/:id/lines` | - | `InvoiceLine[]` | Lines for invoice |
| POST | `/api/invoice-lines` | `{ invoiceId, description, quantity, unitPrice, total, source?, sourceId?, billingMonth? }` | `InvoiceLine` | Create line |

#### Seed
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| POST | `/api/seed` | - | `{ success: true }` | Clears ALL data, re-seeds demo data |

### Error Responses
All errors return `{ message: string }` with appropriate HTTP status (400 for validation, 500 for server errors).

---

## 6. Business Logic

### Important Algorithms & Rules

#### Livery Agreement Creation
1. Validate request body against `insertLiveryAgreementSchema`
2. Fetch all boxes, find target box by `boxId`
3. If box not found or status !== "AVAILABLE", return 400
4. Create agreement record
5. Update box: set `status = "OCCUPIED"`, `currentHorseId = data.horseId || null`
6. Return created agreement

#### Ghost Agreements
- `horseId` on livery_agreements is nullable
- A "ghost" agreement means a customer reserves a box without assigning a horse
- Ghost agreements appear in billing page but show "Ghost" label instead of horse name
- Horse count in reports filters out null horseIds: `agreements.filter(a => a.horseId).map(a => a.horseId)`

#### Billing Element Creation (UI Logic)
1. User sees table of active livery agreements (filtered by date: `startDate <= today && (endDate >= today || no endDate)`)
2. Filters: Stable dropdown, Horse dropdown (only horses with active agreements)
3. Click "Add" on agreement row -> dialog opens pre-filled with:
   - boxId from agreement
   - horseId from agreement
   - customerId from agreement
4. User selects item/service -> unit and unitPrice auto-fill from item's `baseUnit` and `defaultUnitPrice`
5. Unit price is read-only by default; toggle switch enables editing
6. Line total = unitPrice * quantity (computed in real-time)

#### Billing Element Sorting
Server-side: sorted by `transactionDate` descending, then by `createdAt` descending.

#### Livery Revenue Report
For each month in the date range, for each customer:
1. Find active agreements where `startDate <= monthEnd AND (endDate >= monthStart OR no endDate)`
2. Horse count = unique non-null horseIds from those agreements
3. Livery revenue = sum of monthly prices from attached livery packages
4. Ad-hoc revenue = sum of (unitPrice * quantity) from billing elements where `customerId` matches and `transactionDate` falls within the month
5. Total = livery + ad-hoc
6. Only show rows where horseCount > 0 OR adhocRevenue > 0

#### Box Generation
- Names: `{prefix}{nn}` where nn is zero-padded to 2 digits (01-99)
- Max 100 boxes per generation
- All generated as status "AVAILABLE"

#### Active Agreement Detection (Billing Page)
```
today = new Date()
active = agreements.filter(a => {
  start = new Date(a.startDate)
  end = a.endDate ? new Date(a.endDate) : new Date(9999, 11, 31)
  return start <= today && end >= today
})
```

#### Agreement Status (Agreements List)
```
if (agreementType === "TEMPORARY" && endDate && new Date(endDate) < new Date()) -> "EXPIRED"
else -> "ACTIVE"
```

#### Seed Idempotency
Seed only runs if no horses exist in the database. The `/api/seed` endpoint first calls `clearAll()` which deletes all records from all tables in dependency order (invoice_lines first, then invoices, agreements, billing, packages, boxes, stables, horses, customers, items), then re-seeds.

---

## 7. File Structure

```
/
├── client/
│   ├── index.html                          # HTML entry point, loads Google Fonts
│   └── src/
│       ├── main.tsx                         # React root mount
│       ├── App.tsx                          # Root layout: sidebar + router
│       ├── index.css                        # Tailwind + CSS custom properties (theming)
│       ├── components/
│       │   ├── app-sidebar.tsx              # Navigation sidebar with collapsible sections
│       │   ├── page-header.tsx              # Reusable page title + description + action button
│       │   ├── empty-state.tsx              # Empty state card with icon + message + action
│       │   ├── searchable-select.tsx        # Combobox using cmdk (Popover + Command)
│       │   └── ui/                          # Shadcn UI components (30+ files)
│       │       ├── accordion.tsx
│       │       ├── alert-dialog.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── checkbox.tsx
│       │       ├── collapsible.tsx
│       │       ├── command.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── form.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── popover.tsx
│       │       ├── scroll-area.tsx
│       │       ├── select.tsx
│       │       ├── separator.tsx
│       │       ├── sheet.tsx
│       │       ├── sidebar.tsx
│       │       ├── skeleton.tsx
│       │       ├── slider.tsx
│       │       ├── switch.tsx
│       │       ├── table.tsx
│       │       ├── tabs.tsx
│       │       ├── textarea.tsx
│       │       ├── toast.tsx
│       │       ├── toaster.tsx
│       │       ├── toggle.tsx
│       │       ├── toggle-group.tsx
│       │       └── tooltip.tsx
│       ├── hooks/
│       │   ├── use-toast.ts                 # Toast state management
│       │   └── use-mobile.tsx               # Mobile breakpoint detection
│       ├── lib/
│       │   ├── queryClient.ts               # TanStack Query client + apiRequest helper
│       │   └── utils.ts                     # cn() utility (clsx + tailwind-merge)
│       └── pages/
│           ├── horses.tsx                   # Horse CRUD (table + dialog)
│           ├── customers.tsx                # Customer CRUD (table + dialog)
│           ├── items-services.tsx           # Items read-only (table + filters)
│           ├── facilities.tsx               # Stables CRUD + Boxes view + generate
│           ├── billing-elements.tsx         # Active agreements table -> add billing dialog
│           ├── livery-agreements.tsx         # Agreements list (table + detail dialog)
│           ├── new-livery-agreement.tsx      # Box grid -> create agreement dialog
│           ├── livery-packages.tsx           # Packages CRUD (table + dialog + checkboxes)
│           ├── livery-report.tsx             # Revenue report (filters + KPIs + table)
│           ├── schedule.tsx                  # Placeholder page
│           ├── user-management.tsx           # Placeholder with static data
│           ├── global-settings.tsx           # Reset demo data button + about info
│           └── not-found.tsx                # 404 page
├── server/
│   ├── index.ts                             # Express setup, middleware, server start
│   ├── routes.ts                            # All API route handlers
│   ├── storage.ts                           # IStorage interface + DatabaseStorage class
│   ├── seed.ts                              # Demo data seeding function
│   ├── db.ts                                # PostgreSQL pool + Drizzle instance
│   ├── vite.ts                              # Vite dev middleware setup
│   └── static.ts                            # Production static file serving
├── shared/
│   └── schema.ts                            # Drizzle table definitions + Zod schemas + types
├── script/
│   └── build.ts                             # Production build (Vite client + esbuild server)
├── package.json                             # Dependencies and scripts
├── tsconfig.json                            # TypeScript configuration
├── tailwind.config.ts                       # Tailwind theme configuration
├── postcss.config.js                        # PostCSS with Tailwind + autoprefixer
├── vite.config.ts                           # Vite configuration with aliases
├── drizzle.config.ts                        # Drizzle Kit configuration
├── components.json                          # Shadcn UI configuration
└── replit.md                                # Project documentation
```

---

## 8. Environment Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `SESSION_SECRET` | Available | Express session secret (not actively used in MVP) |

### Setup Instructions
1. Provision a PostgreSQL database
2. Set `DATABASE_URL` environment variable to the connection string
3. Run `npm install` to install dependencies
4. Run `npm run db:push` to create/sync database tables
5. Run `npm run dev` to start in development mode (seeds demo data on first run)

---

## 9. Dependencies

### Production Dependencies
```json
{
  "@hookform/resolvers": "^3.10.0",
  "@radix-ui/react-accordion": "^1.2.4",
  "@radix-ui/react-alert-dialog": "^1.1.7",
  "@radix-ui/react-aspect-ratio": "^1.1.3",
  "@radix-ui/react-avatar": "^1.1.4",
  "@radix-ui/react-checkbox": "^1.1.5",
  "@radix-ui/react-collapsible": "^1.1.4",
  "@radix-ui/react-context-menu": "^2.2.7",
  "@radix-ui/react-dialog": "^1.1.7",
  "@radix-ui/react-dropdown-menu": "^2.1.7",
  "@radix-ui/react-hover-card": "^1.1.7",
  "@radix-ui/react-label": "^2.1.3",
  "@radix-ui/react-menubar": "^1.1.7",
  "@radix-ui/react-navigation-menu": "^1.2.6",
  "@radix-ui/react-popover": "^1.1.7",
  "@radix-ui/react-progress": "^1.1.3",
  "@radix-ui/react-radio-group": "^1.2.4",
  "@radix-ui/react-scroll-area": "^1.2.4",
  "@radix-ui/react-select": "^2.1.7",
  "@radix-ui/react-separator": "^1.1.3",
  "@radix-ui/react-slider": "^1.2.4",
  "@radix-ui/react-slot": "^1.2.0",
  "@radix-ui/react-switch": "^1.1.4",
  "@radix-ui/react-tabs": "^1.1.4",
  "@radix-ui/react-toast": "^1.2.7",
  "@radix-ui/react-toggle": "^1.1.3",
  "@radix-ui/react-toggle-group": "^1.1.3",
  "@radix-ui/react-tooltip": "^1.2.0",
  "@tanstack/react-query": "^5.60.5",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "connect-pg-simple": "^10.0.0",
  "date-fns": "^3.6.0",
  "drizzle-orm": "^0.39.3",
  "drizzle-zod": "^0.7.0",
  "embla-carousel-react": "^8.6.0",
  "express": "^5.0.1",
  "express-session": "^1.18.1",
  "framer-motion": "^11.13.1",
  "input-otp": "^1.4.2",
  "lucide-react": "^0.453.0",
  "memorystore": "^1.6.7",
  "next-themes": "^0.4.6",
  "passport": "^0.7.0",
  "passport-local": "^1.0.0",
  "pg": "^8.16.3",
  "react": "^18.3.1",
  "react-day-picker": "^8.10.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.55.0",
  "react-icons": "^5.4.0",
  "react-resizable-panels": "^2.1.7",
  "recharts": "^2.15.2",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7",
  "tw-animate-css": "^1.2.5",
  "vaul": "^1.1.2",
  "wouter": "^3.3.5",
  "ws": "^8.18.0",
  "zod": "^3.24.2",
  "zod-validation-error": "^3.4.0"
}
```

### Dev Dependencies
```json
{
  "@replit/vite-plugin-cartographer": "^0.4.4",
  "@replit/vite-plugin-dev-banner": "^0.1.1",
  "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
  "@tailwindcss/typography": "^0.5.15",
  "@tailwindcss/vite": "^4.1.18",
  "@types/connect-pg-simple": "^7.0.3",
  "@types/express": "^5.0.0",
  "@types/express-session": "^1.18.0",
  "@types/node": "20.19.27",
  "@types/passport": "^1.0.16",
  "@types/passport-local": "^1.0.38",
  "@types/react": "^18.3.11",
  "@types/react-dom": "^18.3.1",
  "@types/ws": "^8.5.13",
  "@vitejs/plugin-react": "^4.7.0",
  "autoprefixer": "^10.4.20",
  "drizzle-kit": "^0.31.8",
  "esbuild": "^0.25.0",
  "postcss": "^8.4.47",
  "tailwindcss": "^3.4.17",
  "tsx": "^4.20.5",
  "typescript": "5.6.3",
  "vite": "^7.3.0"
}
```

### Optional Dependencies
```json
{
  "bufferutil": "^4.0.8"
}
```

### Overrides
```json
{
  "drizzle-kit": {
    "@esbuild-kit/esm-loader": "npm:tsx@^4.20.4"
  }
}
```

---

## 10. UI Specification

### Theme
- **Primary color**: HSL 142 76% 36% (forest green)
- **Font**: Open Sans (sans-serif), Georgia (serif), Menlo (mono)
- **Border radius**: 0.5rem base
- **Dark mode**: CSS class-based (`.dark`), full dark palette defined but no toggle UI in MVP
- **Shadows**: All set to transparent (flat design)
- **Elevation system**: CSS utility classes (hover-elevate, toggle-elevate) for interactive brightness

### Layout
- **Shell**: Full-height flex layout. Sidebar on left (16rem wide), main content on right.
- **Header**: Sticky top bar with sidebar toggle button.
- **Content area**: Scrollable, padded (1.5rem), max-width 1200px centered.
- **Sidebar**: Shadcn Sidebar component with:
  - Header: App logo (green rounded square with Fence icon) + "StableMaster" title
  - Management section: Collapsible groups (Activities, Livery Agreements, Horses, Customers, Stables & Boxes, Items & Services, Reports)
  - Administration section: Flat links (User Management, Global Settings)
  - Active route highlighting via `isActive` prop

### Pages Detail

#### Horses (`/horses`)
- PageHeader: "Horses" + "Add Horse" button
- Table: Name, Status (badge), DOB, Color, Sex, Group, Remarks, Edit button
- Dialog (Add/Edit): Name*, DOB, Status (ACTIVE/INACTIVE select), Color, Sex (5-option select), Group, Remarks textarea

#### Customers (`/customers`)
- PageHeader: "Customers" + "Add Customer" button
- Table: Name, Email, Phone, Status (badge), Remarks, Edit button
- Dialog (Add/Edit): Name*, Email, Phone, Status select, Remarks textarea

#### Items & Services (`/items`)
- PageHeader: "Items & Services" (no action button)
- Filter bar (Card): Search input, Category select (All/Service/Item), Active-only switch
- Table: NetSuite ID, Description, Category (badge), Base Unit, Default Price (right-aligned), Active (badge)

#### Stables & Boxes (`/facilities`)
- PageHeader: "Stables & Boxes" + "Add Stable" button
- Stables table: Stable Name, Notes, Box count, Active (badge), Edit button
- Boxes section (Card): Title "Boxes" + "Generate Boxes" button (visible when stable selected)
  - Filter bar: Stable (searchable select), Type (All/Stall/Storage/Tacking Room), Status (All/Available/Occupied/Maintenance)
  - Boxes table: Stable, Box, Type (badge), Status (badge colored: green=available, gray=occupied, red=maintenance), Current Horse
- Stable dialog: Name*, Notes textarea, Active switch
- Generate dialog: Prefix input, Count number input (1-100), Box Type select

#### Post Billing Element (`/activities/billing`)
- PageHeader: "Post Customer Billing Element"
- Filter bar: Stable (searchable), Horse (searchable, only horses with active agreements)
- Active agreements table: Stable, Box, Horse (or "Ghost" italic), Customer, Agreement type (badge), Billing Entries count (badge), Add button
- Recent Billing Entries section (below, if any exist): Date, Ref#, Customer, Horse, Box (Stable/Box), Item, Qty, Unit, Unit Price, Total, Billed (badge)
- Add dialog: Pre-filled context banner (Stable/Box, Horse, Customer), Transaction Date*, Ref Number, Item/Service* (searchable select), Remarks textarea, Unit*, Unit Price (read-only by default, toggle to edit), Quantity*, Line Total display

#### Livery Agreements List (`/livery/agreements`)
- PageHeader: "Livery Agreements"
- Table (clickable rows with hover effect): Ref#, Customer, Horse (or "Ghost"), Box (Stable/Box format), Type (badge: Permanent/Temporary), Start, End, Package, Status (badge)
- Detail dialog: 2-column grid with all agreement fields

#### New Livery Agreement (`/livery/new`)
- PageHeader: "New Livery Agreement"
- Filter bar: Stable (searchable), Available-only switch (default on)
- Box grid table (STALL type only): Stable, Box, Type (badge), Status (badge), Current Horse, Create button (only for AVAILABLE)
- Create dialog: Box context banner, Agreement Type select (Permanent Auto Renew / Temporary), Start Date*, End Date* (only for Temporary), Horse (searchable, optional - "None (Ghost Agreement)"), Customer* (searchable, active only), Customer Contact, Ref Number, Livery Package (searchable, shows price), Covered Items badges (when package selected), Remarks textarea

#### Livery Packages (`/livery/packages`)
- PageHeader: "Livery Packages" + "Add Package" button
- Table: Name, Monthly Price (right-aligned), Covered Items count (badge), Edit button
- Dialog: Name*, Monthly Price number input, Covered Items checkboxes (scrollable list of active items with category badges)

#### Livery Report (`/reports/livery`)
- PageHeader: "Livery Report"
- Filter bar: Start Date, End Date, Customer (searchable)
- KPI cards (4-column grid): Total Horses, Livery Revenue, Ad-hoc Revenue, Total Revenue
- Report table: Month, Customer, Horses count, Livery Revenue, Ad-hoc Revenue, Total Revenue

#### Schedule (`/activities/schedule`) - Placeholder
- "Coming Soon" message with Clock icon

#### User Management (`/admin/users`) - Placeholder
- Static table with 3 hardcoded users (Admin, Manager, Staff)

#### Global Settings (`/admin/settings`)
- Demo Data card: Description + "Reset Demo Data" button with spinner
- About card: App name, version, tech stack

### Component Patterns
- **Loading**: Skeleton components (3 rows) inside Card
- **Empty**: EmptyState component with icon, title, description, optional action button
- **Toasts**: Bottom-right toast notifications for success/error on all mutations
- **Badges**: Status indicators use variant="default" (green) for active, variant="secondary" (gray) for inactive, variant="destructive" (red) for expired/maintenance
- **Data test IDs**: All interactive and display elements have `data-testid` attributes

---

## 11. Deployment

### Build Process
1. `npm run build` executes `script/build.ts`:
   - Vite builds the React client to `dist/public/`
   - esbuild bundles the server to `dist/index.cjs` (CJS format, minified)
   - Server deps in allowlist are bundled; others are external
2. Production start: `npm run start` runs `NODE_ENV=production node dist/index.cjs`

### Hosting Requirements
- Node.js runtime
- PostgreSQL database
- Single port (configured via `$PORT`, default 5000)
- The server serves both API and static frontend files

### Ports
- Single port: `$PORT` or 5000
- In development: Vite HMR uses WebSocket on `/vite-hmr` path (same port)

### Environment Setup
1. Set `DATABASE_URL` pointing to PostgreSQL
2. Set `PORT` if not 5000
3. Set `NODE_ENV=production` for production
4. Run `npm run build`
5. Run `npm run start`

---

## 12. Step-by-Step Rebuild Instructions

### Phase 1: Project Scaffolding
1. Create a new Node.js project with `package.json` (type: "module")
2. Install all dependencies listed in Section 9
3. Create `tsconfig.json` with paths aliases: `@/*` -> `./client/src/*`, `@shared/*` -> `./shared/*`
4. Create `vite.config.ts` with React plugin, path aliases (@, @shared, @assets), root=client, build output=dist/public
5. Create `tailwind.config.ts` with darkMode: ["class"], content paths, full color theme from CSS variables, custom font families, accordion animations
6. Create `postcss.config.js` with tailwindcss + autoprefixer
7. Create `drizzle.config.ts` pointing to shared/schema.ts, PostgreSQL dialect
8. Create `components.json` for Shadcn UI (new-york style, aliases configured)
9. Create `client/index.html` with Google Fonts link (Open Sans + many others), root div, module script to main.tsx
10. Create `script/build.ts` with Vite client build + esbuild server bundle

### Phase 2: Shared Schema
1. Create `shared/schema.ts` with all 9 table definitions (stables, boxes, horses, customers, itemServices, billingElements, liveryPackages, liveryAgreements, invoices, invoiceLines)
2. Add insert schemas using `createInsertSchema().omit({ id: true })` (also omit createdAt where applicable)
3. Export all select and insert types
4. Run `npm run db:push` to create tables

### Phase 3: Backend
1. Create `server/db.ts` - Pool from DATABASE_URL, Drizzle instance with schema
2. Create `server/storage.ts` - IStorage interface with all CRUD methods, DatabaseStorage class implementing them. All create methods generate UUID via `randomUUID()`. Include `generateBoxes` with zero-padded naming. Include `clearAll` with correct deletion order.
3. Create `server/seed.ts` - Idempotent seed function that checks for existing horses before inserting. Creates 4 horses, 3 customers, 6 items, 2 stables, generates boxes (A01-A10, B01-B08, BS01-BS02 for Main Stable; C01-C04, T01 for Outdoor Barn), 2 livery packages with comma-separated covered item IDs.
4. Create `server/routes.ts` - All API routes. Thin controllers that validate with Zod and delegate to storage. Livery agreement POST has box availability check + box status update side effect. Billing elements GET sorts server-side. Seed endpoint clears all then re-seeds.
5. Create `server/index.ts` - Express with JSON body parser (rawBody capture), URL-encoded parser, request logging middleware for /api/ paths, error handler, Vite (dev) or static (prod) serving, listen on PORT.
6. Create `server/vite.ts` - Vite dev server in middleware mode with HMR on /vite-hmr path.
7. Create `server/static.ts` - Serve dist/public with SPA fallback.

### Phase 4: Frontend Foundation
1. Create `client/src/index.css` with full CSS custom property definitions for light and dark modes, Tailwind directives, elevation utility system
2. Create `client/src/lib/utils.ts` - cn() helper
3. Create `client/src/lib/queryClient.ts` - QueryClient with default query function (fetches from queryKey URL), apiRequest helper, staleTime: Infinity, no retry
4. Create `client/src/main.tsx` - Mount App to #root
5. Install/generate all Shadcn UI components into `client/src/components/ui/`
6. Create `client/src/hooks/use-toast.ts` - Toast state management
7. Create `client/src/hooks/use-mobile.tsx` - Mobile breakpoint hook

### Phase 5: Custom Components
1. Create `client/src/components/page-header.tsx` - Title, description, optional action button with Plus icon
2. Create `client/src/components/empty-state.tsx` - Centered card with icon, title, description, optional action
3. Create `client/src/components/searchable-select.tsx` - Popover + Command (cmdk) combobox with search, check marks

### Phase 6: Sidebar & App Shell
1. Create `client/src/components/app-sidebar.tsx` - Sidebar with logo, Management section (7 collapsible groups with sub-items), Administration section (2 flat links). Use wouter's useLocation for active state.
2. Create `client/src/App.tsx` - QueryClientProvider, TooltipProvider, SidebarProvider (16rem width), flex layout with sidebar + main area, sticky header with SidebarTrigger, padded scrollable content area, Router with all routes, Toaster.

### Phase 7: Pages (build in this order)
1. **Horses** - Table + Add/Edit dialog. Fields: name*, dob, color, sex, group, status, remarks.
2. **Customers** - Table + Add/Edit dialog. Fields: name*, email, phone, status, remarks.
3. **Items & Services** - Read-only table with search, category filter, active-only switch.
4. **Facilities (Stables & Boxes)** - Stables table with Add/Edit, Boxes table with filters (stable, type, status), Generate Boxes dialog.
5. **Livery Packages** - Table + Add/Edit dialog with item checkboxes.
6. **New Livery Agreement** - Box grid with stable filter + available-only switch, Create dialog with all agreement fields.
7. **Livery Agreements List** - Read-only table with clickable rows, Detail dialog.
8. **Billing Elements** - Active agreements table with filters, Add billing dialog pre-filled from agreement context, Recent entries section.
9. **Livery Report** - Date range + customer filter, 4 KPI cards, monthly revenue table.
10. **Schedule** - Placeholder page.
11. **User Management** - Placeholder with static data.
12. **Global Settings** - Reset demo data button + about info.
13. **Not Found** - 404 page.

### Phase 8: Testing & Verification
1. Start the application (`npm run dev`)
2. Verify seed data appears on first load
3. Test CRUD on horses, customers, stables, packages
4. Test box generation
5. Test livery agreement creation (verify box becomes OCCUPIED)
6. Test billing element creation from agreement context
7. Test livery report with date ranges
8. Test demo data reset from Global Settings
9. Verify all data-testid attributes are present

---

*This specification was generated from the live StableMaster codebase. All file contents, schema definitions, and business logic have been directly extracted from the source code.*
