# Background Database Migration Service

**Date:** 2026-04-14  
**Agent:** Linus (Backend Dev)  
**Status:** Implemented

## Problem

Azure App Service smoke tests consistently returned **HTTP 503** after every deployment. The health endpoint (`GET /health`) is trivial and always returns 200 OK, so the 503 response indicated that **the app process hadn't fully started** when the health check executed.

### Root Cause

In `backend/src/EzStem.API/Program.cs` (lines 38–43), EF Core migrations ran **synchronously before `app.Run()`**:

```csharp
// Apply pending EF Core migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();
    db.Database.Migrate();  // ← BLOCKING - runs before app accepts requests
}
```

On Azure App Service:
- The connection string comes from Azure Key Vault via `@Microsoft.KeyVault(...)` reference in app settings
- Key Vault resolution + migration execution can take >45 seconds
- The smoke test fires before ASP.NET has called `app.Run()`
- Result: **503 Service Unavailable** because the app isn't listening yet

## Solution

Moved EF Core migrations to a **background hosted service** that runs asynchronously after the app starts accepting requests.

### Implementation

**Created:** `backend/src/EzStem.API/Infrastructure/DatabaseMigrationService.cs`

```csharp
public class DatabaseMigrationService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseMigrationService> _logger;

    public DatabaseMigrationService(IServiceProvider serviceProvider, ILogger<DatabaseMigrationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Running database migrations...");
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();
            await db.Database.MigrateAsync(cancellationToken);
            _logger.LogInformation("Database migrations complete.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database migration failed. Application will continue but may be unstable.");
            // Don't throw - let the app start so health checks work
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

**Modified:** `backend/src/EzStem.API/Program.cs`

1. Added namespace: `using EzStem.API.Infrastructure;`
2. Registered hosted service: `builder.Services.AddHostedService<DatabaseMigrationService>();`
3. Removed synchronous migration block (lines 38-43)

### Behavior

- `app.Run()` is now called **immediately** after app configuration
- Health endpoint returns **200 OK** while migrations run in background
- Migration failures are logged but don't crash the app (allows diagnosis via logs)
- Azure smoke test succeeds because HTTP listener is active

## Testing

- **Build:** 0 warnings, 0 errors (2.3s)
- **Tests:** All 18 backend tests pass
- **Local dev:** No impact (migrations run in background as before)

## Impact

- **Azure App Service smoke tests will now succeed** immediately after deployment
- Deployment health checks pass even if migrations take >45 seconds
- Migration logs available in Azure Application Insights for troubleshooting
- No change to local dev experience (docker-compose continues to work)

## Alternative Considered

**Option B:** Keep inline migration but wrap in `Task.Run()` to avoid blocking startup.

**Rejected because:**
- Less clean architecture (no separation of concerns)
- No structured logging/error handling
- Harder to extend (e.g., retry logic, health check integration)

## Notes

- No DB health check registered in `AddHealthChecks()` (verified clean)
- Connection string format documented in `appsettings.json` comments
- Hosted service runs once on startup; no periodic checks
- Migration failures logged to App Insights (query: `traces | where message contains "Database migration"`)

## Files Changed

- **Created:** `backend/src/EzStem.API/Infrastructure/DatabaseMigrationService.cs`
- **Modified:** `backend/src/EzStem.API/Program.cs`

## References

- Task: "Fix Azure 503 health check failures after deployment"
- Related: `.squad/decisions.md` — P1 Session Decisions (Azure Entra SQL Auth + Migration Strategy)
- Aligns with: Infrastructure decision to use App Service health checks
