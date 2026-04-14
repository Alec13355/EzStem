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
