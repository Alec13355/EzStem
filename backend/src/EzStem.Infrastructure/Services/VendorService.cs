using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class VendorService : IVendorService
{
    private readonly EzStemDbContext _context;

    public VendorService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<VendorResponse>> GetVendorsAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = _context.Vendors.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(v => v.Name.Contains(search) || (v.ContactEmail != null && v.ContactEmail.Contains(search)));
        }

        var total = await query.CountAsync(ct);
        var vendors = await query
            .OrderBy(v => v.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VendorResponse(v.Id, v.Name, v.ContactEmail, v.Notes))
            .ToListAsync(ct);

        return new PagedResponse<VendorResponse>(vendors, total, page, pageSize);
    }

    public async Task<VendorResponse?> GetVendorByIdAsync(Guid id, CancellationToken ct = default)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (vendor == null) return null;

        return new VendorResponse(vendor.Id, vendor.Name, vendor.ContactEmail, vendor.Notes);
    }

    public async Task<VendorResponse> CreateVendorAsync(CreateVendorRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        var vendor = new Vendor
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ContactEmail = request.ContactEmail,
            Notes = request.Notes
        };

        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync(ct);

        return new VendorResponse(vendor.Id, vendor.Name, vendor.ContactEmail, vendor.Notes);
    }

    public async Task<VendorResponse?> UpdateVendorAsync(Guid id, UpdateVendorRequest request, CancellationToken ct = default)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (vendor == null) return null;

        if (request.Name != null) vendor.Name = request.Name;
        if (request.ContactEmail != null) vendor.ContactEmail = request.ContactEmail;
        if (request.Notes != null) vendor.Notes = request.Notes;

        await _context.SaveChangesAsync(ct);

        return new VendorResponse(vendor.Id, vendor.Name, vendor.ContactEmail, vendor.Notes);
    }

    public async Task<bool> DeleteVendorAsync(Guid id, CancellationToken ct = default)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (vendor == null) return false;

        vendor.IsDeleted = true;
        vendor.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return true;
    }
}
