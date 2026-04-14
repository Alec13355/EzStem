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
