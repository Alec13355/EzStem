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

