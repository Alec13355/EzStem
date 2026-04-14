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

<!-- Append new learnings below. Each entry is something lasting about the project. -->
