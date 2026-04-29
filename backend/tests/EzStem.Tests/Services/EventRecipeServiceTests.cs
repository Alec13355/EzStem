using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class EventRecipeServiceTests
{
    private const string TestOwnerId = "owner-123";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private static FloristEvent CreateEvent()
    {
        return new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Test Event",
            EventDate = DateTime.UtcNow,
            OwnerId = TestOwnerId,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task AddFlowerToRecipeAsync_AddsEntry()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemFlowerService(context);

        var floristEvent = CreateEvent();
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Centerpiece",
            Price = 100m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        var response = await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            item.Id,
            new CreateEventItemFlowerRequest(flower.Id, 4),
            TestOwnerId);

        Assert.Equal(item.Id, response.EventItemId);
        Assert.Equal(flower.Id, response.EventFlowerId);
        Assert.Equal(4, response.StemsNeeded);
        Assert.Equal("Rose", response.EventFlowerName);
    }

    [Fact]
    public async Task GetRecipeAsync_ReturnsEntriesForItem()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemFlowerService(context);

        var floristEvent = CreateEvent();
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Centerpiece",
            Price = 100m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            item.Id,
            new CreateEventItemFlowerRequest(flower.Id, 4),
            TestOwnerId);

        var result = (await service.GetRecipeAsync(floristEvent.Id, item.Id, TestOwnerId)).ToList();

        Assert.Single(result);
        Assert.Equal(4, result[0].StemsNeeded);
    }

    [Fact]
    public async Task UpdateRecipeEntryAsync_UpdatesStemsNeeded()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemFlowerService(context);

        var floristEvent = CreateEvent();
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Centerpiece",
            Price = 100m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        var entry = await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            item.Id,
            new CreateEventItemFlowerRequest(flower.Id, 4),
            TestOwnerId);

        var response = await service.UpdateRecipeEntryAsync(
            floristEvent.Id,
            item.Id,
            entry.Id,
            new UpdateEventItemFlowerRequest(6),
            TestOwnerId);

        Assert.NotNull(response);
        Assert.Equal(6, response!.StemsNeeded);
    }

    [Fact]
    public async Task DeleteRecipeEntryAsync_DeletesEntry()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemFlowerService(context);

        var floristEvent = CreateEvent();
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Centerpiece",
            Price = 100m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        var entry = await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            item.Id,
            new CreateEventItemFlowerRequest(flower.Id, 4),
            TestOwnerId);

        var deleted = await service.DeleteRecipeEntryAsync(
            floristEvent.Id,
            item.Id,
            entry.Id,
            TestOwnerId);
        var result = await service.GetRecipeAsync(floristEvent.Id, item.Id, TestOwnerId);

        Assert.True(deleted);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetEventRecipeSummaryAsync_CalculatesBundleMathCorrectly()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemFlowerService(context);

        var floristEvent = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Test Event",
            EventDate = DateTime.UtcNow,
            OwnerId = TestOwnerId,
            TotalBudget = 1000m,
            ProfitMultiple = 2.5m,
            CreatedAt = DateTime.UtcNow
        };
        var bouquet = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Bouquet",
            Price = 50m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var centerpiece = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Centerpiece",
            Price = 100m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow.AddMinutes(1),
            UpdatedAt = DateTime.UtcNow.AddMinutes(1)
        };
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2.00m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.AddRange(bouquet, centerpiece);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            bouquet.Id,
            new CreateEventItemFlowerRequest(flower.Id, 6),
            TestOwnerId);
        await service.AddFlowerToRecipeAsync(
            floristEvent.Id,
            centerpiece.Id,
            new CreateEventItemFlowerRequest(flower.Id, 4),
            TestOwnerId);

        var summary = await service.GetEventRecipeSummaryAsync(floristEvent.Id, TestOwnerId);

        Assert.Equal(400m, summary.FlowerBudget);
        Assert.Equal(150m, summary.TotalRevenue);
        Assert.Equal(20.00m, summary.TotalFlowerCost);

        var bouquetSummary = summary.Items.Single(item => item.ItemName == "Bouquet");
        var bouquetLineItem = Assert.Single(bouquetSummary.Flowers);
        Assert.Equal(6, bouquetLineItem.TotalStemsNeeded);
        Assert.Equal(1, bouquetLineItem.BunchesNeeded);
        Assert.Equal(20.00m, bouquetLineItem.TotalCost);

        var centerpieceSummary = summary.Items.Single(item => item.ItemName == "Centerpiece");
        var centerpieceLineItem = Assert.Single(centerpieceSummary.Flowers);
        Assert.Equal(4, centerpieceLineItem.TotalStemsNeeded);
        Assert.Equal(1, centerpieceLineItem.BunchesNeeded);
        Assert.Equal(20.00m, centerpieceLineItem.TotalCost);

        var procurement = Assert.Single(summary.FlowerProcurement);
        Assert.Equal(flower.Id, procurement.EventFlowerId);
        Assert.Equal(10, procurement.TotalStemsNeeded);
        Assert.Equal(1, procurement.BunchesNeeded);
        Assert.Equal(20.00m, procurement.TotalCost);
    }
}
