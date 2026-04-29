# Project Decisions

## Auth Interceptor Fix (Rusty — 2026-04-19)

Fixed silent-failure 401 bug in auth interceptor. When authenticated but token unavailable (InteractionRequiredAuthError / MSAL redirect in flight), return EMPTY instead of forwarding the request unauthenticated. Unauthenticated requests (landing page) still pass through. Pattern: check isAuthenticated() first, then getToken(), then suppress with EMPTY if token is null.

## Recipe New — Dual Save Buttons & UX Feedback (Rusty — 2026-04-22)

At `/recipes/new`, implement dual save buttons with snackbar feedback:
- **Save** button navigates to `/recipes` list (not detail page) after successful create
- **Save & Add Another** button saves, resets form, and stays on `/recipes/new`
- snackbar feedback: "Recipe created" (success new), "Recipe updated" (success edit), "Failed to save recipe. Please try again." (error)
- Button styling: `mat-raised-button` for primary action, `mat-stroked-button` for secondary
- `saveRecipe(continueAdding: boolean = false)` parameter for implementation
- Only applies to new recipe flow; edit flow keeps single "Save Recipe" button

## Event-Centric Domain Entities (Linus — 2026-04-29)

Introduced three new domain entities for event-centric workflow:
- `EventItem` — per-event customer-facing arrangement with price and quantity
- `EventFlower` — per-event flower pricing and bunch sizing
- `EventItemFlower` — recipe junction (stems per item)

Extended `FloristEvent` with `TotalBudget` and `ProfitMultiple` (decimal(18,4)). Migration `AddEventItemsAndFlowers` creates tables with proper indexes and cascade rules:
- EventItem → EventItemFlower: Cascade delete
- EventFlower → EventItemFlower: NoAction delete (avoid cascade conflicts)
- All monetary fields use decimal(18,4) per project standard

## Event-Centric API Layer (Linus — 2026-04-29)

Implemented dedicated services + controllers for event items, event flowers, and item recipes. Exposed:
- `/api/events/{eventId}/event-items` — CRUD + GET /from-last-event for prepopulation
- `/api/events/{eventId}/event-flowers` — CRUD
- `/api/events/{eventId}/event-items/{itemId}/recipe` — recipe junction CRUD
- `GET /api/events/{id}/recipe-summary` — event-level recipe budget summary

All endpoints are owner-scoped via event ownership checks. Recipe summary calculation:
- `TotalStemsNeeded = StemsNeeded * Item.Quantity`
- `BunchesNeeded = ceil(TotalStemsNeeded / BunchSize)`
- `TotalCost = PricePerStem * BunchSize * BunchesNeeded`
- `FlowerBudget = TotalBudget / ProfitMultiple`
- `IsOverBudget = TotalFlowerCost > FlowerBudget`

## Design Decision: Flower Cost Pooling (Linus/Alec — 2026-04-29)

FlowerProcurement pools stems per flower type across all items before rounding up bunches. TotalFlowerCost = sum of pooled procurement lines, not per-item lines. Alec approved pooled calculation as more accurate procurement cost vs. per-item attribution.

## Navigation Cleanup — Event-Centric Redesign (Rusty — 2026-04-29)

Stripped application navigation and routing to single feature: **Events**. Removed nav links and lazy-loaded routes for Items, Recipes, Orders, and Pricing Settings. App now routes to: landing (/), event list (/events), and event detail (/events/:id).

Changes:
- `app.html` — Removed Items, Recipes, Orders, Pricing Settings nav buttons
- `app.routes.ts` — Removed 6 routes; removed eventDetailCanDeactivate import
- `event-list.component.ts` — Simplified filters (name-only), updated columns (name/budget/profitMultiple), added inline CreateEventDialogComponent
- `api.models.ts` — Added totalBudget/profitMultiple to FloristEvent; added EventItem, EventFlower, EventItemFlower model suite

Rationale: Old routes removed entirely rather than hidden. Components remain on disk for reference. Create flow changed to inline dialog for faster UX. Models added now so downstream components can reference them.

## Tech Review — Event-Centric Redesign (Danny — 2026-04-29)

Initial review flagged 3 issues:
1. 🔴 Missing `UpdatedAt` field on FloristEvent — `from-last-event` sorts by CreatedAt instead of most recently updated
2. 🔴 `DeleteFlowerAsync` unguarded — deleting in-use flowers throws unhandled DbUpdateException (500)
3. 🟡 Design decision — bundle cost pooled per-flower or per-item? (Resolved: Alec approved pooled calculation)

## Fixes Applied (Linus — 2026-04-29)

1. ✅ **AddFloristEventUpdatedAt migration** — Added UpdatedAt field to FloristEvent; wired on all mutations
2. ✅ **FlowerInUseException + 409 Conflict** — Added guard in DeleteFlowerAsync checking for in-use flowers, throws exception caught as 409
3. ✅ **Pooled FlowerProcurement** — Procurement pooled by EventFlowerId using SelectMany + GroupBy, bunches rounded on pooled total, TotalFlowerCost derived from pooled lines

All 53 tests pass (16 new event-centric tests + 37 existing).

## Final Review — Approved (Danny — 2026-04-29)

Re-review after fixes: **APPROVED**.
- ✅ UpdatedAt correctly wired and used
- ✅ DeleteFlowerAsync guard prevents 500s
- ✅ Procurement pooling verified end-to-end
- ✅ All 53 tests pass
- ✅ Clear to ship

## Database Migration Fix (Linus)

_From previous inbox consolidation._
