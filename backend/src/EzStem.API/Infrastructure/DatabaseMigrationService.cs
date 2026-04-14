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
        _logger.LogInformation("Running database migrations...");
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();
            await db.Database.MigrateAsync(stoppingToken);
            _logger.LogInformation("Database migrations complete.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database migration failed. Application will continue but may be unstable.");
        }
    }
}
