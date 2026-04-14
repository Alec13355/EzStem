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

