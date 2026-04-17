using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class ProductionSheetTests
{
    private const string TestOwnerId = "test-user-123";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private IEventService CreateService(EzStemDbContext context)
    {
        var recipeService = new RecipeService(context);
        return new EventService(context, recipeService);
    }

    [Fact]
    public async Task GetProductionSheet_OneRecipeOneItem_ReturnsCorrectQuantities()
    {
        using var context = CreateInMemoryContext();
        var service = CreateService(context);

        var vendor = new Vendor { Id = Guid.NewGuid(), Name = "Flower Co" };
        context.Vendors.Add(vendor);

        var item = new Item { Id = Guid.NewGuid(), Name = "Red Rose", CostPerStem = 0.5m, BundleSize = 25, VendorId = vendor.Id };
        context.Items.Add(item);

        var recipe = new Recipe { Id = Guid.NewGuid(), Name = "Bridal Bouquet", OwnerId = TestOwnerId };
        context.Recipes.Add(recipe);

        var recipeItem = new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item.Id, Quantity = 12, CostPerStem = 0.5m };
        context.RecipeItems.Add(recipeItem);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Spring Wedding", EventDate = DateTime.UtcNow.AddDays(30), ClientName = "Alice", OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var eventRecipe = new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe.Id, Quantity = 2 };
        context.EventRecipes.Add(eventRecipe);

        await context.SaveChangesAsync();

        var result = await service.GetProductionSheetAsync(evt.Id, TestOwnerId);

        Assert.NotNull(result);
        Assert.Equal(evt.Id, result.EventId);
        Assert.Equal("Spring Wedding", result.EventName);
        Assert.Equal("Alice", result.ClientName);
        Assert.Single(result.Recipes);

        var sheetRecipe = result.Recipes.First();
        Assert.Equal("Bridal Bouquet", sheetRecipe.RecipeName);
        Assert.Equal(2, sheetRecipe.Quantity);
        Assert.Single(sheetRecipe.Items);

        var lineItem = sheetRecipe.Items.First();
        Assert.Equal("Red Rose", lineItem.ItemName);
        Assert.Equal("Flower Co", lineItem.VendorName);
        Assert.Equal(24, lineItem.QuantityNeeded); // 12 * 2
        Assert.Equal("stems", lineItem.Unit);

        Assert.Equal(24, result.TotalStemCount);
    }

    [Fact]
    public async Task GetProductionSheet_TwoRecipes_QuantitiesMultiplyCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = CreateService(context);

        var item1 = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25 };
        var item2 = new Item { Id = Guid.NewGuid(), Name = "Lily", CostPerStem = 0.8m, BundleSize = 10 };
        context.Items.AddRange(item1, item2);

        var recipe1 = new Recipe { Id = Guid.NewGuid(), Name = "Bouquet A", OwnerId = TestOwnerId };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), Name = "Centerpiece B", OwnerId = TestOwnerId };
        context.Recipes.AddRange(recipe1, recipe2);

        var ri1 = new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe1.Id, ItemId = item1.Id, Quantity = 10, CostPerStem = 0.5m };
        var ri2 = new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe2.Id, ItemId = item2.Id, Quantity = 5, CostPerStem = 0.8m };
        context.RecipeItems.AddRange(ri1, ri2);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Gala", EventDate = DateTime.UtcNow.AddDays(60), OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var er1 = new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe1.Id, Quantity = 3 };
        var er2 = new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe2.Id, Quantity = 4 };
        context.EventRecipes.AddRange(er1, er2);

        await context.SaveChangesAsync();

        var result = await service.GetProductionSheetAsync(evt.Id, TestOwnerId);

        Assert.NotNull(result);
        Assert.Equal(2, result.Recipes.Count());

        var bouquetA = result.Recipes.First(r => r.RecipeName == "Bouquet A");
        var centerpieceB = result.Recipes.First(r => r.RecipeName == "Centerpiece B");

        Assert.Equal(30, bouquetA.Items.First().QuantityNeeded);  // 10 * 3
        Assert.Equal(20, centerpieceB.Items.First().QuantityNeeded);  // 5 * 4

        Assert.Equal(50, result.TotalStemCount); // 30 + 20
    }

    [Fact]
    public async Task GetProductionSheet_NonExistentEvent_ReturnsNull()
    {
        using var context = CreateInMemoryContext();
        var service = CreateService(context);

        var result = await service.GetProductionSheetAsync(Guid.NewGuid(), TestOwnerId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetProductionSheet_MultipleQuantitiesSameRecipe_StacksCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = CreateService(context);

        var item = new Item { Id = Guid.NewGuid(), Name = "Peony", CostPerStem = 1.2m, BundleSize = 10 };
        context.Items.Add(item);

        var recipe = new Recipe { Id = Guid.NewGuid(), Name = "Table Arrangement", Description = "Use fresh peonies", OwnerId = TestOwnerId };
        context.Recipes.Add(recipe);

        var recipeItem = new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item.Id, Quantity = 8, CostPerStem = 1.2m };
        context.RecipeItems.Add(recipeItem);

        var evt = new FloristEvent { Id = Guid.NewGuid(), Name = "Anniversary Party", EventDate = DateTime.UtcNow.AddDays(14), OwnerId = TestOwnerId };
        context.Events.Add(evt);

        var eventRecipe = new EventRecipe { Id = Guid.NewGuid(), EventId = evt.Id, RecipeId = recipe.Id, Quantity = 10 };
        context.EventRecipes.Add(eventRecipe);

        await context.SaveChangesAsync();

        var result = await service.GetProductionSheetAsync(evt.Id, TestOwnerId);

        Assert.NotNull(result);
        Assert.Single(result.Recipes);

        var sheetRecipe = result.Recipes.First();
        Assert.Equal(10, sheetRecipe.Quantity);
        Assert.Equal(80, sheetRecipe.Items.First().QuantityNeeded); // 8 * 10
        Assert.Equal("Use fresh peonies", sheetRecipe.Notes);

        Assert.Equal(80, result.TotalStemCount);
    }
}
