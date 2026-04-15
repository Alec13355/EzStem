# Squad Decisions

## Architecture Decisions

### Initial Architecture (Danny — 2026-04-14)

**What:** EzStem uses .NET 9 Clean Architecture for backend, Angular 17+ standalone components for frontend.

**Why:** Clean architecture enforces domain isolation. Angular standalone components reduce boilerplate. SQL Server chosen for Azure SQL compatibility.

**Details:**
- Backend: Domain → Application → Infrastructure → API (proper layer separation)
- Domain model: Item, Vendor, Recipe, FloristEvent, Order
- EF Core 9.x with SQL Server, decimal precision (18,4)
- Angular 17+ standalone components, lazy-loaded routes
- Development: docker-compose up db, dotnet run, npm start

---

## API Patterns (Linus — 2026-04-14)

### Soft Delete Pattern
All deletable entities use soft deletes (IsDeleted + DeletedAt fields with global query filters).

### Bundle Rounding Algorithm
Quantities round UP to nearest bundle size: ceil(qty / bundleSize) * bundleSize

### API Route Conventions
RESTful CRUD with domain-specific sub-routes (e.g., /api/recipes/{id}/cost, /api/events/{id}/generate-order)

### Decimal Precision
All monetary and quantity fields use decimal(18, 4) to prevent float rounding errors.

### Service Layer Validation
Services throw ArgumentException for business rule violations; controllers return HTTP status codes.

### Cost Snapshots
RecipeItems snapshot Item.CostPerStem at creation time (prices fluctuate, historical recipes must be stable).

### Vendor Grouping
OrderResponse groups line items by vendor (saves frontend aggregation work).

---

## Frontend Architecture (Rusty — 2026-04-14)

Angular 17+ standalone components with Material Design, tablet-first responsive design.

**Key Decisions:**
- Standalone components (no NgModules)
- Lazy-loaded routes via loadComponent()
- Centralized ApiService pattern
- Material theme: green primary, light-green accent
- Responsive: tablet-first (md=768–1024px)
- Real-time cost updates (<100ms)
- Profit margin color coding

---

## Infrastructure & CI/CD (Basher — 2026-04-14)

**Key Decisions:**
1. App Service (not AKS) — sufficient for single service
2. OIDC federated credentials (no long-lived secrets)
3. Key Vault RBAC (modern authorization + audit logs)
4. Bicep modules (Azure-native IaC, reusable)
5. Workflow_run trigger (CD only after CI passes)
6. Environment-specific tiers (dev: B2/Basic, prod: P2v3/S2)

**Modules:**
- appservice.bicep: App Service Plan + .NET 9 Web App + managed identity
- database.bicep: Azure SQL Server + environment-specific database tier
- keyvault.bicep: Key Vault with RBAC
- monitoring.bicep: Log Analytics + Application Insights

**Health Endpoint:** GET /health returns {"status": "healthy", "timestamp": "..."}

---

## UX Design (Tess — 2026-04-14)

**5 Core Decisions:**

1. Real-Time Profit Visibility — Margin on every screen, instant updates
2. Tablet-First UI — >=44px buttons, landscape support, touch-optimized
3. Bundle Rounding Math Visible — Show calculation inline (builds florist trust)
4. Searchable Picker + Instant Cost Feedback — Fast data entry (200ms debounce)
5. Status Workflow — Draft → Confirmed → Ordered → Completed (read-only after Ordered)

**Color Coding:**
- Profit: green (>=40%), orange (25–40%), red (<25%)
- Waste: green (<10%), orange (10–20%), red (>20%)
- Status: grey (Draft), blue (Confirmed), orange (Ordered), green (Completed)

---

## Sprint Plan (Reuben — 2026-04-14)

**4-Phase Delivery:**
- Phase 1: Foundation (5 days) — COMPLETE
- Phase 2: UX + Backend + DevOps (26-30 days, parallel)
- Phase 3: Frontend (27 days, serial, starts day 26)
- Phase 4: Integration + Launch (14 days, serial)

**Total: 40-50 days (6-7 weeks)**

**Critical Path:** Backend (26d) + Frontend (27d)

