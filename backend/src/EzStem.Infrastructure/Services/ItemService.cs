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

    public async Task<PagedResponse<ItemResponse>> GetItemsAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = _context.Items.Include(i => i.Vendor).AsQueryable();

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
                i.CreatedAt, i.UpdatedAt))
            .ToListAsync(ct);

        return new PagedResponse<ItemResponse>(items, total, page, pageSize);
    }

    public async Task<ItemResponse?> GetItemByIdAsync(Guid id, CancellationToken ct = default)
    {
        var item = await _context.Items.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item == null) return null;

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.CreatedAt, item.UpdatedAt);
    }

    public async Task<ItemResponse> CreateItemAsync(CreateItemRequest request, CancellationToken ct = default)
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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Items.Add(item);
        await _context.SaveChangesAsync(ct);

        await _context.Entry(item).Reference(i => i.Vendor).LoadAsync(ct);

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.CreatedAt, item.UpdatedAt);
    }

    public async Task<ItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request, CancellationToken ct = default)
    {
        var item = await _context.Items.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.Id == id, ct);
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

        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return new ItemResponse(
            item.Id, item.Name, item.Description, item.CostPerStem, item.BundleSize,
            item.ImageUrl, item.Notes, item.VendorId, item.Vendor?.Name,
            item.CreatedAt, item.UpdatedAt);
    }

    public async Task<bool> DeleteItemAsync(Guid id, CancellationToken ct = default)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item == null) return false;

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return true;
    }
}
