# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### Initial Scaffold (2026-04-14)
- **Backend structure**: `/backend/src/` contains Domain (entities), Application (use cases), Infrastructure (EF Core DbContext), API (controllers, DI). `/backend/tests/` has xUnit tests.
- **Domain entities**: Item, Vendor, Recipe, RecipeItem, FloristEvent, EventRecipe, Order, OrderLineItem. All use Guid IDs. EventStatus and OrderStatus enums for workflow.
- **EF Core DbContext**: `EzStem.Infrastructure.Data.EzStemDbContext` — registered in API Program.cs with SQL Server provider.
- **Frontend structure**: `/frontend/src/app/features/` for feature modules (item-library, recipes, events, orders, pricing). `/frontend/src/app/shared/models/api.models.ts` contains TypeScript interfaces matching C# domain entities.
- **Environments**: Development uses localhost:5000 (API) ↔ localhost:4200 (Angular). Production uses relative `/api` path.
- **Docker**: `docker-compose.yml` at repo root provides SQL Server 2022 on port 1433 for local dev.
- **Key files**:
  - Backend entry: `backend/src/EzStem.API/Program.cs`
  - DbContext: `backend/src/EzStem.Infrastructure/Data/EzStemDbContext.cs`
  - Domain entities: `backend/src/EzStem.Domain/Entities/*.cs`
  - Frontend models: `frontend/src/app/shared/models/api.models.ts`
  - Environments: `frontend/src/environments/environment*.ts`
- **NuGet packages**: EF Core 9.x (SqlServer, Tools, Design), Swashbuckle 10.x for Swagger, AspNetCore.Mvc.Testing 9.x for integration tests.
- **Angular**: v17+ with standalone components, SCSS, routing enabled, no SSR.

### Code Review Sign-Off (2026-04-14)
- **Review Status**: APPROVED WITH NOTES — ready for push to GitHub
- **Backend Quality**: Clean architecture correctly implemented. Domain layer has zero external dependencies. DTOs in Application layer. Services implement interfaces properly. All monetary fields use `decimal` with `HasPrecision(18,4)`.
- **Test Coverage**: 9 tests covering critical paths (bundle rounding, cost calculation, soft delete, pagination, validation). All pass.
- **Frontend Quality**: Angular 17+ patterns followed correctly. Standalone components, lazy loading, centralized API service, proper HttpClient provisioning.
- **CI/CD Quality**: GitHub Actions with OIDC authentication (no long-lived secrets). Smoke test hits `/health` endpoint after deployment.
- **Infrastructure Quality**: Bicep modules for App Service, SQL, Key Vault, Monitoring. Key Vault uses RBAC model. Managed identity for secret access.
- **Security**: No production secrets in code. Local dev password in `appsettings.Development.json` and as fallback in `Program.cs` — acceptable but recommend removing inline fallback.
- **Minor Items**: Frontend `Item` interface missing `bundleSize` field (non-blocking).
- **Build/Test Commands**: `cd backend && dotnet build` (0 errors), `cd backend && dotnet test` (9 passed), `cd frontend && npm run build` (successful).

### P1 Tech Review (2026-04-14)

**Summary:** Reviewed P1 backend (Linus), P1 frontend (Rusty), and P1 infra (Basher). All systems go.

**Findings:**
- **18/18 backend tests pass** (9 P0 + 9 P1)
- **All clean architecture rules met** — no layer violations, interfaces respected, DI correct
- **Frontend production build passing** — budget warning (619KB, target 500KB) is non-blocking
- **Infra cost target met** — $18.54/month dev (under $25 ✅)

**Flagged issues:**
1. `LeadTimeDays` nullability: spec implies non-null, entity is nullable — **low risk**, acceptable for MVP; recommend making non-null with default 0 in next sprint
2. Missing `actualStemsUsed` guard in waste endpoint (could accept negative values) — **fixed by coordinator** before merge

**Sign-off:** APPROVED. P1 ready to ship.

### P0 Final Gate Review (2026-04-15)

**Summary:** QA gate review of Rusty's P0 implementation — Vendor CRUD UI and Pricing Config UI.