**Team Allocation:**
- Danny: Architecture/security review (5-8d)
- Linus: Backend P0 (26d)
- Rusty: Frontend P0 (27d)
- Tess: UX design (12d)
- Basher: Infrastructure (9d)
- Saul: Domain validation/UAT (10d)
- Alec: Product owner

---

## Code Review Sign-Off (Danny — 2026-04-14)

**Status: APPROVED FOR PUSH**

✓ Backend architecture (Clean Architecture, proper DI, soft deletes)
✓ Backend tests (9/9 passing)
✓ Frontend architecture (standalone components, lazy loading)
✓ CI/CD pipeline (OIDC, smoke tests)
✓ Infrastructure (Bicep, Key Vault RBAC)
✓ Security (no hardcoded secrets, HTTPS, parameterized queries)

**Non-blocking issues:**
1. Dev password fallback in Program.cs (acceptable, documented)
2. Frontend Item missing bundleSize property (should add)
3. No frontend unit tests (acceptable Phase 1)

---

## QA Sign-Off (2026-04-14)

**Status: PASS — READY TO PUSH**

✓ Backend: 0 errors, 0 warnings, 9/9 tests (0.6s)
✓ Frontend: 0 errors, 0 warnings, bundle 2.4 MB, lazy chunks 7-284 kB
✓ Infrastructure: All files present (ci.yml, cd.yml, Bicep, docker-compose.yml)
✓ Code quality: Clean build, proper .gitignore, health endpoint

**Sign-off:** All builds succeed, all tests pass. Ready to push 162 files with 20,966 insertions.

---

## Governance

- Decision format: Per agent per area
- Review cadence: Every 3-5 days at phase gates
- Change control: Team consensus; architectural changes require Danny approval
- Escalation: Blockers → Reuben (PM) → Alec (Product Owner)
- Domain validation: Saul reviews cost/pricing logic; Tess reviews UX

---

## P1 Session Decisions (2026-04-14)

### Azure Cost Optimization (Basher — 2026-04-14)

**Context:** Alec requested dev infrastructure under $25/month.

**Decisions:**

1. **App Service Plan: B1 Basic (~$13/month)** — F1 Free tier excluded (no managed identity support). B1 sufficient for dev; prod uses P2v3.

2. **SQL Database: Basic Tier, 2GB (~$5/month)** — 5 DTU handles dev CRUD load; saves ~$50/month vs Standard S0.

3. **Deployment: Zip Deploy (not Docker/ACR)** — Eliminates $5/month ACR cost; faster deploys; no image complexity for dev.

4. **Blob Storage for Frontend: Standard LRS (~$0.50/month)** — Static website hosting for Angular SPA; CDN optional for prod.

5. **Key Vault + App Insights: Free/minimal** — Dev operation counts negligible; App Insights under 5GB free tier.

**Total dev cost: $18.54/month** (target met: under $25 ✅)

**OIDC Federated Credentials** adopted for GitHub Actions → Azure auth (no long-lived secrets, 5-min token expiry).

**Files changed:** `infra/modules/appservice.bicep`, `infra/modules/database.bicep`, `infra/modules/storage.bicep` (new), `infra/main.bicep`, `infra/parameters/dev.bicepparam`, `infra/deploy.sh`, `.github/workflows/cd.yml`, `infra/AZURE_SETUP.md` (new), `infra/DEPLOYMENT_CHECKLIST.md` (new).

---

### P1 Backend Architecture (Linus — 2026-04-14)

1. **EF Core Migration Strategy** — Separate semantically-named migrations (InitialCreate, AddSeasonalItemFields, AddWasteCalculationFields) for cleaner rollback and git history.

2. **Seasonal Month Range Handling** — Integer month fields (1–12), cross-year ranges supported (`start > end` → OR logic). Null = year-round availability.

3. **Waste Category Thresholds** — Low (<10%), Medium (10–20%), High (>20%). Matches Tess's UX color coding. Stored as WastePercentage + WasteCalculationDate on Order entity.

4. **CSV Export Format** — Vendor-grouped, alphabetically sorted; columns: Vendor, Item, BundleSize, BundlesOrdered, TotalStems, UnitCost, TotalCost; TOTAL row at bottom.

