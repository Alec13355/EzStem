using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class WasteServiceTests
{
    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    [Fact]
    public async Task CalculateWaste_CorrectPercentage()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = evt.Id,
            Status = OrderStatus.Draft
        };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ItemId = item.Id,
            VendorId = vendor.Id,
            QuantityNeeded = 90,
            QuantityOrdered = 100,
            CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, 85);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(85, result.TotalStemsUsed);
        Assert.Equal(15, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
    }

    [Fact]
    public async Task CalculateWaste_LowCategory()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = evt.Id,
            Status = OrderStatus.Draft
        };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ItemId = item.Id,
            VendorId = vendor.Id,
            QuantityNeeded = 90,
            QuantityOrdered = 100,
            CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, 95);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(95, result.TotalStemsUsed);
        Assert.Equal(5, result.WastePercentage);
        Assert.Equal("Low", result.WasteCategory);
    }

    [Fact]
    public async Task CalculateWaste_HighCategory()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = evt.Id,
            Status = OrderStatus.Draft
        };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ItemId = item.Id,
            VendorId = vendor.Id,
            QuantityNeeded = 90,
            QuantityOrdered = 100,
            CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, 75);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(75, result.TotalStemsUsed);
        Assert.Equal(25, result.WastePercentage);
        Assert.Equal("High", result.WasteCategory);
    }

    [Fact]
    public async Task CalculateWaste_BoundaryCase_Exactly10Percent()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = evt.Id,
            Status = OrderStatus.Draft
        };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ItemId = item.Id,
            VendorId = vendor.Id,
            QuantityNeeded = 90,
            QuantityOrdered = 100,
            CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, 90);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(90, result.TotalStemsUsed);
        Assert.Equal(10, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
    }

    [Fact]
    public async Task CalculateWaste_BoundaryCase_Exactly20Percent()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = evt.Id,
            Status = OrderStatus.Draft
        };
        context.Orders.Add(order);

        var lineItem = new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ItemId = item.Id,
            VendorId = vendor.Id,
            QuantityNeeded = 90,
            QuantityOrdered = 100,
            CostPerUnit = 0.5m
        };
        context.OrderLineItems.Add(lineItem);

        await context.SaveChangesAsync();

        var result = await service.CalculateWasteAsync(order.Id, 80);

        Assert.Equal(100, result.TotalStemsOrdered);
        Assert.Equal(80, result.TotalStemsUsed);
        Assert.Equal(20, result.WastePercentage);
        Assert.Equal("Medium", result.WasteCategory);
    }
}
