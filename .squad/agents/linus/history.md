# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-04-15: Item Image Upload Endpoint

**What was built:**
- `POST /api/items/upload-image` — multipart/form-data, field name `file`, returns `{ url: string }`
- `IImageStorageService` interface in `EzStem.Application/Interfaces/`
- `AzureImageStorageService` in `EzStem.Infrastructure/Services/` — wraps `Azure.Storage.Blobs` SDK
- `UploadImageResponse(string Url)` DTO added to `ItemDtos.cs`
- `IImageStorageService` injected into `ItemsController` constructor
- `AzureBlobStorage:ConnectionString` config key added to `appsettings.json` with `"UseDevelopmentStorage=true"` for local dev (Azurite)
- 5 new tests in `ImageUploadTests.cs` — all using fakes (no real Blob Storage needed)
- `Azure.Storage.Blobs 12.27.0` package added to `EzStem.Infrastructure.csproj`

**Key decisions:**
- Blob name format: `{Guid}/{originalFileName}` — collision-safe, original extension preserved
- Container `item-images` created with `PublicAccessType.Blob` on first upload (no manual setup needed)
- `[RequestSizeLimit(5 * 1024 * 1024)]` attribute + explicit length check (belt-and-suspenders; `RequestSizeLimit` alone doesn't return a clean 400)
- Production connection string goes into Key Vault (same pattern as `DefaultConnection`) — never in config files
- Tests use hand-rolled fakes (no Moq) — consistent with existing test patterns in this project

**Test coverage (5 new tests, 37 total passing):**
- Null/empty file → 400
- Invalid content type (image/gif) → 400
- Oversized file (6MB) → 400
- Valid JPEG → 200 with `UploadImageResponse`, service was called
- Valid PNG → 200

### 2026-04-15: Flex Mode — Direct Stem Items on Events

**What was built:**
- `FlexItem` domain entity: belongs to a `FloristEvent`, references an `Item`, carries `QuantityNeeded` + optional `Notes`
- `IFlexItemService` + `FlexItemService`: full CRUD — GetFlexItemsAsync, AddFlexItemAsync, UpdateFlexItemAsync, DeleteFlexItemAsync
- `FlexItemsController`: nested route `/api/events/{eventId}/flex-items` with GET / POST / PUT / DELETE
- EF migration `AddFlexItems` — table with `EventId` index, `QuantityNeeded` precision (18,4)
- Extended `OrderService.GenerateOrderAsync` to merge flex items into the item aggregation pass before order line item creation
- Decision doc written to `.squad/decisions/inbox/linus-flex-mode.md` for Rusty

**Key decisions:**
- FlexItems are **physically deleted** (no soft-delete): they're transient planning additions, not auditable history
- `LineTotalCost` is a live calculation (`QuantityNeeded * Item.CostPerStem`) — not stored, computed on read
- Flex items merge with recipe-derived quantities during order generation (shared `itemId` → summed, bundle-rounded once)
- `UpdateFlexItemRequest` uses nullable fields — pass `null` to leave a field unchanged; explicit `""` or `0` would overwrite

**Test coverage (6 new tests, 32 total passing):**
- AddFlexItem returns correct FlexItemResponse
- GetFlexItems returns all items for event
- Delete returns false for non-existent item
- LineTotalCost calculated correctly (QuantityNeeded × CostPerStem)
- Delete existing item removes and returns true
- Update persists new quantity + notes, recalculates LineTotalCost

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

### 2026-04-14: Removed Microsoft.AspNetCore.OpenApi to Fix ReflectionTypeLoadException

**Problem:** Application threw `System.Reflection.ReflectionTypeLoadException` on startup:
```
Could not load type 'Microsoft.OpenApi.Any.IOpenApiAny' from assembly 'Microsoft.OpenApi, Version=2.4.1.0, Culture=neutral, PublicKeyToken=3f5743946376f042'.
```

**Root cause:** `Microsoft.AspNetCore.OpenApi` v9.0.14 was referenced in `EzStem.API.csproj` but never used in `Program.cs`. This package pulled in `Microsoft.OpenApi` 2.x, which removed the `IOpenApiAny` interface. However, `Swashbuckle.AspNetCore` v10.1.7 (the actual Swagger implementation in use) depends on `IOpenApiAny` from `Microsoft.OpenApi` 1.x, causing a type load conflict at runtime.

**Solution:** Removed the unused `Microsoft.AspNetCore.OpenApi` package reference from `EzStem.API.csproj`. The application only uses Swashbuckle for Swagger UI (`AddSwaggerGen()`, `UseSwagger()`, `UseSwaggerUI()` in `Program.cs`).

**Verification:** `dotnet restore` and `dotnet build` both succeeded with no warnings or errors (build completed in 3.7s). All 18 backend tests pass.

**Key learning:** This project uses **Swashbuckle.AspNetCore** for OpenAPI/Swagger support, not `Microsoft.AspNetCore.OpenApi`. The Microsoft package is unnecessary and conflicts with Swashbuckle's dependencies.

### 2026-04-14: Added Waste Fields to OrderResponse DTO

**What changed:**
- Added `WastePercentage` (decimal?) and `WasteCalculationDate` (DateTime?) parameters to `OrderResponse` record in `OrderDtos.cs`
- Updated `MapToOrderResponse` method in `OrderService.cs` to map these fields from the `Order` entity
- Frontend component `order-detail` was displaying waste fields that weren't present in the DTO — now aligned

**Key details:**
- Fields are nullable to support orders that don't have waste data calculated yet
- `Order` entity already had these fields from P1 waste calculation feature (lines 186-188 in OrderService.cs)
- Fields populate when waste is calculated via POST `/api/orders/{id}/waste` endpoint

**Files changed:**
- `backend/src/EzStem.Application/DTOs/OrderDtos.cs` — Added 2 parameters to OrderResponse record
- `backend/src/EzStem.Infrastructure/Services/OrderService.cs` — Updated MapToOrderResponse method (lines 155-165)

**Verification:** Build succeeded with 0 warnings/errors (1.32s). All existing API endpoints now return waste data when available.

### 2026-04-15: Fixed Rejected Pricing Feature (HTTP Method Bug + UX Issues)

**Context:** Danny (Tech Lead) and Tess (UX Designer) rejected the Pricing Config UI. Rusty (original author) was locked out. Fixed 3 critical issues.

**Fix 1 — HTTP Method Mismatch (Danny's rejection):**
- **Problem:** `frontend/src/app/core/services/pricing.service.ts` called `api.put(...)` for config updates
- **Root cause:** Backend `PricingController.cs` line 27 has `[HttpPost]` attribute — expects POST, not PUT
- **Solution:** Changed `this.api.put` → `this.api.post` in `updatePricingConfig()` method
- **Impact:** Config updates now use correct HTTP method, matching backend contract

**Fix 2 — UX Issues (Tess's rejection):**
- **A. Added context explanation card:** Inserted `mat-card` with class `info-card` above the form. Content: "💡 These are your default values for new recipes. You can override them per-recipe when needed." Styled with light blue background (#e3f2fd) and left border (#1976d2).
- **B. Fixed red color on settings page:** Changed low margin preview from alarming red (#c62828, #ffebee bg) to neutral grey (#616161, #f5f5f5 bg). Added soft hint text "(consider increasing markup)" for <25% margin. Green (≥40%) and orange (25-40%) unchanged. Red on a *settings defaults page* felt like an error state — this is user's chosen default, not a validation error.
- **C. Fixed navigation label:** Changed `app.html` nav button from "Settings" to "Pricing Settings". Original label implied broader settings menu, causing confusion.

**Files changed:**
- `frontend/src/app/core/services/pricing.service.ts` — line 17: PUT → POST
- `frontend/src/app/features/pricing/pricing-settings/pricing-settings.component.ts` — added info card, changed red to grey, added hint text
- `frontend/src/app/app.html` — line 10: "Settings" → "Pricing Settings"

**Verification:** Production build succeeded with 0 errors (1.38s). Only budget warning (acceptable).

### 2026-04-15: Waste Optimization Suggestions Added

**What changed:**
- Extended `WasteSummary` DTO with two new fields: `OptimizationSuggestions` (`IEnumerable<string>`) and `RecommendedQuantityMultiplier` (`decimal`)
- Extracted private static helper `GetOptimizationSuggestions(decimal wastePercentage)` in `OrderService` — single source of truth used by both `CalculateWasteAsync` and `GetWasteAsync`
- 5 existing waste tests updated to assert new fields; 2 new tests added (>30% high waste, <5% excellent efficiency)
- All 32 backend tests pass; build 0 warnings/errors

**Suggestion tier thresholds:**
| WastePercentage | Multiplier | Suggestion count |
|---|---|---|
| > 30% | 0.75 | 2 (includes recipe quantity hint) |
| 20–30% (exclusive) | 0.82 | 1 |
| 10–20% (inclusive) | 0.90 | 1 |
| 5–10% (exclusive) | 0.95 | 1 |
| < 5% | 1.0 | 1 ("Excellent efficiency") |

**Boundary note:** Exactly 20% falls into the 10–20 bucket (multiplier 0.90) because the "high" guard is `> 20`, matching the existing WasteCategory "Medium" boundary (`<= 20`). Keeps category and suggestion tiers consistent.

**Format note:** Percentage values interpolated with `{wastePercentage:0.##}` — strips trailing decimal zeros (15.0 → "15", 15.5 → "15.5").

### 2026-04-14: Production Sheet Endpoint Implemented

**What was built:**
- `GET /api/events/{id}/production-sheet` — returns what to make for an event (not what to buy)
- 3 new DTOs: `ProductionSheetLineItem`, `ProductionSheetRecipe`, `ProductionSheetResponse`
- `GetProductionSheetAsync` on `IEventService` + `EventService`
- 4 new tests in `ProductionSheetTests.cs` (32 total pass)

**Key patterns used:**
- EF deep-include chain: `EventRecipes → Recipe → RecipeItems → Item → Vendor`
- Quantity multiplication: `recipeItem.Quantity * eventRecipe.Quantity` per line item
- `TotalStemCount` uses `(int)Sum(ri => ri.Quantity * er.Quantity)` across all EventRecipes
- `Notes` on `ProductionSheetRecipe` sourced from `Recipe.Description` (no dedicated notes field exists)

**Files changed:**
- `backend/src/EzStem.Application/DTOs/EventDtos.cs` — 3 new DTO records added
- `backend/src/EzStem.Application/Interfaces/IEventService.cs` — interface method added
- `backend/src/EzStem.Infrastructure/Services/EventService.cs` — implementation added
- `backend/src/EzStem.API/Controllers/EventsController.cs` — endpoint added
- `backend/tests/EzStem.Tests/Services/ProductionSheetTests.cs` — new test file (4 tests)

**Note:** Release build had a stale incremental cache issue (pre-existing) — `dotnet clean -c Release` before rebuild resolved it. Debug build was unaffected.
