# EzStem

> Profit-aware floral design planning and automated procurement tool.

## Stack

- **Frontend:** Angular 17+ (TypeScript, SCSS, Angular Material)
- **Backend:** .NET 9 Web API (Clean Architecture)
- **Database:** Azure SQL (Entity Framework Core)
- **Hosting:** Azure App Service + Azure SQL Database
- **CI/CD:** GitHub Actions → Azure

## Project Structure

```
EzStem/
├── frontend/          # Angular application
├── backend/           # .NET 9 Clean Architecture
│   ├── src/
│   │   ├── EzStem.Domain/          # Entities, enums (no dependencies)
│   │   ├── EzStem.Application/     # Use cases, DTOs, interfaces
│   │   ├── EzStem.Infrastructure/  # EF Core, repos, Azure services
│   │   └── EzStem.API/             # ASP.NET Core Web API
│   └── tests/
│       └── EzStem.Tests/           # xUnit test suite
└── docker-compose.yml # Local dev with SQL Server
```

## Local Development

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- Docker Desktop (for local SQL Server)

### Backend
```bash
docker-compose up db -d          # Start SQL Server
cd backend
dotnet run --project src/EzStem.API
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Frontend
```bash
cd frontend
npm install
npm start
# App: http://localhost:4200
```

## Domain Model

| Entity | Description |
|--------|-------------|
| Item | Flower/material in the catalog |
| Vendor | Flower supplier |
| Recipe | Bill-of-materials for an arrangement |
| RecipeItem | Stem + quantity in a recipe |
| FloristEvent | Wedding/event with attached recipes |
| EventRecipe | Recipe + quantity for an event |
| Order | Aggregated purchase order for an event |
| OrderLineItem | Individual item in an order, grouped by vendor |