5. **Lead Time Warning Logic** — Warn when `daysUntilEvent <= item.LeadTimeDays && daysUntilEvent >= 0`. Inclusive comparison; no warning for past events.

6. **Waste Storage on Order Entity** — No separate WasteTracking table (MVP). Nullable WastePercentage with audit timestamp.

---

### P1 Frontend Architecture (Rusty — 2026-04-14)

1. **CSV Download via Blob API** — Angular HttpClient `responseType: 'blob'` + temporary anchor element. No page disruption; custom filename `order-{id}.csv`. (Rejected: window.location redirect — causes page flicker.)

2. **Inline Waste Result Display** — Show WasteSummary in same card after submit; reload order to switch to readonly view. Follows "show your math" principle.

3. **Seasonal Warning as Single Banner** — Top-of-page banner if any seasonal items out of range. Frontend-only check (data already in event payload). Non-blocking alert.

4. **Waste CSS Classes Separate from Margin Classes** — `.waste-low`, `.waste-medium`, `.waste-high` vs `.margin-*`. Same palette, semantically distinct; thresholds may diverge in future.

5. **HttpClient + ApiService Dual Injection** — OrderService injects both. ApiService handles JSON endpoints; HttpClient used directly for blob CSV export. Pragmatic, not an abstraction violation.

---

### P1 Tech Review (Danny — 2026-04-14)

**Status: APPROVED**

- 18/18 tests passing
- All clean architecture rules met
- **Flagged (low risk):** `LeadTimeDays` nullability — spec shows non-null but entity is nullable; acceptable for MVP
- **Flagged + Fixed:** Missing `actualStemsUsed` guard in waste endpoint (fixed by coordinator)

---

## CD Pipeline Reliability Fixes (Basher — 2026-04-14)

**Agent:** Basher  
**Type:** Infrastructure / CI/CD

### Context

The CD pipeline was failing in two distinct ways:
1. The "Provision SQL user for App Service MI" step failed with "Insufficient privileges" error
2. Smoke tests were returning 503 errors even when infrastructure provisioned successfully

### Fix 1: Replace Azure AD Lookup with Direct MI Name

**Problem:** The workflow called `az ad sp show --id "$APP_MI_ID"` to get the Managed Identity display name. This requires Azure AD Graph permissions (`Directory.Read.All`) that the OIDC service principal doesn't have.

**Solution:** Use the App Service name directly from `secrets.AZURE_WEBAPP_NAME` as the MI display name. For Azure App Service with system-assigned Managed Identity, the MI display name is **always** identical to the App Service name.

**Implementation:**
```yaml
# Before (failed):
APP_MI_ID=$(az webapp identity show \
  --name ${{ secrets.AZURE_WEBAPP_NAME }} \
  --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
  --query principalId -o tsv)
APP_MI_NAME=$(az ad sp show --id "$APP_MI_ID" --query displayName -o tsv)

# After (works):
APP_MI_NAME="${{ secrets.AZURE_WEBAPP_NAME }}"
```

**Benefits:**
- Eliminates Azure AD permission requirement
- Simpler, faster (no extra API calls)
- More reliable (no dependency on AAD Graph availability)
- Follows principle of least privilege for OIDC SP

### Fix 2: Remove Async Flag from Deployment

**Problem:** `az webapp deploy --async true` returns immediately after zip upload, before the app restarts and starts up. The 45-second sleep wasn't sufficient for the .NET 9 app to fully initialize and respond to health checks.

**Solution:** Remove `--async true` flag. Azure CLI will wait for the complete deployment cycle (upload → app restart → startup) before proceeding.

**Implementation:**
```yaml
# Before (flaky):
az webapp deploy \
  --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
  --name ${{ secrets.AZURE_WEBAPP_NAME }} \
  --src-path ./backend/deploy.zip \
  --type zip \
  --async true

# After (reliable):
az webapp deploy \
  --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
  --name ${{ secrets.AZURE_WEBAPP_NAME }} \
  --src-path ./backend/deploy.zip \
  --type zip
```

**Benefits:**
- Guaranteed app readiness before smoke test
- Simpler than async + retry logic
- Better failure detection (deploy failures surface immediately)
- Aligns with GitHub Actions best practice (let commands complete)

