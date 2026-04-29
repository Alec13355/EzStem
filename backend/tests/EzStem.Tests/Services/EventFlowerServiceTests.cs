using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class EventFlowerServiceTests
{
    private const string TestOwnerId = "owner-123";
    private const string OtherOwnerId = "owner-999";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    private static FloristEvent CreateEvent(string ownerId)
    {
        return new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Test Event",
            EventDate = DateTime.UtcNow,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetFlowersAsync_ReturnsFlowersForEvent()
    {
        using var context = CreateInMemoryContext();
        var service = new EventFlowerService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        context.Events.Add(floristEvent);
        context.EventFlowers.AddRange(
            new EventFlower
            {
                Id = Guid.NewGuid(),
                EventId = floristEvent.Id,
                Name = "Rose",
                PricePerStem = 2.5m,
                BunchSize = 10,
                CreatedAt = DateTime.UtcNow
            },
            new EventFlower
            {
                Id = Guid.NewGuid(),
                EventId = floristEvent.Id,
                Name = "Tulip",
                PricePerStem = 1.5m,
                BunchSize = 5,
                CreatedAt = DateTime.UtcNow.AddMinutes(1)
            });
        await context.SaveChangesAsync();

        var result = (await service.GetFlowersAsync(floristEvent.Id, TestOwnerId)).ToList();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, flower => flower.Name == "Rose");
        Assert.Contains(result, flower => flower.Name == "Tulip");
    }

    [Fact]
    public async Task GetFlowersAsync_DoesNotReturnFlowersFromOtherOwner()
    {
        using var context = CreateInMemoryContext();
        var service = new EventFlowerService(context);

        var ownerEvent = CreateEvent(TestOwnerId);
        var otherEvent = CreateEvent(OtherOwnerId);
        context.Events.AddRange(ownerEvent, otherEvent);
        context.EventFlowers.Add(new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = ownerEvent.Id,
            Name = "Rose",
            PricePerStem = 2.5m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await service.GetFlowersAsync(otherEvent.Id, OtherOwnerId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task CreateFlowerAsync_CreatesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new EventFlowerService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        context.Events.Add(floristEvent);
        await context.SaveChangesAsync();

        var response = await service.CreateFlowerAsync(
            floristEvent.Id,
            new CreateEventFlowerRequest("Rose", 2.25m, 12),
            TestOwnerId);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Equal("Rose", response.Name);
        Assert.Equal(2.25m, response.PricePerStem);
        Assert.Equal(12, response.BunchSize);
    }

    [Fact]
    public async Task UpdateFlowerAsync_UpdatesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new EventFlowerService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2.5m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        var response = await service.UpdateFlowerAsync(
            floristEvent.Id,
            flower.Id,
            new UpdateEventFlowerRequest("Updated Rose", 3m, 15),
            TestOwnerId);

        Assert.NotNull(response);
        Assert.Equal("Updated Rose", response!.Name);
        Assert.Equal(3m, response.PricePerStem);
        Assert.Equal(15, response.BunchSize);
    }

    [Fact]
    public async Task DeleteFlowerAsync_DeletesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new EventFlowerService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Rose",
            PricePerStem = 2.5m,
            BunchSize = 10,
            CreatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventFlowers.Add(flower);
        await context.SaveChangesAsync();

        var deleted = await service.DeleteFlowerAsync(floristEvent.Id, flower.Id, TestOwnerId);
        var result = await service.GetFlowersAsync(floristEvent.Id, TestOwnerId);

        Assert.True(deleted);
        Assert.Empty(result);
    }
}
