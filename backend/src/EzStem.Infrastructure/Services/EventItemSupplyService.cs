using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class EventItemSupplyService : IEventItemSupplyService
{
    private readonly EzStemDbContext _context;

    public EventItemSupplyService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EventItemSupplyResponse>> GetSuppliesAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default)
    {
        var item = await FindItemAsync(eventId, itemId, ownerId, ct);
        if (item == null) throw new KeyNotFoundException("Item not found");

        var supplies = await _context.EventItemSupplies
            .Where(s => s.EventItemId == itemId)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync(ct);

        return supplies.Select(MapToResponse);
    }

    public async Task<EventItemSupplyResponse> CreateSupplyAsync(Guid eventId, Guid itemId, CreateEventItemSupplyRequest request, string ownerId, CancellationToken ct = default)
    {
        var item = await FindItemAsync(eventId, itemId, ownerId, ct);
        if (item == null) throw new KeyNotFoundException("Item not found");

        var supply = new EventItemSupply
        {
            Id = Guid.NewGuid(),
            EventItemId = itemId,
            Name = request.Name,
            CostPerUnit = request.CostPerUnit,
            Quantity = request.Quantity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventItemSupplies.Add(supply);
        await _context.SaveChangesAsync(ct);
        return MapToResponse(supply);
    }

    public async Task<EventItemSupplyResponse?> UpdateSupplyAsync(Guid eventId, Guid itemId, Guid supplyId, UpdateEventItemSupplyRequest request, string ownerId, CancellationToken ct = default)
    {
        var item = await FindItemAsync(eventId, itemId, ownerId, ct);
        if (item == null) return null;

        var supply = await _context.EventItemSupplies
            .FirstOrDefaultAsync(s => s.Id == supplyId && s.EventItemId == itemId, ct);
        if (supply == null) return null;

        if (request.Name != null) supply.Name = request.Name;
        if (request.CostPerUnit.HasValue) supply.CostPerUnit = request.CostPerUnit.Value;
        if (request.Quantity.HasValue) supply.Quantity = request.Quantity.Value;
        supply.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return MapToResponse(supply);
    }

    public async Task<bool> DeleteSupplyAsync(Guid eventId, Guid itemId, Guid supplyId, string ownerId, CancellationToken ct = default)
    {
        var item = await FindItemAsync(eventId, itemId, ownerId, ct);
        if (item == null) return false;

        var supply = await _context.EventItemSupplies
            .FirstOrDefaultAsync(s => s.Id == supplyId && s.EventItemId == itemId, ct);
        if (supply == null) return false;

        _context.EventItemSupplies.Remove(supply);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private async Task<EventItem?> FindItemAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct)
    {
        return await _context.EventItems
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);
    }

    private static EventItemSupplyResponse MapToResponse(EventItemSupply s) =>
        new(s.Id, s.EventItemId, s.Name, s.CostPerUnit, s.Quantity, s.CreatedAt, s.UpdatedAt);
}
