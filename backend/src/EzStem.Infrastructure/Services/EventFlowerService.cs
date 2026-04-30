using EzStem.Application.DTOs;
using EzStem.Application.Exceptions;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Domain.Enums;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class EventFlowerService : IEventFlowerService
{
    private readonly EzStemDbContext _context;

    public EventFlowerService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EventFlowerResponse>> GetFlowersAsync(Guid eventId, string ownerId, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (!eventExists) throw new KeyNotFoundException("Event not found");

        var flowers = await _context.EventFlowers
            .Where(f => f.EventId == eventId)
            .OrderBy(f => f.CreatedAt)
            .ToListAsync(ct);

        return flowers.Select(MapToResponse);
    }

    public async Task<EventFlowerResponse?> GetFlowerAsync(Guid eventId, Guid flowerId, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.EventFlowers
            .Include(f => f.Event)
            .FirstOrDefaultAsync(f => f.Id == flowerId && f.EventId == eventId && f.Event.OwnerId == ownerId, ct);

        return flower == null ? null : MapToResponse(flower);
    }

    public async Task<EventFlowerResponse> CreateFlowerAsync(Guid eventId, CreateEventFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (!eventExists) throw new KeyNotFoundException("Event not found");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        if (request.PricePerStem <= 0)
            throw new ArgumentException("PricePerStem must be greater than zero", nameof(request.PricePerStem));

        if (request.BunchSize <= 0)
            throw new ArgumentException("BunchSize must be greater than zero", nameof(request.BunchSize));

        var flower = new EventFlower
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Name = request.Name,
            PricePerStem = request.PricePerStem,
            BunchSize = request.BunchSize,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventFlowers.Add(flower);
        await _context.SaveChangesAsync(ct);

        return MapToResponse(flower);
    }

    public async Task<EventFlowerResponse?> UpdateFlowerAsync(Guid eventId, Guid flowerId, UpdateEventFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.EventFlowers
            .Include(f => f.Event)
            .FirstOrDefaultAsync(f => f.Id == flowerId && f.EventId == eventId && f.Event.OwnerId == ownerId, ct);

        if (flower == null) return null;

        if (request.Name != null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Name is required");
            flower.Name = request.Name;
        }

        if (request.PricePerStem.HasValue)
        {
            if (request.PricePerStem.Value <= 0)
                throw new ArgumentException("PricePerStem must be greater than zero");
            flower.PricePerStem = request.PricePerStem.Value;
        }

        if (request.BunchSize.HasValue)
        {
            if (request.BunchSize.Value <= 0)
                throw new ArgumentException("BunchSize must be greater than zero");
            flower.BunchSize = request.BunchSize.Value;
        }

        await _context.SaveChangesAsync(ct);
        return MapToResponse(flower);
    }

    public async Task<bool> DeleteFlowerAsync(Guid eventId, Guid flowerId, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.EventFlowers
            .Include(f => f.Event)
            .FirstOrDefaultAsync(f => f.Id == flowerId && f.EventId == eventId && f.Event.OwnerId == ownerId, ct);

        if (flower == null) return false;

        var inUse = await _context.EventItemFlowers
            .AnyAsync(e => e.EventFlowerId == flowerId, ct);
        if (inUse)
            throw new FlowerInUseException("This flower is used in one or more item recipes. Remove it from all recipes before deleting.");

        _context.EventFlowers.Remove(flower);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IEnumerable<EventFlowerResponse>> AddFlowersFromMasterAsync(
        Guid eventId, AddFlowersFromMasterRequest request, string ownerId, CancellationToken ct = default)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (!eventExists) throw new KeyNotFoundException("Event not found");

        // Load master flowers — ignore query filter to allow looking up by ID
        var masterIds = request.Selections.Select(s => s.MasterFlowerId).ToList();
        var masterFlowers = await _context.MasterFlowers
            .IgnoreQueryFilters()
            .Where(m => masterIds.Contains(m.Id) && m.OwnerId == ownerId)
            .ToListAsync(ct);

        var created = new List<EventFlower>();
        foreach (var sel in request.Selections)
        {
            var master = masterFlowers.FirstOrDefault(m => m.Id == sel.MasterFlowerId);
            if (master == null) continue;

            // Calculate pricePerStem: if Unit=Bunch, pricePerStem = CostPerUnit / UnitsPerBunch
            decimal pricePerStem = master.Unit == FlowerUnit.Stem
                ? master.CostPerUnit
                : master.CostPerUnit / master.UnitsPerBunch;

            var flower = new EventFlower
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                Name = master.Name,
                PricePerStem = sel.PricePerStemOverride ?? pricePerStem,
                BunchSize = sel.BunchSizeOverride ?? master.UnitsPerBunch,
                MasterFlowerId = master.Id,  // reference for sync-back
                CreatedAt = DateTime.UtcNow
            };
            created.Add(flower);
        }

        _context.EventFlowers.AddRange(created);
        await _context.SaveChangesAsync(ct);

        return created.Select(f => MapToResponse(f));
    }

    private static EventFlowerResponse MapToResponse(EventFlower flower) => new(
        flower.Id,
        flower.EventId,
        flower.Name,
        flower.PricePerStem,
        flower.BunchSize,
        flower.CreatedAt);
}
