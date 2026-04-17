using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class OrderExportTests
{
    private const string TestOwnerId = "test-user-123";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    [Fact]
    public async Task GenerateCsv_HeadersPresent()
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
            Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item.Id, VendorId = vendor.Id,
            QuantityNeeded = 90, QuantityOrdered = 100, CostPerUnit = 0.5m
        });
        await context.SaveChangesAsync();

        var csv = await service.GenerateOrderCsvAsync(order.Id, TestOwnerId);

        Assert.Contains("Vendor,Item,BundleSize,BundlesOrdered,TotalStems,UnitCost,TotalCost", csv);
    }

    [Fact]
    public async Task GenerateCsv_VendorGroupingCorrect()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor1 = new Vendor { Id = Guid.NewGuid(), Name = "Vendor A" };
        var vendor2 = new Vendor { Id = Guid.NewGuid(), Name = "Vendor B" };
        context.Vendors.AddRange(vendor1, vendor2);

        var item1 = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor1.Id };
        var item2 = new Item { Id = Guid.NewGuid(), Name = "Lily", CostPerStem = 1.0m, BundleSize = 10, VendorId = vendor2.Id };
        context.Items.AddRange(item1, item2);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30), OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var order = new Order { Id = Guid.NewGuid(), EventId = evt.Id, Status = OrderStatus.Draft, OwnerId = TestOwnerId };
        context.Orders.Add(order);

        context.OrderLineItems.AddRange(
            new OrderLineItem { Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item1.Id, VendorId = vendor1.Id, QuantityNeeded = 90, QuantityOrdered = 100, CostPerUnit = 0.5m },
            new OrderLineItem { Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item2.Id, VendorId = vendor2.Id, QuantityNeeded = 15, QuantityOrdered = 20, CostPerUnit = 1.0m }
        );
        await context.SaveChangesAsync();

        var csv = await service.GenerateOrderCsvAsync(order.Id, TestOwnerId);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var vendorAIndex = Array.FindIndex(lines, l => l.Contains("Vendor A"));
        var vendorBIndex = Array.FindIndex(lines, l => l.Contains("Vendor B"));

        Assert.True(vendorAIndex < vendorBIndex, "Vendors should be alphabetically ordered");
    }

    [Fact]
    public async Task GenerateCsv_TotalsCorrect()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Test Vendor" };
        context.Vendors.Add(vendor);

        var item1 = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 2.50m, BundleSize = 25, VendorId = vendor.Id };
        var item2 = new Item { Id = Guid.NewGuid(), Name = "Lily", CostPerStem = 1.20m, BundleSize = 10, VendorId = vendor.Id };
        context.Items.AddRange(item1, item2);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Wedding", EventDate = DateTime.UtcNow.AddDays(30), OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var order = new Order { Id = Guid.NewGuid(), EventId = evt.Id, Status = OrderStatus.Draft, OwnerId = TestOwnerId };
        context.Orders.Add(order);

        context.OrderLineItems.AddRange(
            new OrderLineItem { Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item1.Id, VendorId = vendor.Id, QuantityNeeded = 70, QuantityOrdered = 75, CostPerUnit = 2.50m },
            new OrderLineItem { Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item2.Id, VendorId = vendor.Id, QuantityNeeded = 18, QuantityOrdered = 20, CostPerUnit = 1.20m }
        );
        await context.SaveChangesAsync();

        var csv = await service.GenerateOrderCsvAsync(order.Id, TestOwnerId);

        // Total should be: (75 * 2.50) + (20 * 1.20) = 187.50 + 24.00 = 211.50
        var expectedTotal = (75 * 2.50m) + (20 * 1.20m);
        Assert.Contains($"TOTAL,,,,,,${expectedTotal:F2}", csv);
    }

    [Fact]
    public async Task GenerateCsv_DecimalFormattingCorrect()
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
            Id = Guid.NewGuid(), OrderId = order.Id, ItemId = item.Id, VendorId = vendor.Id,
            QuantityNeeded = 90, QuantityOrdered = 100, CostPerUnit = 0.5m
        });
        await context.SaveChangesAsync();

        var csv = await service.GenerateOrderCsvAsync(order.Id, TestOwnerId);

        Assert.Contains("$0.50", csv);
        Assert.Contains("$50.00", csv);
    }
}
