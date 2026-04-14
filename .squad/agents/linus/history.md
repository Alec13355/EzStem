# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-04-14: P0 Backend APIs Implemented

**What was built:**
- Complete API layer for EzStem florist application
- 6 service implementations (Item, Vendor, Recipe, Pricing, Event, Order)
- All P0 endpoints with full CRUD operations
- Comprehensive test suite with 9 passing tests

**Key architectural decisions:**
- Soft delete pattern: All domain entities use `IsDeleted` + `DeletedAt` with EF query filters
- Decimal precision: All monetary/quantity fields use `decimal(18,4)` for accurate florist calculations
- Bundle rounding: Order generation rounds stem quantities up to nearest bundle size (critical for vendor ordering)
- Cost snapshots: RecipeItems snapshot Item.CostPerStem at time of adding (prevents pricing drift)
- Vendor grouping: Orders automatically group line items by vendor for efficient purchasing

**Service layer patterns established:**
- All services follow async/await with CancellationToken support
- Validation throws ArgumentException with clear messages (caught in controllers → BadRequest)
- Soft deletes set flags, never physically remove records
- DTOs separate API contract from domain entities
- Pagination uses PagedResponse<T> wrapper with total count

**Domain constraints respected (from Saul):**
- Bundle rounding algorithm: `bundlesNeeded = ceil(quantityNeeded / bundleSize)`, `quantityOrdered = bundlesNeeded * bundleSize`
- 3x markup as default pricing factor (configurable via PricingConfig entity)
- Recipe scaling: pure calculation, never saves scaled values (client decides whether to apply)
- Margin warning: flags recipes with <25% margin as underpriced

**Tests verify:**
- Soft delete filtering in queries
- Bundle size rounding (47 roses with bundle 25 → 2 bundles = 50 ordered)
- Vendor grouping in orders
- Recipe cost calculations (items + labor)
- Input validation (name required, cost > 0)

### 2026-04-14: P1 Backend Features Implemented

**What was built:**
- EF Core migrations (InitialCreate + 2 schema updates) — enables Azure SQL deployment
- Seasonal item tracking: IsSeasonalItem, SeasonalStartMonth/EndMonth, LeadTimeDays fields on Item entity
- GetSeasonalWarningsAsync service method for event planning (warns about out-of-season items and lead time violations)
- Waste calculation engine: tracks actual stem usage vs ordered quantities with Low/Medium/High categories
- CSV export for orders: vendor-grouped purchase orders with bundle details and totals
- 3 new API endpoints: POST /api/orders/{id}/waste, GET /api/orders/{id}/waste, GET /api/orders/{id}/export/csv
- Comprehensive test suite: 9 new tests (WasteServiceTests + OrderExportTests), total 18 tests passing

**Migration strategy:**
- Created initial migration (InitialCreate) capturing full schema with proper decimal(18,4) precision and indexes
- Separate migrations for semantic changes: AddSeasonalItemFields, AddWasteCalculationFields
- Migrations ready for `dotnet ef database update` on Azure SQL

**Seasonal item logic:**
- Supports cross-year ranges (e.g., December-February for winter items)
- Lead time warnings calculated as days from current date to event date
- Returns structured warnings (ItemId, ItemName, WarningType, Message) for UI consumption

**Waste calculation:**
- Percentage-based: (stemsOrdered - stemsUsed) / stemsOrdered * 100
- Category thresholds: Low (<10%), Medium (10-20%), High (>20%)
- Stored on Order entity with calculation timestamp for audit trail
- Matches Tess's UX color coding requirements

**CSV export format:**
- Vendor-grouped, alphabetically sorted
- Columns: Vendor, Item, BundleSize, BundlesOrdered, TotalStems, UnitCost, TotalCost
- TOTAL row with grand total
- Decimal formatting: $0.00 for consistent florist readability

**Tests added:**
- Waste calculation: correct percentage, Low/Medium/High categories, boundary cases (10%, 20%)
- CSV export: headers present, vendor grouping, totals accuracy, decimal formatting
- All 18 tests pass (9 P0 + 9 P1)

### P1 Session Summary (2026-04-14)

**Interfaces changed:** `IOrderService` — added `CalculateWasteAsync(orderId, actualStemsUsed)`, `GetWasteAsync(orderId)`, `ExportOrderCsvAsync(orderId)`.

**Architecture notes:**
- Seasonal month logic: cross-year ranges handled with `start > end` → OR condition (`month >= start || month <= end`)
- Waste stored directly on Order entity (no separate table) — nullable WastePercentage + WasteCalculationDate audit field
- CSV generation uses StringBuilder; line items sorted by `Vendor?.Name ?? "No Vendor"` alphabetically
- Lead time warning logic: warn when `daysUntilEvent <= item.LeadTimeDays && daysUntilEvent >= 0`

**Tech review outcome:** 18/18 tests pass. Danny flagged LeadTimeDays nullability (low risk, acceptable for MVP) and missing actualStemsUsed guard (fixed by coordinator).

### 2026-04-14: Background Migration Service to Fix Azure 503 Health Checks

**Problem:** Azure App Service smoke tests consistently returned HTTP 503 after deployment. The `/health` endpoint is trivial (always returns 200 OK), so 503 meant the app process hadn't started accepting requests yet.

**Root cause:** In `Program.cs` (lines 38-43), EF Core migrations ran synchronously *before* `app.Run()`:
```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();
    db.Database.Migrate();  // BLOCKING - runs before app accepts requests
}
```

On Azure App Service, the connection string comes from Key Vault via `@Microsoft.KeyVault(...)` reference. If Key Vault resolution or migration execution took >45 seconds, the smoke test fired before ASP.NET had called `app.Run()`, resulting in 503.

**Solution:** Moved migrations to background hosted service (`DatabaseMigrationService`):
- Implements `IHostedService` with async `MigrateAsync()` in `StartAsync()`
- Registered via `builder.Services.AddHostedService<DatabaseMigrationService>()`
- Removed synchronous migration block from `Program.cs`
- `app.Run()` now called immediately, health endpoint returns 200 while migrations run in background
- Added try/catch with logging: migration failures logged but don't crash app (allows health checks to work)

**Files changed:**
- Created: `backend/src/EzStem.API/Infrastructure/DatabaseMigrationService.cs`
- Modified: `backend/src/EzStem.API/Program.cs` (added using, registered hosted service, removed blocking migration)

**Tests:** All 18 backend tests pass. Build succeeds with 0 warnings/errors (2.3s).

**Impact:** Azure App Service smoke tests will now succeed immediately after deployment. Migrations run asynchronously without blocking HTTP request handling.

