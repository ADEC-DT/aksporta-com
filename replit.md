# Multi-API Data Integration Portal

## Overview

This is an enterprise dashboard application for integrating and displaying data from multiple API sources: NetSuite (financial data), HR (employee management), and Livery (delivery tracking). The application provides a unified interface for viewing metrics, transactions, charts, and status information across these three data domains.

The portal follows modern enterprise dashboard patterns inspired by Linear, Retool, and Fluent Design, prioritizing data density, efficient navigation, and clear information hierarchy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for data visualization (bar, line, pie charts)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains database tables and TypeScript types
- **Validation**: Zod schemas generated from Drizzle tables via drizzle-zod
- **Current Storage**: In-memory storage (`MemStorage` class) for development; database ready via Drizzle config

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

### Key Design Decisions
1. **Monorepo Structure**: Client and server share types through `shared/` directory, enabling type safety across the stack
2. **Component-Based Dashboard**: Reusable components (MetricCard, DataTable, DashboardChart) for consistent UI patterns
3. **Mock Data Generation**: Server generates realistic mock data for all three APIs until real integrations are implemented
4. **Theme System**: CSS custom properties enable seamless light/dark mode switching
5. **Collapsible Sidebar**: Fixed-width sidebar navigation with responsive behavior for mobile

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

### Session Management (configured but not fully implemented)
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware