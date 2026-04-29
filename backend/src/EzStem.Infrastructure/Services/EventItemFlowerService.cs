using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class EventItemFlowerService : IEventItemFlowerService
{
    private readonly EzStemDbContext _context;

    public EventItemFlowerService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EventItemFlowerResponse>> GetRecipeAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default)
    {
        var itemExists = await _context.EventItems
            .AnyAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);

        if (!itemExists) throw new KeyNotFoundException("Event item not found");

        var entries = await _context.EventItemFlowers
            .Include(e => e.EventFlower)
            .Where(e => e.EventItemId == itemId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync(ct);

        return entries.Select(MapToResponse);
    }

    public async Task<EventItemFlowerResponse> AddFlowerToRecipeAsync(Guid eventId, Guid itemId, CreateEventItemFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.EventItems
            .Include(i => i.Event)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.EventId == eventId && i.Event.OwnerId == ownerId, ct);

        if (item == null) throw new KeyNotFoundException("Event item not found");

        var flower = await _context.EventFlowers
            .Include(f => f.Event)
            .FirstOrDefaultAsync(f => f.Id == request.EventFlowerId && f.EventId == eventId && f.Event.OwnerId == ownerId, ct);

        if (flower == null) throw new KeyNotFoundException("Event flower not found");

        if (request.StemsNeeded <= 0)
            throw new ArgumentException("StemsNeeded must be greater than zero", nameof(request.StemsNeeded));

        var entry = new EventItemFlower
        {
            Id = Guid.NewGuid(),
            EventItemId = itemId,
            EventFlowerId = flower.Id,
            StemsNeeded = request.StemsNeeded,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventItemFlowers.Add(entry);
        await _context.SaveChangesAsync(ct);

        return new EventItemFlowerResponse(
            entry.Id,
            entry.EventItemId,
            entry.EventFlowerId,
            flower.Name,
            flower.PricePerStem,
            flower.BunchSize,
            entry.StemsNeeded,
            entry.CreatedAt);
    }

    public async Task<EventItemFlowerResponse?> UpdateRecipeEntryAsync(Guid eventId, Guid itemId, Guid entryId, UpdateEventItemFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        var entry = await _context.EventItemFlowers
            .Include(e => e.EventFlower)
            .Include(e => e.EventItem)
            .ThenInclude(i => i.Event)
            .FirstOrDefaultAsync(e => e.Id == entryId && e.EventItemId == itemId && e.EventItem.EventId == eventId && e.EventItem.Event.OwnerId == ownerId, ct);

        if (entry == null) return null;

        if (request.StemsNeeded <= 0)
            throw new ArgumentException("StemsNeeded must be greater than zero", nameof(request.StemsNeeded));

        entry.StemsNeeded = request.StemsNeeded;
        await _context.SaveChangesAsync(ct);

        return MapToResponse(entry);
    }

    public async Task<bool> DeleteRecipeEntryAsync(Guid eventId, Guid itemId, Guid entryId, string ownerId, CancellationToken ct = default)
    {
        var entry = await _context.EventItemFlowers
            .Include(e => e.EventItem)
            .ThenInclude(i => i.Event)
            .FirstOrDefaultAsync(e => e.Id == entryId && e.EventItemId == itemId && e.EventItem.EventId == eventId && e.EventItem.Event.OwnerId == ownerId, ct);

        if (entry == null) return false;

        _context.EventItemFlowers.Remove(entry);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<EventRecipeSummaryResponse> GetEventRecipeSummaryAsync(Guid eventId, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);

        if (evt == null) throw new KeyNotFoundException("Event not found");

        var items = await _context.EventItems
            .Include(i => i.RecipeFlowers)
            .ThenInclude(rf => rf.EventFlower)
            .Where(i => i.EventId == eventId)
            .ToListAsync(ct);

        var itemSummaries = new List<RecipeItemSummary>();
        decimal totalRevenue = 0m;

        foreach (var item in items)
        {
            var lineItems = new List<RecipeLineItem>();
            decimal itemCost = 0m;

            foreach (var entry in item.RecipeFlowers)
            {
                var flower = entry.EventFlower;
                if (flower == null) continue;

                var totalStemsNeeded = entry.StemsNeeded * item.Quantity;
                var bunchesNeeded = flower.BunchSize > 0
                    ? (int)Math.Ceiling((decimal)totalStemsNeeded / flower.BunchSize)
                    : 0;
                var totalCost = flower.PricePerStem * flower.BunchSize * bunchesNeeded;

                lineItems.Add(new RecipeLineItem(
                    entry.Id,
                    flower.Id,
                    flower.Name,
                    flower.PricePerStem,
                    flower.BunchSize,
                    entry.StemsNeeded,
                    item.Quantity,
                    totalStemsNeeded,
                    bunchesNeeded,
                    totalCost));

                itemCost += totalCost;
            }

            var totalItemRevenue = item.Price * item.Quantity;
            totalRevenue += totalItemRevenue;

            itemSummaries.Add(new RecipeItemSummary(
                item.Id,
                item.Name,
                item.Price,
                item.Quantity,
                totalItemRevenue,
                itemCost,
                lineItems));
        }

        var flowerProcurement = items
            .SelectMany(item => item.RecipeFlowers.Select(entry => new { Item = item, Entry = entry }))
            .Where(x => x.Entry.EventFlower != null)
            .GroupBy(x => x.Entry.EventFlowerId)
            .Select(group =>
            {
                var flower = group.First().Entry.EventFlower;
                var totalStemsNeeded = group.Sum(x => x.Entry.StemsNeeded * x.Item.Quantity);
                var bunchesNeeded = flower.BunchSize > 0
                    ? (int)Math.Ceiling((decimal)totalStemsNeeded / flower.BunchSize)
                    : 0;
                var totalCost = flower.PricePerStem * flower.BunchSize * bunchesNeeded;

                return new FlowerProcurementLine(
                    flower.Id,
                    flower.Name,
                    flower.PricePerStem,
                    flower.BunchSize,
                    totalStemsNeeded,
                    bunchesNeeded,
                    totalCost);
            })
            .ToList();

        var totalFlowerCost = flowerProcurement.Sum(line => line.TotalCost);
        var flowerBudget = evt.ProfitMultiple > 0 ? evt.TotalBudget / evt.ProfitMultiple : 0m;

        return new EventRecipeSummaryResponse(
            evt.Id,
            evt.Name,
            evt.TotalBudget,
            evt.ProfitMultiple,
            flowerBudget,
            totalRevenue,
            totalFlowerCost,
            totalFlowerCost > flowerBudget,
            itemSummaries,
            flowerProcurement);
    }

    private static EventItemFlowerResponse MapToResponse(EventItemFlower entry) => new(
        entry.Id,
        entry.EventItemId,
        entry.EventFlowerId,
        entry.EventFlower.Name,
        entry.EventFlower.PricePerStem,
        entry.EventFlower.BunchSize,
        entry.StemsNeeded,
        entry.CreatedAt);
}
