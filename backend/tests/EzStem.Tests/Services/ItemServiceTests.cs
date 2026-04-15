using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class ItemServiceTests
{
    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private const string TestOwnerId = "test-user-001";

    [Fact]
    public async Task GetItems_ReturnsPagedResults()
    {
        using var context = CreateInMemoryContext();
        var service = new ItemService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        context.Items.AddRange(
            new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id, OwnerId = TestOwnerId },
            new Item { Id = Guid.NewGuid(), Name = "Tulip", CostPerStem = 0.3m, BundleSize = 10, OwnerId = TestOwnerId }
        );
        await context.SaveChangesAsync();

        var result = await service.GetItemsAsync(1, 10, null, TestOwnerId);

        Assert.Equal(2, result.Total);
        Assert.Equal(2, result.Items.Count());
    }

    [Fact]
    public async Task CreateItem_ValidatesNameRequired()
    {
        using var context = CreateInMemoryContext();
        var service = new ItemService(context);

        var request = new CreateItemRequest("", null, 0.5m, 25, null, null, null);

        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await service.CreateItemAsync(request, TestOwnerId));
    }

    [Fact]
    public async Task CreateItem_ValidatesCostGreaterThanZero()
    {
        using var context = CreateInMemoryContext();
        var service = new ItemService(context);

        var request = new CreateItemRequest("Rose", null, 0m, 25, null, null, null);

        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await service.CreateItemAsync(request, TestOwnerId));
    }

    [Fact]
    public async Task DeleteItem_SoftDeletes()
    {
        using var context = CreateInMemoryContext();
        var service = new ItemService(context);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, OwnerId = TestOwnerId };
        context.Items.Add(item);
        await context.SaveChangesAsync();

        var deleted = await service.DeleteItemAsync(item.Id, TestOwnerId);

        Assert.True(deleted);

        context.ChangeTracker.Clear();
        var deletedItem = await context.Items.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == item.Id);
        Assert.NotNull(deletedItem);
        Assert.True(deletedItem.IsDeleted);
        Assert.NotNull(deletedItem.DeletedAt);
    }

    [Fact]
    public async Task GetItems_FiltersDeletedItems()
    {
        using var context = CreateInMemoryContext();
        var service = new ItemService(context);

        context.Items.AddRange(
            new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, IsDeleted = false, OwnerId = TestOwnerId },
            new Item { Id = Guid.NewGuid(), Name = "Tulip", CostPerStem = 0.3m, BundleSize = 10, IsDeleted = true, DeletedAt = DateTime.UtcNow, OwnerId = TestOwnerId }
        );
        await context.SaveChangesAsync();

        var result = await service.GetItemsAsync(1, 10, null, TestOwnerId);

        Assert.Equal(1, result.Total);
        Assert.Single(result.Items);
    }
}