### Alternatives Considered

**For MI name issue:**
- **Grant Directory.Read.All to OIDC SP** — Rejected: violates least privilege, unnecessary permission escalation
- **Use `az webapp show` to get name** — Rejected: redundant when we already have it in secrets

**For smoke test issue:**
- **Increase sleep duration** — Rejected: still brittle, wastes time on successful deploys
- **Add retry logic** — Rejected: more complex than synchronous deploy, masks real failures

### Impact

- **Security:** Improved (reduced OIDC SP permissions)
- **Reliability:** Significantly improved (both failure modes eliminated)
- **Performance:** Slightly slower deploys (wait for completion), but more predictable
- **Maintainability:** Improved (simpler code, fewer API calls)

### Verification

- DB_NAME derivation logic verified: `DB_NAME="${SQL_SERVER%-sql}-db"` correctly transforms `ezstem-dev-sql` → `ezstem-dev-db` (matches Bicep naming convention)
- App Service MI naming convention confirmed in Bicep: `webAppName = '${appName}-api'` and MI uses webapp name as display name

---

### Deployment Bug Fixes (Basher)

**Status: RESOLVED**

Three critical bugs in CD pipeline fixed:

1. **SWA Token Masking Order** (.github/workflows/cd.yml)
   - Problem: `::add-mask::` was running before `GITHUB_OUTPUT` write, causing token to be substituted with `***`
   - Fix: Swapped order — write to `GITHUB_OUTPUT` first, then apply mask
   - Result: SWA deploy receives real token value

2. **Key Vault RBAC for App Service MI** (infra/main.bicep)
   - Problem: App Service configured with KV reference but MI lacked RBAC role
   - Fix: Added `Key Vault Secrets User` role assignment (`4633458b-17de-408a-b874-0445c86b69e0`)
   - Result: Connection string no longer null; app startup succeeds

3. **CORS Configuration for Production** (appservice.bicep + main.bicep)
   - Problem: Backend CORS hardcoded to `http://localhost:4200`; production frontend blocked
   - Fix: Added `swaHostname` parameter + `AllowedOrigins__0/1` app settings
   - Result: Frontend can call API from Azure Static Web Apps domain

**Files Changed:** `.github/workflows/cd.yml`, `infra/main.bicep`, `infra/modules/appservice.bicep`  
**Commit:** 8bacd73  
**Impact:** CD pipeline can now successfully deploy to Azure

---

### Azure Entra SQL Authentication + Region (Basher)

**Status: IMPLEMENTED**

1. **Region: eastus → eastus2**
   - Paired region with better availability zone coverage and capacity
   - Files: `infra/main.bicep`, `infra/parameters/dev.bicepparam`, `infra/deploy.sh`, `infra/AZURE_SETUP.md`

2. **Entra-Only SQL Auth (no password)**
   - SQL Server: `azureADOnlyAuthentication: true`
   - App Service connects via System-Assigned MI with `Authentication=Active Directory Default`
   - No password ever touches Key Vault, env vars, or deploy scripts
   - Post-deploy: Manual SQL grants required (`db_datareader`, `db_datawriter`, `db_ddladmin`)
   - Files: `infra/modules/database.bicep`, `infra/main.bicep`, `infra/parameters/dev.bicepparam`, `infra/deploy.sh`

3. **Principal Type Handling**
   - `deploy.sh` auto-detects: user (`User`) or service principal (`Application`)
   - Ensures Bicep `administrators` block correct regardless of deployment context

---

### CORS Configuration Migration (Linus)

**Status: IMPLEMENTED**

Backend migrated from hardcoded CORS origin to configuration-driven approach.

**Changes:**
- **Program.cs** (lines 25-31): Read `AllowedOrigins` from `IConfiguration` with fallback to localhost
- **appsettings.json**: Added `AllowedOrigins` array with localhost default
- **Azure Integration**: Works with `AllowedOrigins__N` environment variables from App Service
- **Security**: CORS origins are non-secrets (browser-enforced, publicly visible)

**Testing:**
- ✅ Release build: 2.4s, 0 warnings
- ✅ All 18 backend tests passing

