# Design Guidelines: Multi-API Data Integration Portal

## Design Approach
**System-Based Approach** using modern enterprise dashboard patterns inspired by Linear, Retool, and Fluent Design. This utility-focused application prioritizes data density, efficient navigation, and clarity for information-heavy content.

## Typography
- **Headings**: Inter (600-700 weight) for dashboard titles and section headers
- **Body/Data**: Inter (400-500 weight) for tables, metrics, and content
- **Monospace**: JetBrains Mono for API keys, IDs, technical data
- **Scale**: text-xs for metadata, text-sm for tables, text-base for content, text-lg/xl for headers, text-2xl/3xl for page titles

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Gaps: gap-4, gap-6, gap-8
- Container padding: px-6 md:px-8 lg:px-12

**Grid Structure**:
- Sidebar navigation: w-64 (fixed width, collapsible on mobile)
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Core Components

**Navigation Sidebar**:
- Fixed left sidebar with logo at top
- Tab navigation for NetSuite, HR, Livery with icons
- Active state indication with subtle accent
- Collapsed state on mobile (hamburger menu)
- User profile section at bottom

**Dashboard Layout**:
- Page header with title, breadcrumbs, and action buttons
- Metric cards in grid (3-4 across on desktop)
- Data tables with sortable columns, search, filters
- Chart containers with proper legends and labels
- Refresh timestamps and sync status indicators

**Data Display Components**:
- **Metric Cards**: Large number with label, trend indicator, comparison value
- **Tables**: Zebra striping, hover states, sticky headers, pagination
- **Charts**: Bar, line, pie charts using a charting library (Chart.js/Recharts)
- **Status Badges**: Pill-shaped with icons for API connection status
- **Empty States**: Centered icon + message when no data

**Forms & Inputs**:
- Labeled inputs with helper text
- Search bars with icon prefix
- Date range pickers for filtering
- Dropdown selects for data sources

**Buttons**:
- Primary: Solid fill for main actions (sync, refresh)
- Secondary: Outlined for secondary actions
- Ghost: Text-only for tertiary actions
- Icon buttons: Square with padding for actions

## Dashboard-Specific Patterns

**Each Tab View** (NetSuite, HR, Livery):
- Summary metrics row at top (4 cards)
- Filter/search bar below metrics
- Main data table or visualization
- Last sync timestamp with manual refresh button
- API connection status indicator

**Data Visualization**:
- Use consistent chart heights (h-64 to h-80)
- Tooltips on hover for detailed values
- Legends positioned top-right or bottom
- Loading skeletons during API calls

## Animations
Minimal and purposeful only:
- Fade-in for data loading (opacity transition)
- Smooth sidebar collapse/expand
- Table row hover lift (subtle)

## Accessibility
- Proper heading hierarchy (h1 → h6)
- ARIA labels for icon-only buttons
- Keyboard navigation for tabs and tables
- High contrast text on all backgrounds
- Focus indicators on interactive elements

## Images
No hero images. This is a data-focused application. Use only:
- Icons for navigation items (use Heroicons)
- Icons in metric cards and empty states
- Company/app logos in sidebar (small, 32x32px)
- Visual indicators for status/health

## Responsive Behavior
- **Mobile**: Collapsed sidebar, single-column cards, horizontal scroll for tables
- **Tablet**: 2-column card grid, visible sidebar
- **Desktop**: 3-4 column grid, full layout with sidebar