**Findings:**
- **18/18 backend tests pass** ✅
- **Frontend production build clean** ✅ (budget warning pre-existing)
- **Vendor CRUD UI**: APPROVED — all checklist items pass
- **Pricing Config UI**: REJECTED — HTTP method mismatch bug

**Blocking Bug Found:**
- `frontend/src/app/core/services/pricing.service.ts` line 17 uses `PUT` but `PricingController.cs` expects `POST`
- Will cause 405 Method Not Allowed when saving pricing settings

**Action Required:**
- Linus (not Rusty per review policy) must fix: change `api.put` → `api.post` in pricing.service.ts
- Re-review after fix

**Sign-off:** REJECTED. Fix required before merge.

### P0 Final Review — Re-Review (2026-04-15)

**Summary:** Final verification after Linus fixed HTTP method bug.

**Verified:**
- `pricing.service.ts` now uses `api.post` (not `api.put`) — Linus fix confirmed ✅
- 18/18 backend tests pass ✅
- Frontend production build passes (budget warning pre-existing) ✅
- Linus UX fixes: context card, grey (not red) low-margin colour, "Pricing Settings" nav label ✅
- Rusty vendor fixes: 44px touch targets, MatDialog confirmation ✅

### P0 Final Review — Re-Review (2026-04-15)

**Summary:** Final verification after Linus fixed HTTP method bug.

**Verified:**
- `pricing.service.ts` now uses `api.post` (not `api.put`) — Linus fix confirmed ✅
- 18/18 backend tests pass ✅
- Frontend production build passes (budget warning pre-existing) ✅
- Linus UX fixes: context card, grey (not red) low-margin colour, "Pricing Settings" nav label ✅
- Rusty vendor fixes: 44px touch targets, MatDialog confirmation ✅

**Sign-off:** APPROVED. Merged to main as commit `84f318a`.

**Commit message:**
```
feat: complete P0 vendor CRUD UI and pricing settings

- Add VendorFormComponent dialog for create/edit vendors
- Update VendorListComponent with full CRUD (add/edit/delete/search)
- Add 44px touch targets and MatDialog confirmation on vendor CRUD
- Add PricingSettingsComponent at /settings/pricing
- Add context card, fix colour coding, update nav label (Pricing Settings)
- Fix pricing service HTTP method: PUT -> POST
- All 18 backend tests passing, frontend build clean
```

### Event-Centric Backend Review (2026-04-29)

**Summary:** Initial code review of Linus's event-centric backend (EventItem/EventFlower/EventItemFlower services + endpoints). Issued **NEEDS FIXES** with 3 issues.

**Issues found:**
1. 🔴 Missing `UpdatedAt` field on FloristEvent — `from-last-event` endpoint sorts by CreatedAt instead of most recently updated
2. 🔴 `DeleteFlowerAsync` unguarded — deleting in-use flowers throws unhandled DbUpdateException (500)
3. 🟡 Design concern — bundle cost pooled per-flower or per-item? (Deferred to Alec)

**Architecture verification (✅ correct):**
- FlowerBudget = TotalBudget / ProfitMultiple calculation correct
- Event-scoped validation (ownership checks) in all endpoints
- Bundle rounding: `BunchesNeeded = ceil(TotalStemsNeeded / BunchSize)`
- Cascade rules: EventItem→EventItemFlower (Cascade), EventFlower→EventItemFlower (NoAction)
- Authorization: All controllers use [Authorize], 4-tier claim fallback for user ID

**Action:** Linus to apply fixes; re-review after completion.

### Event-Centric Backend — Final Review & Approval (2026-04-29)

**Summary:** Re-review after Linus applied all fixes. Verdict: **APPROVED**.

**Verified:**
- ✅ `UpdatedAt` field added to FloristEvent, wired on all mutations
- ✅ `DeleteFlowerAsync` guards against in-use flowers; throws exception caught as 409 Conflict
- ✅ Procurement pooling verified: SelectMany + GroupBy on EventFlowerId, bunches rounded on pooled total, TotalFlowerCost from pooled lines (not per-item sum)
- ✅ All 53 tests pass (16 new event-centric tests + 37 existing)
- ✅ No remaining issues

**Sign-off:** Clear to ship to main.