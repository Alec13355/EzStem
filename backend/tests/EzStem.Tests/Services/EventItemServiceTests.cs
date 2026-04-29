using EzStem.Application.DTOs;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class EventItemServiceTests
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

    private static FloristEvent CreateEvent(string ownerId, DateTime? createdAt = null)
    {
        return new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = "Test Event",
            EventDate = DateTime.UtcNow,
            OwnerId = ownerId,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetItemsAsync_ReturnsItemsForEvent()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        context.Events.Add(floristEvent);
        context.EventItems.AddRange(
            new EventItem
            {
                Id = Guid.NewGuid(),
                EventId = floristEvent.Id,
                Name = "Bouquet",
                Price = 120m,
                Quantity = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                EventId = floristEvent.Id,
                Name = "Centerpiece",
                Price = 200m,
                Quantity = 1,
                CreatedAt = DateTime.UtcNow.AddMinutes(1),
                UpdatedAt = DateTime.UtcNow.AddMinutes(1)
            });
        await context.SaveChangesAsync();

        var result = (await service.GetItemsAsync(floristEvent.Id, TestOwnerId)).ToList();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, item => item.Name == "Bouquet");
        Assert.Contains(result, item => item.Name == "Centerpiece");
    }

    [Fact]
    public async Task GetItemsAsync_DoesNotReturnItemsFromOtherOwner()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var ownerEvent = CreateEvent(TestOwnerId);
        var otherEvent = CreateEvent(OtherOwnerId);
        context.Events.AddRange(ownerEvent, otherEvent);
        context.EventItems.Add(new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = ownerEvent.Id,
            Name = "Bouquet",
            Price = 120m,
            Quantity = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await service.GetItemsAsync(otherEvent.Id, OtherOwnerId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task CreateItemAsync_CreatesItem()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        context.Events.Add(floristEvent);
        await context.SaveChangesAsync();

        var response = await service.CreateItemAsync(
            floristEvent.Id,
            new CreateEventItemRequest("Bouquet", 150m, 3),
            TestOwnerId);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Equal("Bouquet", response.Name);
        Assert.Equal(150m, response.Price);
        Assert.Equal(3, response.Quantity);
    }

    [Fact]
    public async Task UpdateItemAsync_UpdatesItem()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Bouquet",
            Price = 120m,
            Quantity = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        await context.SaveChangesAsync();

        var response = await service.UpdateItemAsync(
            floristEvent.Id,
            item.Id,
            new UpdateEventItemRequest("Updated Bouquet", 180m, 5),
            TestOwnerId);

        Assert.NotNull(response);
        Assert.Equal("Updated Bouquet", response!.Name);
        Assert.Equal(180m, response.Price);
        Assert.Equal(5, response.Quantity);
    }

    [Fact]
    public async Task DeleteItemAsync_DeletesItem()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var floristEvent = CreateEvent(TestOwnerId);
        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = floristEvent.Id,
            Name = "Bouquet",
            Price = 120m,
            Quantity = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Events.Add(floristEvent);
        context.EventItems.Add(item);
        await context.SaveChangesAsync();

        var deleted = await service.DeleteItemAsync(floristEvent.Id, item.Id, TestOwnerId);
        var result = await service.GetItemsAsync(floristEvent.Id, TestOwnerId);

        Assert.True(deleted);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetItemsFromLastEventAsync_ReturnsItemsFromPreviousEvent()
    {
        using var context = CreateInMemoryContext();
        var service = new EventItemService(context);

        var previousEvent = CreateEvent(TestOwnerId, DateTime.UtcNow.AddDays(-2));
        var currentEvent = CreateEvent(TestOwnerId, DateTime.UtcNow.AddDays(-1));

        context.Events.AddRange(previousEvent, currentEvent);
        context.EventItems.AddRange(
            new EventItem
            {
                Id = Guid.NewGuid(),
                EventId = previousEvent.Id,
                Name = "Bouquet",
                Price = 120m,
                Quantity = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                EventId = previousEvent.Id,
                Name = "Centerpiece",
                Price = 200m,
                Quantity = 1,
                CreatedAt = DateTime.UtcNow.AddMinutes(1),
                UpdatedAt = DateTime.UtcNow.AddMinutes(1)
            });
        await context.SaveChangesAsync();

        var result = (await service.GetItemsFromLastEventAsync(currentEvent.Id, TestOwnerId)).ToList();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, item => item.Name == "Bouquet");
        Assert.Contains(result, item => item.Name == "Centerpiece");
    }
}
