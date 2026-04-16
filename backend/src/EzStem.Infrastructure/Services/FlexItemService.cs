using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class FlexItemService : IFlexItemService
{
    private readonly EzStemDbContext _context;

    public FlexItemService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<FlexItemResponse>> GetFlexItemsAsync(Guid eventId, CancellationToken ct = default)
    {
        var items = await _context.FlexItems
            .Include(f => f.Item)
            .ThenInclude(i => i.Vendor)
            .Where(f => f.EventId == eventId)
            .OrderBy(f => f.CreatedAt)
            .ToListAsync(ct);

        return items.Select(MapToResponse);
    }

    public async Task<FlexItemResponse> AddFlexItemAsync(Guid eventId, AddFlexItemRequest request, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId, ct);
        if (!eventExists)
            throw new ArgumentException("Event not found");

        var item = await _context.Items
            .Include(i => i.Vendor)
            .FirstOrDefaultAsync(i => i.Id == request.ItemId, ct);
        if (item == null)
            throw new ArgumentException("Item not found");

        if (request.QuantityNeeded <= 0)
            throw new ArgumentException("QuantityNeeded must be greater than zero");

        var flexItem = new FlexItem
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            ItemId = request.ItemId,
            QuantityNeeded = request.QuantityNeeded,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.FlexItems.Add(flexItem);
        await _context.SaveChangesAsync(ct);

        flexItem.Item = item;
        return MapToResponse(flexItem);
    }

    public async Task<FlexItemResponse?> UpdateFlexItemAsync(Guid eventId, Guid flexItemId, UpdateFlexItemRequest request, CancellationToken ct = default)
    {
        var flexItem = await _context.FlexItems
            .Include(f => f.Item)
            .ThenInclude(i => i.Vendor)
            .FirstOrDefaultAsync(f => f.Id == flexItemId && f.EventId == eventId, ct);

        if (flexItem == null) return null;

        if (request.QuantityNeeded.HasValue)
        {
            if (request.QuantityNeeded.Value <= 0)
                throw new ArgumentException("QuantityNeeded must be greater than zero");
            flexItem.QuantityNeeded = request.QuantityNeeded.Value;
        }

        if (request.Notes is not null)
            flexItem.Notes = request.Notes;

        await _context.SaveChangesAsync(ct);
        return MapToResponse(flexItem);
    }

    public async Task<bool> DeleteFlexItemAsync(Guid eventId, Guid flexItemId, CancellationToken ct = default)
    {
        var flexItem = await _context.FlexItems
            .FirstOrDefaultAsync(f => f.Id == flexItemId && f.EventId == eventId, ct);

        if (flexItem == null) return false;

        _context.FlexItems.Remove(flexItem);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private static FlexItemResponse MapToResponse(FlexItem f) => new(
        f.Id,
        f.EventId,
        f.ItemId,
        f.Item.Name,
        f.Item.VendorId,
        f.Item.Vendor?.Name,
        f.QuantityNeeded,
        f.Notes,
        f.Item.CostPerStem,
        f.QuantityNeeded * f.Item.CostPerStem,
        f.CreatedAt);
}
