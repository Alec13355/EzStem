using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.API.Infrastructure;

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
