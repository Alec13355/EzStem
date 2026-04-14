# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

### 2026-04-14: EzStem MVP Scope & Critical Path
- **Scope:** P0 includes Item Library, Recipe Builder, Pricing Engine, Event Planner, Order Generator. No authentication in MVP.
- **Critical path:** Backend dependency chain (Items → Recipes → Pricing → Events → Orders) is serial, ~26 days. Frontend waits for stable APIs.
- **Florist validation:** Saul must sign off on cost logic (decimal precision critical); export format must match supplier expectations.
- **Team structure:** Tess designs before code; Danny gates architecture + code quality; Basher owns DevOps from day 1 (CI/CD enables iteration).
- **MVP timeline:** ~40-50 days for public launch (Phases 1-4). Phase 2 runs parallel (UX + backend + DevOps).
- **Key risk:** Cost calculation errors destroy trust. Must use `decimal` type in .NET, validate with Saul early.

### 2026-04-14: EzStem Product Insight
- EzStem is "Bill-of-Materials + Profit Calculator" for florists, NOT a full CRM.
- Core value: eliminates spreadsheet math, prevents underpricing, generates automated purchase orders.
- Intentionally narrow scope is strength (pairs with HoneyBook, Notion, etc.); domain-specific UX is moat.
- Florists work on-site → responsive design critical (tablet-first UX consideration).

### 2026-04-14: Key Decisions Locked In
- **Stack:** Angular (frontend), .NET 9 (backend), Azure SQL, Azure App Service (non-negotiable per Alec's constraints).
- **Domain entities:** Item, Vendor, Recipe, RecipeItem, FloristEvent, EventRecipe, Order, OrderLineItem (scaffolded by Danny).
- **Auth:** Postponed to Phase 4 or P2 (not MVP blocker).
- **Database design:** Soft delete pattern (IsDeleted, DeletedAt) on aggregates; decimal types for all costs; indexes on vendor + event date.
- **Export format:** Must validate with Saul (CSV vendor-grouped); PDF optional in P1.
