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

## CD Pipeline Fixes (Basher & Linus — 2026-04-14)

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