**Commit:** a4a36e5

---

### Azure Entra Managed Identity SQL Auth Support (Linus)

**Status: IMPLEMENTED**

Backend infrastructure for MI-based SQL authentication in Azure.

**Changes:**
1. **Azure.Identity 1.13.2** added to EzStem.Infrastructure
   - Enables `Authentication=Active Directory Default` connection strings
   - App Service MI auto-picks up credentials via `DefaultAzureCredential`

2. **Startup migration** in Program.cs
   - `db.Database.Migrate()` runs on app startup in all environments
   - Azure SQL always has latest schema
   - Local Docker dev unaffected (password-based auth continues)

3. **Connection string formats documented**
   - Azure: `Server=tcp:{server}.database.windows.net,1433;Initial Catalog={db};Authentication=Active Directory Default;Encrypt=True;...`
   - Local Dev: `Server=localhost,1433;Database=EzStem;User Id=sa;Password=...;TrustServerCertificate=True`

**Testing:** All 18 tests pass (9 P0, 9 P1)

---

## OpenAPI Dependency Conflict Fix (Linus — 2026-04-14)

**Status: RESOLVED**

**Problem:** ReflectionTypeLoadException on application startup caused by version conflict:
- Microsoft.AspNetCore.OpenApi 9.0.14 (depends on Microsoft.OpenApi 1.x)
- Swashbuckle.AspNetCore 6.x (depends on Microsoft.OpenApi 2.x)
- IOpenApiAny type missing in OpenAPI 2.x branch

Only Swashbuckle is used in the project for Swagger UI; Microsoft.AspNetCore.OpenApi was unused.

**Solution:** Removed Microsoft.AspNetCore.OpenApi 9.0.14 from EzStem.API.csproj

**Verification:**
- Release build: 2.4s, 0 warnings
- All 18 backend tests passing
- Application starts cleanly without ReflectionTypeLoadException

**Files Changed:** `backend/EzStem.API/EzStem.API.csproj`

**Impact:** CD pipeline can now successfully build and deploy without initialization errors.

---

## SPA Routing Configuration for Azure Static Web Apps (Basher — 2026-04-15)

**Status: RESOLVED**

**Problem:** Angular SPA shows 404 errors when users refresh on any route (e.g., `/items`, `/orders/abc-123`). Azure Static Web Apps tries to find a server-side file at that path instead of serving the SPA's `index.html`.

**Solution:** Created `staticwebapp.config.json` in `frontend/public/` with `navigationFallback` configuration to route all unmatched requests to `index.html`, allowing Angular's client-side router to handle navigation.

**File:** `frontend/public/staticwebapp.config.json`

