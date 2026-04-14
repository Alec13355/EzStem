using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class RecipeServiceTests
{
    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    [Fact]
    public async Task GetRecipeCost_CalculatesCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = new RecipeService(context);

        var item1 = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25 };
        var item2 = new Item { Id = Guid.NewGuid(), Name = "Tulip", CostPerStem = 0.3m, BundleSize = 10 };
        context.Items.AddRange(item1, item2);

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            Name = "Bridal Bouquet",
            LaborCost = 10.0m
        };
        context.Recipes.Add(recipe);

        context.RecipeItems.AddRange(
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item1.Id, Quantity = 12, CostPerStem = 0.5m },
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item2.Id, Quantity = 5, CostPerStem = 0.3m }
        );

        await context.SaveChangesAsync();

        var result = await service.GetRecipeCostAsync(recipe.Id);

        Assert.NotNull(result);
        Assert.Equal(7.5m, result.ItemsCost); // (12 * 0.5) + (5 * 0.3) = 6 + 1.5 = 7.5
        Assert.Equal(10.0m, result.LaborCost);
        Assert.Equal(17.5m, result.TotalCost); // 7.5 + 10.0 = 17.5
    }

    [Fact]
    public async Task ScaleRecipe_MultipliesQuantitiesCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = new RecipeService(context);

        var item = new Item { Id = Guid.NewGuid(), Name = "Rose", CostPerStem = 0.5m, BundleSize = 25 };
        context.Items.Add(item);

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            Name = "Bridal Bouquet",
            LaborCost = 10.0m
        };
        context.Recipes.Add(recipe);

        context.RecipeItems.Add(
            new RecipeItem { Id = Guid.NewGuid(), RecipeId = recipe.Id, ItemId = item.Id, Quantity = 12, CostPerStem = 0.5m }
        );

        await context.SaveChangesAsync();

        var result = await service.ScaleRecipeAsync(recipe.Id, 5);

        Assert.NotNull(result);
        Assert.Equal(5, result.ScaleFactor);
        Assert.Single(result.ScaledItems);
        Assert.Equal(60m, result.ScaledItems.First().Quantity); // 12 * 5 = 60
        Assert.Equal(30.0m, result.TotalItemsCost); // 60 * 0.5 = 30
    }
}
