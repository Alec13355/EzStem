using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class WasteServiceTests
{
    private const string TestOwnerId = "test-user-123";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private (FloristEvent evt, Order order, OrderLineItem lineItem) CreateOrderWithLineItem(EzStemDbContext context, decimal quantityOrdered)
    {
        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30), OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var order = new Order { Id = Guid.NewGuid(), EventId = evt.Id, Status = OrderStatus.Draft, OwnerId = TestOwnerId };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item.Id,
            VendorId = vendor.Id, QuantityNeeded = quantityOrdered * 0.9m, QuantityOrdered = quantityOrdered, CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        return (evt, order, lineItem);
    }

    [Fact]
    public async Task CalculateWaste_CorrectPercentage()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var (_, order, lineItem) = CreateOrderWithLineItem(context, 100);
        lineItem.QuantityNeeded = 90;
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 85);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(85, result.TotalStemsUsed);
        Assert.Equal(15, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
        Assert.Equal(0.90m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("Minor waste") && s.Contains("15"));
    }

    [Fact]
    public async Task CalculateWaste_LowCategory()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var (_, order, lineItem) = CreateOrderWithLineItem(context, 100);
        lineItem.QuantityNeeded = 90;
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 95);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(95, result.TotalStemsUsed);
        Assert.Equal(5, result.WastePercentage);
        Assert.Equal("Low", result.WasteCategory);
        Assert.Equal(0.95m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("Good efficiency"));
    }

    [Fact]
    public async Task CalculateWaste_HighCategory()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var (_, order, lineItem) = CreateOrderWithLineItem(context, 100);
        lineItem.QuantityNeeded = 90;
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 75);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(75, result.TotalStemsUsed);
        Assert.Equal(25, result.WastePercentage);
        Assert.Equal("High", result.WasteCategory);
        Assert.Equal(0.82m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("25") && s.Contains("15%"));
    }

    [Fact]
    public async Task CalculateWaste_BoundaryCase_Exactly10Percent()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var (_, order, lineItem) = CreateOrderWithLineItem(context, 100);
        lineItem.QuantityNeeded = 90;
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 90);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(90, result.TotalStemsUsed);
        Assert.Equal(10, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
        Assert.Equal(0.90m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("Minor waste") && s.Contains("10"));
    }

    [Fact]
    public async Task CalculateWaste_BoundaryCase_Exactly20Percent()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var (_, order, lineItem) = CreateOrderWithLineItem(context, 100);
        lineItem.QuantityNeeded = 90;
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 80);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(80, result.TotalStemsUsed);
        Assert.Equal(20, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
        Assert.Equal(0.90m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("Minor waste") && s.Contains("20"));
    }

    [Fact]
    public async Task CalculateWaste_HighWaste_GeneratesTwoSuggestionsAndMultiplier075()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);
        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);
        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30), OwnerId = TestOwnerId };
        context.Events.Add(evt);
        var order = new Order { Id = Guid.NewGuid(), EventId = evt.Id, Status = OrderStatus.Draft, OwnerId = TestOwnerId };
        context.Orders.Add(order);
        context.OrderLineItems.Add(new OrderLineItem
        {
            Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item.Id,
            VendorId = vendor.Id, QuantityNeeded = 60, QuantityOrdered = 100, CostPerUnit = 0.5m
        });
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 65);

        Assert.Equal(35, result.WastePercentage);
        Assert.Equal(0.75m, result.RecommendedQuantityMultiplier);
        var suggestions = result.OptimizationSuggestions.ToList();
        Assert.Equal(2, suggestions.Count);
        Assert.Contains(suggestions, s => s.Contains("35") && s.Contains("20%"));
        Assert.Contains(suggestions, s => s.Contains("recipe quantities"));
    }

    [Fact]
    public async Task CalculateWaste_ExcellentEfficiency_GivesMultiplier10AndCorrectSuggestion()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);
        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);
        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);
        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30), OwnerId = TestOwnerId };
        context.Events.Add(evt);
        var order = new Order { Id = Guid.NewGuid(), EventId = evt.Id, Status = OrderStatus.Draft, OwnerId = TestOwnerId };
        context.Orders.Add(order);
        context.OrderLineItems.Add(new OrderLineItem
        {
            Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item.Id,
            VendorId = vendor.Id, QuantityNeeded = 97, QuantityOrdered = 100, CostPerUnit = 0.5m
        });
        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, TestOwnerId, 97);

        Assert.Equal(3, result.WastePercentage);
        Assert.Equal(1.0m, result.RecommendedQuantityMultiplier);
        Assert.Contains(result.OptimizationSuggestions, s => s.Contains("Excellent efficiency"));
    }
}