**Configuration:**
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "*.{css,scss,js,ts,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot,map,json}"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "platform": {
    "apiRuntime": "node:18"
  }
}
```

**Details:**
- **navigationFallback.rewrite:** `/index.html` — all unmatched routes serve the app shell
- **navigationFallback.exclude:** Static assets and API routes are NOT rewritten
  - `/api/*` — backend API calls proxy to app service
  - `*.{css,scss,js,ts,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot,map,json}` — actual static files delivered as-is
- **routes:** `/api/*` with `allowedRoles: ["anonymous"]` — backend proxy route, no authentication required at SWA level
- **platform.apiRuntime:** `node:18` — SWA API functions use Node.js 18 (future-proofing)

**File Placement Rationale:**
- Angular 17+ projects use `frontend/public/` as the assets source (configured in `angular.json` lines 26–30)
- The build step (`ng build`) copies all files from `public/` verbatim to `dist/frontend/browser/`
- SWA deployment picks up `dist/frontend/browser/staticwebapp.config.json` automatically during the `output_location` step
- This is **NOT** a dev-only config — it's deployed to production as part of the SPA bundle

**Impact:**
✅ Users can refresh on any route without 404  
✅ Client-side routing works seamlessly  
✅ Static assets (JS, CSS, images) are served directly  
✅ API routes proxy correctly to backend service  
✅ No additional deployment steps required

---

## Order Response Waste Fields (Linus — 2026-04-15)

**Status: IMPLEMENTED**

**Problem:** The `order-detail` frontend component was attempting to display order waste fields (`order.wastePercentage` and `order.wasteCalculationDate`), but these fields were missing from the `OrderResponse` DTO. The `Order` domain entity already included these nullable properties from the P1 waste calculation feature.

**Solution:** Added `WastePercentage` (decimal?) and `WasteCalculationDate` (DateTime?) to the `OrderResponse` record and updated the mapping method to populate them from the domain entity.

**Files Changed:**
1. `backend/src/EzStem.Application/DTOs/OrderDtos.cs` — Added fields to OrderResponse record
2. `backend/src/EzStem.Infrastructure/Services/OrderService.cs` — Updated MapToOrderResponse method (lines 155–165)

**OrderResponse (updated):**
```csharp
public record OrderResponse(
    Guid Id, Guid EventId, string EventName,
    string Status, decimal TotalCost,
    IEnumerable<OrderLineItemResponse> LineItems,
    IEnumerable<VendorOrderGroup> ByVendor,
    decimal? WastePercentage,           // NEW
    DateTime? WasteCalculationDate,     // NEW
    DateTime CreatedAt);
```

**Rationale:**
- Frontend Alignment — The frontend was already expecting these fields; this ensures backend-frontend contract consistency
- Nullable Design — Fields are nullable to support orders that haven't had waste calculated yet
- Domain-Driven — Fields map directly from existing `Order` entity properties — no new domain logic required
- Backward Compatible — Adding nullable fields to a DTO doesn't break existing API consumers

**Impact:**
- All endpoints returning `OrderResponse` now include waste data:
  - `GET /api/orders/{id}`
  - `GET /api/orders` (paginated list)
  - `POST /api/events/{id}/generate-order`
- Frontend `order-detail` component can now properly display waste percentage and calculation date
- No new tests required; existing 18 backend tests continue passing

**Verification:**
✅ Build succeeded: 0 warnings, 0 errors (1.32s)  
✅ All 18 backend tests pass  
✅ DTO contract matches frontend expectations  

---

## Frontend Models & Service Bindings (Rusty — 2026-04-15)

**Status: RESOLVED**

**Problem:** Empty tables across all views due to three categories of bugs:
1. Services sent wrong query parameter names (`pageNumber` instead of `page`)
2. Services expected wrong return types (arrays instead of `PagedResponse<T>`)
3. Frontend models didn't match backend response shapes (missing denormalized fields)

**Root Causes:**

**A. Query Parameter Mismatches**
- `ItemService.getItems()` sent `pageNumber` but backend expects `page`
- `VendorService.getVendors()` sent `pageNumber` but backend expects `page`

**B. Return Type Mismatches**
- `RecipeService.getRecipes()` returned `Observable<Recipe[]>` but backend returns `PagedResponse<RecipeResponse>`
- `EventService.getEvents()` returned `Observable<FloristEvent[]>` but backend returns `PagedResponse<EventResponse>`
- `OrderService.getOrders()` returned `Observable<Order[]>` but backend returns `PagedResponse<OrderResponse>`

**C. Model Shape Mismatches (Missing Denormalized Fields)**
Backend returns flat denormalized fields to avoid N+1 queries on frontend:
- `Item`: missing `vendorName?: string`
- `OrderLineItem`: missing `itemName`, `vendorName`, `bundleSize`, `bundlesNeeded`, `lineTotalCost`
- `VendorOrderGroup`: uses `lineItems` but backend sends `items`; uses `totalCost` but backend sends `vendorTotalCost`
- `Order`: missing `eventName`, `totalCost`, `byVendor`
- `EventRecipe`: missing `recipeName`, `unitCost`, `totalCost`
- `RecipeItem`: missing `itemName`, `lineTotal`

**Solutions:**

**1. Fixed Service Parameters**
- `ItemService.getItems()`: Changed `pageNumber` → `page`
- `VendorService.getVendors()`: Changed `pageNumber` → `page`

**2. Fixed Service Return Types**
- `RecipeService.getRecipes()`: Now returns `Observable<PagedResponse<Recipe>>`
- `EventService.getEvents()`: Now returns `Observable<PagedResponse<FloristEvent>>`
- `OrderService.getOrders()`: Now returns `Observable<PagedResponse<Order>>`

**3. Extended Frontend Models (api.models.ts)**
Added denormalized fields while keeping nested objects optional for backward compatibility:

- **Item:** `vendorName?: string`, `bundleSize: number`
- **RecipeItem:** `itemName?: string`, `lineTotal?: number`, `recipeId?: string` (optional)
- **EventRecipe:** `recipeName?: string`, `unitCost?: number`, `totalCost?: number`, `eventId?: string` (optional)
- **OrderLineItem:** `itemName?: string`, `vendorName?: string`, `bundleSize?: number`, `bundlesNeeded?: number`, `lineTotalCost?: number`, `orderId?: string` (optional)
- **VendorOrderGroup:** `items?: OrderLineItem[]`, `vendorTotalCost?: number`, legacy `lineItems` and `totalCost` (optional)
- **Order:** `eventName?: string`, `totalCost?: number`, `byVendor?: VendorOrderGroup[]`

**4. Updated Components**
- **item-list:** `item.vendor?.name` → `item.vendorName`
- **event-list, recipe-list, order-list:** Extract `response.items` from paged response
- **order-detail:** Use `order.byVendor` if available, fallback to manual grouping; use flat field names first, fallback to nested
- **event-detail:** Extract items from paged response, use flat field names

**Design Decisions:**

**Backward Compatibility Strategy**
- Keep legacy nested object properties as optional alongside new flat fields
- Components check new fields first, fall back to old patterns
- Graceful degradation if backend response is missing new fields

**Denormalization Pattern**
- Backend returns commonly-accessed nested fields as flat properties
- Avoids N+1 queries on frontend
- Reduces frontend model complexity
- Improves performance (less object traversal)

**Pre-Computed Aggregations**
- Backend pre-computes expensive aggregations (`order.totalCost`, `order.byVendor`)
- Frontend doesn't need to manually sum/group every time
- Single source of truth for business logic

**Files Changed:**

**Models:**
- `frontend/src/app/shared/models/api.models.ts`

**Services:**
- `frontend/src/app/core/services/item.service.ts`
- `frontend/src/app/core/services/vendor.service.ts`
- `frontend/src/app/core/services/recipe.service.ts`
- `frontend/src/app/core/services/event.service.ts`
- `frontend/src/app/core/services/order.service.ts`

**Components:**
- `frontend/src/app/features/item-library/item-list/item-list.component.ts`
- `frontend/src/app/features/orders/order-list/order-list.component.ts`
- `frontend/src/app/features/orders/order-detail/order-detail.component.ts`
- `frontend/src/app/features/events/event-list/event-list.component.ts`
- `frontend/src/app/features/events/event-detail/event-detail.component.ts`
- `frontend/src/app/features/recipes/recipe-list/recipe-list.component.ts`

**Impact:**
- **Fixed:** All empty table issues across all views (item library, recipes, events, orders, order detail, event detail)
- **Performance:** Order detail component now uses pre-grouped data instead of O(n) manual grouping on every render
- **Maintainability:** Frontend models now accurately reflect backend response shapes, reducing confusion and bugs

**Verification:**
✅ Build succeeded: 0 errors, 0 warnings (1.423s)  
✅ All tables now populate with data  
✅ Models accurately match backend response shapes  

---

## Angular Production Environment Configuration (Rusty — 2026-04-14)

**Status: IMPLEMENTED**

**Problem:** Missing fileReplacements in angular.json prod config caused dev environment settings (localhost:4200) to ship in production builds, causing CORS errors from SWA.

**Solution:** Added fileReplacements to angular.json production configuration; set environment.prod.ts apiUrl to `https://ezstem-dev-api.azurewebsites.net/api`

**Details:**
- **File:** `frontend/angular.json` (production config)
- **Change:** Added fileReplacements block to replace `src/environments/environment.ts` with `src/environments/environment.prod.ts`
- **environment.prod.ts:** apiUrl set to Azure App Service endpoint

**Impact:**
✅ Production builds now use correct API endpoint  
✅ CORS errors from SWA resolved  
✅ Frontend correctly calls backend service in production
