using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class OrderServiceTests
{
    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    [Fact]
    public async Task GenerateOrder_RoundsBundleSizesCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Flower Vendor" };
        context.Vendors.Add(vendor);

        var rose = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        var hydrangea = new Item { Id = Guid.NewGuid(), Name = "Hydrangea", CostPerStem = 2.0m, BundleSize = 10, VendorId = vendor.Id };
        context.Items.AddRange(rose, hydrangea);

        var recipe = new Recipe { Id = Guid.NewGuid(), Name = "Centerpiece", LaborCost = 5.0m };
        context.Recipes.Add(recipe);

        context.RecipeItems.AddRange(
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = rose.Id, Quantity = 15, CostPerStem = 0.5m },
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = hydrangea.Id, Quantity = 3, CostPerStem = 2.0m }
        );

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Wedding",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        context.EventRecipes.Add(
            new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe.Id, Quantity = 10 }
        );

        await context.SaveChangesAsync();

        var result = await service.GenerateOrderAsync(evt.Id);

        Assert.NotNull(result);
        Assert.Equal(2, result.LineItems.Count());

        var roseLineItem = result.LineItems.First(li => li.ItemName == "Rose");
        Assert.Equal(150m, roseLineItem.QuantityNeeded); // 15 * 10
        Assert.Equal(6, roseLineItem.BundlesNeeded); // ceil(150 / 25) = 6
        Assert.Equal(150m, roseLineItem.QuantityOrdered); // 6 * 25 = 150

        var hydrangeaLineItem = result.LineItems.First(li => li.ItemName == "Hydrangea");
        Assert.Equal(30m, hydrangeaLineItem.QuantityNeeded); // 3 * 10
        Assert.Equal(3, hydrangeaLineItem.BundlesNeeded); // ceil(30 / 10) = 3
        Assert.Equal(30m, hydrangeaLineItem.QuantityOrdered); // 3 * 10 = 30
    }

    [Fact]
    public async Task GenerateOrder_GroupsByVendor()
    {
        using var context = CreateInMemoryContext();
        var service = new OrderService(context);

        var vendor1 = new Vendor { Id = Guid.NewGuid(), Name = "Vendor A" };
        var vendor2 = new Vendor { Id = Guid.NewGuid(), Name = "Vendor B" };
        context.Vendors.AddRange(vendor1, vendor2);

        var item1 = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor1.Id };
        var item2 = new Item { Id = Guid.NewGuid(), Name = "Hydrangea", CostPerStem = 2.0m, BundleSize = 10, VendorId = vendor2.Id };
        context.Items.AddRange(item1, item2);

        var recipe = new Recipe { Id = Guid.NewGuid(), Name = "Arrangement", LaborCost = 5.0m };
        context.Recipes.Add(recipe);

        context.RecipeItems.AddRange(
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item1.Id, Quantity = 10, CostPerStem = 0.5m },
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item2.Id, Quantity = 5, CostPerStem = 2.0m }
        );

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Event",
            EventDate = DateTime.UtcNow.AddDays(30)
        };
        context.Events.Add(evt);

        context.EventRecipes.Add(
            new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe.Id, Quantity = 1 }
        );

        await context.SaveChangesAsync();

        var result = await service.GenerateOrderAsync(evt.Id);

        Assert.NotNull(result);
        Assert.Equal(2, result.ByVendor.Count());

        var vendorAGroup = result.ByVendor.First(g => g.VendorName == "Vendor A");
        Assert.Single(vendorAGroup.Items);

        var vendorBGroup = result.ByVendor.First(g => g.VendorName == "Vendor B");
        Assert.Single(vendorBGroup.Items);
    }
}
