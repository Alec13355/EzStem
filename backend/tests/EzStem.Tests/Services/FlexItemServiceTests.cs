using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class FlexItemServiceTests
{
    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private async Task<(FloristEvent evt, Item item, Vendor vendor)> SeedBaseDataAsync(EzStemDbContext context)
    {
        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 1.50m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30) };
        context.Events.Add(evt);

        await context.SaveChangesAsync();
        return (evt, item, vendor);
    }

    [Fact]
    public async Task AddFlexItem_ToEvent_ReturnsFlexItemResponse()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, item, vendor) = await SeedBaseDataAsync(context);

        var request = new AddFlexItemRequest(item.Id, 10m, "Extra roses for arch");
        var result = await service.AddFlexItemAsync(evt.Id, request);

        Assert.NotNull(result);
        Assert.Equal(evt.Id, result.EventId);
        Assert.Equal(item.Id, result.ItemId);
        Assert.Equal("Rose", result.ItemName);
        Assert.Equal(10m, result.QuantityNeeded);
        Assert.Equal("Extra roses for arch", result.Notes);
        Assert.Equal(vendor.Id, result.VendorId);
        Assert.Equal("Test Vendor", result.VendorName);
    }

    [Fact]
    public async Task GetFlexItems_ForEvent_ReturnsAllItems()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, item, _) = await SeedBaseDataAsync(context);

        await service.AddFlexItemAsync(evt.Id, new AddFlexItemRequest(item.Id, 5m, null));
        await service.AddFlexItemAsync(evt.Id, new AddFlexItemRequest(item.Id, 10m, "Extra"));

        var results = await service.GetFlexItemsAsync(evt.Id);

        Assert.Equal(2, results.Count());
    }

    [Fact]
    public async Task DeleteFlexItem_NonExistent_ReturnsFalse()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, _, _) = await SeedBaseDataAsync(context);

        var result = await service.DeleteFlexItemAsync(evt.Id, Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task AddFlexItem_LineTotalCost_CalculatedCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, item, _) = await SeedBaseDataAsync(context);

        // item.CostPerStem = 1.50m, quantity = 12 → expected total = 18.00
        var result = await service.AddFlexItemAsync(evt.Id, new AddFlexItemRequest(item.Id, 12m, null));

        Assert.Equal(1.50m, result.CostPerStem);
        Assert.Equal(18.00m, result.LineTotalCost);
    }

    [Fact]
    public async Task DeleteFlexItem_ExistingItem_ReturnsTrueAndRemoves()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, item, _) = await SeedBaseDataAsync(context);

        var added = await service.AddFlexItemAsync(evt.Id, new AddFlexItemRequest(item.Id, 5m, null));
        var deleted = await service.DeleteFlexItemAsync(evt.Id, added.Id);
        var remaining = await service.GetFlexItemsAsync(evt.Id);

        Assert.True(deleted);
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task UpdateFlexItem_QuantityAndNotes_Persists()
    {
        using var context = CreateInMemoryContext();
        var service = new FlexItemService(context);
        var (evt, item, _) = await SeedBaseDataAsync(context);

        var added = await service.AddFlexItemAsync(evt.Id, new AddFlexItemRequest(item.Id, 5m, "original"));
        var updated = await service.UpdateFlexItemAsync(evt.Id, added.Id, new UpdateFlexItemRequest(20m, "updated"));

        Assert.NotNull(updated);
        Assert.Equal(20m, updated!.QuantityNeeded);
        Assert.Equal("updated", updated.Notes);
        Assert.Equal(30.00m, updated.LineTotalCost); // 20 * 1.50
    }
}
