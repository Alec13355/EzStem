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
        await RunMigrationsAsync(_serviceProvider, _logger);
    }

    public static async Task RunMigrationsAsync(IServiceProvider serviceProvider, ILogger logger)
    {
        try
        {
            logger.LogInformation("DatabaseMigrationService starting...");
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EzStemDbContext>();

            await db.Database.MigrateAsync(CancellationToken.None);
            await EnsureOwnerIdSchemaAsync(db);
            logger.LogInformation("Database migrations completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database migration failed: {Message}", ex.Message);
        }
    }

    public static async Task EnsureOwnerIdSchemaAsync(EzStemDbContext db)
    {
        const string sql = @"
IF COL_LENGTH('Items', 'OwnerId') IS NULL
BEGIN
    ALTER TABLE [Items] ADD [OwnerId] nvarchar(450) NULL;
END;
IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.objects o ON c.object_id = o.object_id
    WHERE o.name = 'Items' AND c.name = 'OwnerId' AND c.max_length = -1
)
BEGIN
    ALTER TABLE [Items] ALTER COLUMN [OwnerId] nvarchar(450) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Items_OwnerId' AND object_id = OBJECT_ID('Items'))
BEGIN
    CREATE INDEX [IX_Items_OwnerId] ON [Items]([OwnerId]);
END;

IF COL_LENGTH('Recipes', 'OwnerId') IS NULL
BEGIN
    ALTER TABLE [Recipes] ADD [OwnerId] nvarchar(450) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Recipes_OwnerId' AND object_id = OBJECT_ID('Recipes'))
BEGIN
    CREATE INDEX [IX_Recipes_OwnerId] ON [Recipes]([OwnerId]);
END;

IF COL_LENGTH('Events', 'OwnerId') IS NULL
BEGIN
    ALTER TABLE [Events] ADD [OwnerId] nvarchar(450) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Events_OwnerId' AND object_id = OBJECT_ID('Events'))
BEGIN
    CREATE INDEX [IX_Events_OwnerId] ON [Events]([OwnerId]);
END;

IF COL_LENGTH('Orders', 'OwnerId') IS NULL
BEGIN
    ALTER TABLE [Orders] ADD [OwnerId] nvarchar(450) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_OwnerId' AND object_id = OBJECT_ID('Orders'))
BEGIN
    CREATE INDEX [IX_Orders_OwnerId] ON [Orders]([OwnerId]);
END;

IF COL_LENGTH('PricingConfigs', 'OwnerId') IS NULL
BEGIN
    ALTER TABLE [PricingConfigs] ADD [OwnerId] nvarchar(450) NULL;
END;
IF COL_LENGTH('PricingConfigs', 'DefaultMarkupPercentage') IS NULL
BEGIN
    ALTER TABLE [PricingConfigs]
    ADD [DefaultMarkupPercentage] decimal(18,4) NOT NULL
        CONSTRAINT [DF_PricingConfigs_DefaultMarkupPercentage] DEFAULT (35.0);
END;
IF COL_LENGTH('PricingConfigs', 'DefaultLaborRate') IS NULL
BEGIN
    ALTER TABLE [PricingConfigs]
    ADD [DefaultLaborRate] decimal(18,4) NOT NULL
        CONSTRAINT [DF_PricingConfigs_DefaultLaborRate] DEFAULT (25.0);
END;
IF COL_LENGTH('PricingConfigs', 'MarkupFactor') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('PricingConfigs') AND c.name = 'MarkupFactor'
)
BEGIN
    ALTER TABLE [PricingConfigs]
    ADD CONSTRAINT [DF_PricingConfigs_MarkupFactor] DEFAULT (3.0) FOR [MarkupFactor];
END;
IF COL_LENGTH('PricingConfigs', 'OverheadPercent') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('PricingConfigs') AND c.name = 'OverheadPercent'
)
BEGIN
    ALTER TABLE [PricingConfigs]
    ADD CONSTRAINT [DF_PricingConfigs_OverheadPercent] DEFAULT (0.25) FOR [OverheadPercent];
END;
IF COL_LENGTH('PricingConfigs', 'LaborDefaultCost') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('PricingConfigs') AND c.name = 'LaborDefaultCost'
)
BEGIN
    ALTER TABLE [PricingConfigs]
    ADD CONSTRAINT [DF_PricingConfigs_LaborDefaultCost] DEFAULT (5.0) FOR [LaborDefaultCost];
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PricingConfigs_OwnerId' AND object_id = OBJECT_ID('PricingConfigs'))
BEGIN
    CREATE INDEX [IX_PricingConfigs_OwnerId] ON [PricingConfigs]([OwnerId]);
END;
";

        await db.Database.ExecuteSqlRawAsync(sql);
    }
}
