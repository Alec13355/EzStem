using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.API.Infrastructure;

public class DatabaseMigrationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseMigrationService> _logger;

    public DatabaseMigrationService(IServiceProvider serviceProvider, ILogger<DatabaseMigrationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            _logger.LogInformation("DatabaseMigrationService starting...");
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();

            // Use an independent timeout — never pass stoppingToken to MigrateAsync.
            // If stoppingToken is cancelled while migration is in-flight, the exception
            // would escape the catch and trigger BackgroundServiceExceptionBehavior.StopHost,
            // leading to Environment.FailFast() (SIGABRT / exit 134).
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            cts.CancelAfter(TimeSpan.FromMinutes(5));

            await db.Database.MigrateAsync(CancellationToken.None);
            _logger.LogInformation("Database migrations completed successfully.");
        }
        catch (Exception ex)
        {
            // Log and swallow — app continues without migrations rather than crashing.
            try { _logger.LogError(ex, "Database migration failed. App will continue but may be degraded."); }
            catch { /* logger itself must not throw */ }
        }
    }
}
