using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class ItemService : IItemService
{
    private readonly EzStemDbContext _context;

    public ItemService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<ItemResponse>> GetItemsAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default)
    {
        var query = _context.Items.Include(i => i.Vendor).Where(i => i.OwnerId == ownerId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(i => i.Name.Contains(search) || (i.Description != null && i.Description.Contains(search)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(i => i.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new ItemResponse(
                i.Id, i.Name, i.Description, i.CostPerStem, i.BundleSize,
                i.ImageUrl, i.Notes, i.VendorId, i.Vendor != null ? i.Vendor.Name : null,
                i.IsSeasonalItem, i.SeasonalStartMonth, i.SeasonalEndMonth, i.LeadTimeDays,
                i.CreatedAt, i.UpdatedAt, i.IsActive))
            .ToListAsync(ct);

        return new PagedResponse<ItemResponse>(items, total, page, pageSize);
    }

    public async Task<ItemResponse?> GetItemByIdAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.Items.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.Id == id && i.OwnerId == ownerId, ct);
        if (item == null) return null;

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.IsSeasonalItem, item.SeasonalStartMonth, item.SeasonalEndMonth, item.LeadTimeDays,
            item.CreatedAt, item.UpdatedAt, item.IsActive);
    }

    public async Task<ItemResponse> CreateItemAsync(CreateItemRequest request, string ownerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        if (request.CostPerStem <= 0)
            throw new ArgumentException("Cost per stem must be greater than 0", nameof(request.CostPerStem));

        if (request.BundleSize <= 0)
            throw new ArgumentException("Bundle size must be greater than 0", nameof(request.BundleSize));

        var item = new Item
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CostPerStem = request.CostPerStem,
            BundleSize = request.BundleSize,
            ImageUrl = request.ImageUrl,
            Notes = request.Notes,
            VendorId = request.VendorId,
            IsSeasonalItem = request.IsSeasonalItem,
            SeasonalStartMonth = request.SeasonalStartMonth,
            SeasonalEndMonth = request.SeasonalEndMonth,
            LeadTimeDays = request.LeadTimeDays,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Items.Add(item);
        await _context.SaveChangesAsync(ct);

        await _context.Entry(item).Reference(i => i.Vendor).LoadAsync(ct);

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.IsSeasonalItem, item.SeasonalStartMonth, item.SeasonalEndMonth, item.LeadTimeDays,
            item.CreatedAt, item.UpdatedAt, item.IsActive);
    }

    public async Task<ItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.Items.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.Id == id && i.OwnerId == ownerId, ct);
        if (item == null) return null;

        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.CostPerStem.HasValue)
        {
            if (request.CostPerStem.Value <= 0)
                throw new ArgumentException("Cost per stem must be greater than 0");
            item.CostPerStem = request.CostPerStem.Value;
        }
        if (request.BundleSize.HasValue)
        {
            if (request.BundleSize.Value <= 0)
                throw new ArgumentException("Bundle size must be greater than 0");
            item.BundleSize = request.BundleSize.Value;
        }
        if (request.ImageUrl != null) item.ImageUrl = request.ImageUrl;
        if (request.Notes != null) item.Notes = request.Notes;
        if (request.VendorId.HasValue) item.VendorId = request.VendorId.Value;
        if (request.IsSeasonalItem.HasValue) item.IsSeasonalItem = request.IsSeasonalItem.Value;
        if (request.SeasonalStartMonth.HasValue) item.SeasonalStartMonth = request.SeasonalStartMonth.Value;
        if (request.SeasonalEndMonth.HasValue) item.SeasonalEndMonth = request.SeasonalEndMonth.Value;
        if (request.LeadTimeDays.HasValue) item.LeadTimeDays = request.LeadTimeDays.Value;

        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.IsSeasonalItem, item.SeasonalStartMonth, item.SeasonalEndMonth, item.LeadTimeDays,
            item.CreatedAt, item.UpdatedAt, item.IsActive);
    }

    public async Task<bool> DeleteItemAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id && i.OwnerId == ownerId, ct);
        if (item == null) return false;

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return true;
    }

    public async Task<IEnumerable<SeasonalWarning>> GetSeasonalWarningsAsync(DateTime eventDate, CancellationToken ct = default)
    {
        var warnings = new List<SeasonalWarning>();
        var seasonalItems = await _context.Items
            .Where(i => i.IsSeasonalItem)
            .ToListAsync(ct);

        var eventMonth = eventDate.Month;
        var daysUntilEvent = (eventDate - DateTime.UtcNow).Days;

        foreach (var item in seasonalItems)
        {
            // Check seasonal availability
            if (item.SeasonalStartMonth.HasValue && item.SeasonalEndMonth.HasValue)
            {
                bool isInSeason = IsMonthInRange(eventMonth, item.SeasonalStartMonth.Value, item.SeasonalEndMonth.Value);
                if (!isInSeason)
                {
                    warnings.Add(new SeasonalWarning(
                        item.Id,
                        item.Name,
                        "OutOfSeason",
                        $"{item.Name} is out of season for events in month {eventMonth}. Available months: {item.SeasonalStartMonth}-{item.SeasonalEndMonth}"));
                }
            }

            // Check lead time
            if (item.LeadTimeDays.HasValue && daysUntilEvent <= item.LeadTimeDays.Value && daysUntilEvent >= 0)
            {
                warnings.Add(new SeasonalWarning(
                    item.Id,
                    item.Name,
                    "LeadTime",
                    $"{item.Name} requires {item.LeadTimeDays} days advance notice. Event is in {daysUntilEvent} days."));
            }
        }

        return warnings;
    }

    private bool IsMonthInRange(int month, int startMonth, int endMonth)
    {
        if (startMonth <= endMonth)
        {
            return month >= startMonth && month <= endMonth;
        }
        else
        {
            return month >= startMonth || month <= endMonth;
        }
    }
}
