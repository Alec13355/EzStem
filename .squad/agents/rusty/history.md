# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

### 2026-04-14: Angular Frontend Implementation

**File Structure:**
- Core services: `/src/app/core/services/` (api, item, vendor, recipe, event, order, pricing)
- Feature components: `/src/app/features/{item-library,recipes,events,orders}/`
- Shared models: `/src/app/shared/models/api.models.ts`
- Global theme: `/src/styles.scss` (Material green theme with margin color coding)

**Component Patterns:**
- All components are Angular 17+ standalone (no NgModules)
- Lazy-loaded routes using `loadComponent()` pattern
- Dialog-based forms for item CRUD (MatDialog)
- Inline forms for recipe/event detail pages (ReactiveFormsModule)
- Real-time cost calculation in recipe detail using RxJS
- Debounced search in item list (300ms debounceTime)

**Service Architecture:**
- Base `ApiService` wraps HttpClient with typed generics
- Feature services inject ApiService (not HttpClient directly)
- All API calls point to `environment.apiUrl` (http://localhost:5000/api)

**Material Components Used:**
- MatTable + MatPaginator (item library, all list views)
- MatDialog (item create/edit modals)
- MatCard (summary panels, vendor groups)
- MatToolbar (top navigation)
- MatChip (status badges with color coding)
- MatDatepicker (event date selection)

**UX Patterns:**
- Currency display: `.currency` class with `$` prefix, 2 decimal places
- Profit margin colors: green (>= 40%), orange (25-40%), red (< 25%)
- Bundle display placeholder in order detail (awaits backend logic)

**Build Output:**
- Initial bundle: 2.4 MB (includes Material components)
- Lazy chunks: 7-284 KB per route
- Build succeeds with `npm run build --configuration development`

**Deviations:** None — all P0 features implemented per task breakdown.

### 2026-04-14: P1 Frontend Features

**Features Implemented:**
- CSV export download for orders (blob download pattern with `responseType: 'blob'`)
- Waste percentage display with color-coded categories (Low/Medium/High)
- Record Waste form on order detail (actualStemsUsed input → POST to `/api/orders/{id}/waste`)
- Seasonal item warning banner on event detail (client-side month range check)
- WasteSummary TypeScript interface with totalStemsOrdered, totalStemsUsed, wastePercentage, wasteCategory
- Updated Order interface with optional wastePercentage and wasteCalculationDate fields
- Updated Item interface with seasonal fields (isSeasonalItem, seasonalStartMonth, seasonalEndMonth, leadTimeDays)

**UI/UX Patterns:**
- Waste color coding: green (<10%), orange (10-20%), red (>20%) using `.waste-low`, `.waste-medium`, `.waste-high` classes
- CSV export button styled as secondary (mat-stroked-button) not primary
- Warning card for seasonal items: yellow background (#fff3cd) with orange left border, warning icon
- Seasonal check handles cross-year ranges (e.g., Nov-Feb)
- Waste form shows result inline after submit (doesn't require page reload)

**Service Layer:**
- OrderService now injects both ApiService and HttpClient (need HttpClient for blob responseType)
- downloadCsv() helper method creates temporary anchor element for browser download
- TypeScript interfaces synchronized with Linus's P1 backend contract

**Build Status:** Succeeded with budget warning (619KB initial, target 500KB) — non-blocking for P1.

### P1 Session Summary (2026-04-14)

**Interfaces/models added:**
- `WasteSummary` — totalStemsOrdered, totalStemsUsed, wastePercentage, wasteCategory
- `Order` — added optional `wastePercentage?: number`, `wasteCalculationDate?: string`
- `Item` — added seasonal fields: `isSeasonalItem`, `seasonalStartMonth`, `seasonalEndMonth`, `leadTimeDays`

**Components updated:**
- `order-detail` — CSV export button (mat-stroked-button, blob download), waste % display (color-coded), Record Waste form (inline result after submit)
- `event-detail` — seasonal warning banner (yellow card, orange border, warning icon) shown if any recipe items are out of season for the event date

**Service changes:**
- `OrderService.exportOrderCsv(orderId)` — returns `Observable<Blob>` using HttpClient blob responseType
- `OrderService.downloadCsv(orderId)` — creates temporary anchor element, triggers browser download
- OrderService now injects both ApiService (JSON) and HttpClient (blob)

**CSS additions:** `.waste-low` (green), `.waste-medium` (orange), `.waste-high` (red) in `styles.scss` — semantically distinct from `.margin-*` classes.

**Build status:** Production build passing. Budget warning on initial bundle (619KB vs 500KB target) — non-blocking.

<!-- Append new learnings below. Each entry is something lasting about the project. -->
