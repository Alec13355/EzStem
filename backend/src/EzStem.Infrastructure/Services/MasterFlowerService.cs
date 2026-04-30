using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Domain.Enums;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class MasterFlowerService : IMasterFlowerService
{
    private readonly EzStemDbContext _context;

    public MasterFlowerService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MasterFlowerResponse>> GetAllAsync(string ownerId, string? category = null, CancellationToken ct = default)
    {
        var query = _context.MasterFlowers
            .Where(m => m.OwnerId == ownerId);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(m => m.Category == category);

        var flowers = await query
            .OrderBy(m => m.Category)
            .ThenBy(m => m.Name)
            .ToListAsync(ct);

        return flowers.Select(MapToResponse);
    }

    public async Task<IEnumerable<string>> GetCategoriesAsync(string ownerId, CancellationToken ct = default)
    {
        return await _context.MasterFlowers
            .Where(m => m.OwnerId == ownerId)
            .Select(m => m.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);
    }

    public async Task<MasterFlowerResponse?> GetByIdAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.MasterFlowers
            .FirstOrDefaultAsync(m => m.Id == id && m.OwnerId == ownerId, ct);

        return flower == null ? null : MapToResponse(flower);
    }

    public async Task<MasterFlowerResponse> CreateAsync(CreateMasterFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        if (request.CostPerUnit <= 0)
            throw new ArgumentException("CostPerUnit must be greater than zero", nameof(request.CostPerUnit));

        if (request.UnitsPerBunch <= 0)
            throw new ArgumentException("UnitsPerBunch must be greater than zero", nameof(request.UnitsPerBunch));

        var unit = ParseUnit(request.Unit);

        var flower = new MasterFlower
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = request.Name,
            Unit = unit,
            CostPerUnit = request.CostPerUnit,
            UnitsPerBunch = request.UnitsPerBunch,
            Category = request.Category ?? "Uncategorized",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MasterFlowers.Add(flower);
        await _context.SaveChangesAsync(ct);

        return MapToResponse(flower);
    }

    public async Task<MasterFlowerResponse?> UpdateAsync(Guid id, UpdateMasterFlowerRequest request, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.MasterFlowers
            .FirstOrDefaultAsync(m => m.Id == id && m.OwnerId == ownerId, ct);

        if (flower == null) return null;

        if (request.Name != null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Name is required");
            flower.Name = request.Name;
        }

        if (request.Unit != null)
        {
            flower.Unit = ParseUnit(request.Unit);
        }

        if (request.CostPerUnit.HasValue)
        {
            if (request.CostPerUnit.Value <= 0)
                throw new ArgumentException("CostPerUnit must be greater than zero");
            flower.CostPerUnit = request.CostPerUnit.Value;
        }

        if (request.UnitsPerBunch.HasValue)
        {
            if (request.UnitsPerBunch.Value <= 0)
                throw new ArgumentException("UnitsPerBunch must be greater than zero");
            flower.UnitsPerBunch = request.UnitsPerBunch.Value;
        }

        if (request.Category != null)
        {
            flower.Category = request.Category;
        }

        flower.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return MapToResponse(flower);
    }

    public async Task<bool> DeleteAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var flower = await _context.MasterFlowers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(m => m.Id == id && m.OwnerId == ownerId, ct);

        if (flower == null) return false;

        // Soft delete
        flower.IsActive = false;
        flower.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return true;
    }

    public async Task<OcrImportResult> ImportFromPdfAsync(Stream pdfStream, string ownerId, IOcrService ocrService, CancellationToken ct = default)
    {
        var parsedRows = await ocrService.ParseFlowerPdfAsync(pdfStream, ct);
        
        var imported = 0;
        var skipped = 0;
        var errors = new List<string>();
        var resultFlowers = new List<MasterFlowerResponse>();

        foreach (var row in parsedRows)
        {
            try
            {
                // Check if flower with same name and category already exists
                var existing = await _context.MasterFlowers
                    .FirstOrDefaultAsync(m => 
                        m.OwnerId == ownerId && 
                        m.Name == row.Name && 
                        m.Category == row.Category, ct);

                var unit = ParseUnit(row.Unit);

                if (existing != null)
                {
                    // Update existing
                    existing.Unit = unit;
                    existing.CostPerUnit = row.CostPerUnit;
                    existing.UnitsPerBunch = row.UnitsPerBunch;
                    existing.UpdatedAt = DateTime.UtcNow;
                    
                    await _context.SaveChangesAsync(ct);
                    resultFlowers.Add(MapToResponse(existing));
                    imported++;
                }
                else
                {
                    // Create new
                    var flower = new MasterFlower
                    {
                        Id = Guid.NewGuid(),
                        OwnerId = ownerId,
                        Name = row.Name,
                        Unit = unit,
                        CostPerUnit = row.CostPerUnit,
                        UnitsPerBunch = row.UnitsPerBunch,
                        Category = row.Category,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.MasterFlowers.Add(flower);
                    await _context.SaveChangesAsync(ct);
                    resultFlowers.Add(MapToResponse(flower));
                    imported++;
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Error importing {row.Name}: {ex.Message}");
                skipped++;
            }
        }

        return new OcrImportResult(imported, skipped, errors, resultFlowers);
    }

    private static FlowerUnit ParseUnit(string unitString)
    {
        var lower = unitString.ToLower().Trim();
        return lower == "stem" ? FlowerUnit.Stem : FlowerUnit.Bunch;
    }

    private static string UnitToString(FlowerUnit unit) =>
        unit == FlowerUnit.Stem ? "Stem" : "Bunch";

    private static MasterFlowerResponse MapToResponse(MasterFlower flower) => new(
        flower.Id,
        flower.Name,
        UnitToString(flower.Unit),
        flower.CostPerUnit,
        flower.UnitsPerBunch,
        flower.Category,
        flower.IsActive,
        flower.CreatedAt,
        flower.UpdatedAt);
}
