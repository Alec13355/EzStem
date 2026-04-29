using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class EventItemService : IEventItemService
{
    private readonly EzStemDbContext _context;

    public EventItemService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EventItemResponse>> GetItemsAsync(Guid eventId, string ownerId, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (!eventExists) throw new KeyNotFoundException("Event not found");

        var items = await _context.EventItems
            .Where(i => i.EventId == eventId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(ct);

        return items.Select(MapToResponse);
    }

    public async Task<EventItemResponse?> GetItemAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.EventItems
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);

        return item == null ? null : MapToResponse(item);
    }

    public async Task<EventItemResponse> CreateItemAsync(Guid eventId, CreateEventItemRequest request, string ownerId, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (!eventExists) throw new KeyNotFoundException("Event not found");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        if (request.Price <= 0)
            throw new ArgumentException("Price must be greater than zero", nameof(request.Price));

        if (request.Quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero", nameof(request.Quantity));

        var item = new EventItem
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Name = request.Name,
            Price = request.Price,
            Quantity = request.Quantity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventItems.Add(item);
        await _context.SaveChangesAsync(ct);

        return MapToResponse(item);
    }

    public async Task<EventItemResponse?> UpdateItemAsync(Guid eventId, Guid itemId, UpdateEventItemRequest request, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.EventItems
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);

        if (item == null) return null;

        if (request.Name != null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Name is required");
            item.Name = request.Name;
        }

        if (request.Price.HasValue)
        {
            if (request.Price.Value <= 0)
                throw new ArgumentException("Price must be greater than zero");
            item.Price = request.Price.Value;
        }

        if (request.Quantity.HasValue)
        {
            if (request.Quantity.Value <= 0)
                throw new ArgumentException("Quantity must be greater than zero");
            item.Quantity = request.Quantity.Value;
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return MapToResponse(item);
    }

    public async Task<bool> DeleteItemAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.EventItems
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);

        if (item == null) return false;

        _context.EventItems.Remove(item);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IEnumerable<EventItemResponse>> GetItemsFromLastEventAsync(Guid currentEventId, string ownerId, CancellationToken ct = default)
    {
        var currentEventExists = await _context.Events.AnyAsync(e => e.Id == currentEventId && e.OwnerId == ownerId, ct);
        if (!currentEventExists) throw new KeyNotFoundException("Event not found");

        var lastEvent = await _context.Events
            .Where(e => e.OwnerId == ownerId && e.Id != currentEventId)
            .OrderByDescending(e => e.UpdatedAt)
            .FirstOrDefaultAsync(ct);

        if (lastEvent == null) return Enumerable.Empty<EventItemResponse>();

        var items = await _context.EventItems
            .Where(i => i.EventId == lastEvent.Id)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(ct);

        return items.Select(MapToResponse);
    }

    private static EventItemResponse MapToResponse(EventItem item) => new(
        item.Id,
        item.EventId,
        item.Name,
        item.Price,
        item.Quantity,
        item.CreatedAt,
        item.UpdatedAt);
}
