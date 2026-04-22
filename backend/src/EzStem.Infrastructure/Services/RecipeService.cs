using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class RecipeService : IRecipeService
{
    private readonly EzStemDbContext _context;
    private const string DeletedItemLabel = "Deleted item";

    public RecipeService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<RecipeResponse>> GetRecipesAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default)
    {
        var query = _context.Recipes
            .Include(r => r.RecipeItems).ThenInclude(ri => ri.Item)
            .Where(r => r.OwnerId == ownerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r => r.Name.Contains(search) || (r.Description != null && r.Description.Contains(search)));

        var total = await query.CountAsync(ct);
        var recipes = await query
            .OrderBy(r => r.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResponse<RecipeResponse>(recipes.Select(MapToRecipeResponse), total, page, pageSize);
    }

    public async Task<RecipeResponse?> GetRecipeByIdAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeItems).ThenInclude(ri => ri.Item)
            .FirstOrDefaultAsync(r => r.Id == id && r.OwnerId == ownerId, ct);

        return recipe == null ? null : MapToRecipeResponse(recipe);
    }

    public async Task<RecipeResponse> CreateRecipeAsync(CreateRecipeRequest request, string ownerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            LaborCost = request.LaborCost,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync(ct);

        return MapToRecipeResponse(recipe);
    }

    public async Task<RecipeResponse?> UpdateRecipeAsync(Guid id, UpdateRecipeRequest request, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeItems).ThenInclude(ri => ri.Item)
            .FirstOrDefaultAsync(r => r.Id == id && r.OwnerId == ownerId, ct);

        if (recipe == null) return null;

        if (request.Name != null) recipe.Name = request.Name;
        if (request.Description != null) recipe.Description = request.Description;
        if (request.LaborCost.HasValue) recipe.LaborCost = request.LaborCost.Value;

        await _context.SaveChangesAsync(ct);
        return MapToRecipeResponse(recipe);
    }

    public async Task<bool> DeleteRecipeAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.OwnerId == ownerId, ct);
        if (recipe == null) return false;

        recipe.IsDeleted = true;
        recipe.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<RecipeCostResponse?> GetRecipeCostAsync(Guid id, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeItems)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (recipe == null) return null;

        var itemsCost = recipe.RecipeItems.Sum(ri => ri.Quantity * ri.CostPerStem);
        var totalCost = itemsCost + recipe.LaborCost;
        return new RecipeCostResponse(itemsCost, recipe.LaborCost, totalCost);
    }

    public async Task<ScaleRecipeResponse?> ScaleRecipeAsync(Guid id, int scaleFactor, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeItems).ThenInclude(ri => ri.Item)
            .FirstOrDefaultAsync(r => r.Id == id && r.OwnerId == ownerId, ct);

        if (recipe == null) return null;

        var scaledItems = recipe.RecipeItems.Select(ri => new RecipeItemResponse(
            ri.Id, ri.ItemId, ri.Item?.Name ?? DeletedItemLabel,
            ri.Quantity * scaleFactor, ri.CostPerStem,
            ri.Quantity * scaleFactor * ri.CostPerStem)).ToList();

        var totalItemsCost = scaledItems.Sum(si => si.LineTotal);
        var totalCost = totalItemsCost + recipe.LaborCost;
        return new ScaleRecipeResponse(scaleFactor, totalItemsCost, recipe.LaborCost, totalCost, scaledItems);
    }

    public async Task<RecipeItemResponse?> AddItemToRecipeAsync(Guid recipeId, AddRecipeItemRequest request, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == recipeId && r.OwnerId == ownerId, ct);
        if (recipe == null) return null;

        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == request.ItemId, ct);
        if (item == null) throw new ArgumentException("Item not found");

        var recipeItem = new RecipeItem
        {
            Id = Guid.NewGuid(),
            RecipeId = recipeId,
            ItemId = request.ItemId,
            Quantity = request.Quantity,
            CostPerStem = item.CostPerStem
        };

        _context.RecipeItems.Add(recipeItem);
        await _context.SaveChangesAsync(ct);
        await _context.Entry(recipeItem).Reference(ri => ri.Item).LoadAsync(ct);

        return new RecipeItemResponse(
            recipeItem.Id, recipeItem.ItemId, recipeItem.Item?.Name ?? DeletedItemLabel,
            recipeItem.Quantity, recipeItem.CostPerStem,
            recipeItem.Quantity * recipeItem.CostPerStem);
    }

    public async Task<RecipeItemResponse?> UpdateRecipeItemAsync(Guid recipeId, Guid itemId, UpdateRecipeItemRequest request, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == recipeId && r.OwnerId == ownerId, ct);
        if (recipe == null) return null;

        var recipeItem = await _context.RecipeItems
            .Include(ri => ri.Item)
            .FirstOrDefaultAsync(ri => ri.RecipeId == recipeId && ri.ItemId == itemId, ct);

        if (recipeItem == null) return null;

        recipeItem.Quantity = request.Quantity;
        await _context.SaveChangesAsync(ct);

        return new RecipeItemResponse(
            recipeItem.Id, recipeItem.ItemId, recipeItem.Item?.Name ?? DeletedItemLabel,
            recipeItem.Quantity, recipeItem.CostPerStem,
            recipeItem.Quantity * recipeItem.CostPerStem);
    }

    public async Task<bool> RemoveItemFromRecipeAsync(Guid recipeId, Guid itemId, string ownerId, CancellationToken ct = default)
    {
        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == recipeId && r.OwnerId == ownerId, ct);
        if (recipe == null) return false;

        var recipeItem = await _context.RecipeItems
            .FirstOrDefaultAsync(ri => ri.RecipeId == recipeId && ri.ItemId == itemId, ct);

        if (recipeItem == null) return false;

        _context.RecipeItems.Remove(recipeItem);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<RecipeResponse?> DuplicateRecipeAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var original = await _context.Recipes
            .Include(r => r.RecipeItems).ThenInclude(ri => ri.Item)
            .FirstOrDefaultAsync(r => r.Id == id && r.OwnerId == ownerId, ct);

        if (original == null) return null;

        var duplicate = new Recipe
        {
            Id = Guid.NewGuid(),
            Name = $"Copy of {original.Name}",
            Description = original.Description,
            LaborCost = original.LaborCost,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Recipes.Add(duplicate);

        foreach (var ri in original.RecipeItems)
        {
            _context.RecipeItems.Add(new RecipeItem
            {
                Id = Guid.NewGuid(),
                RecipeId = duplicate.Id,
                ItemId = ri.ItemId,
                Quantity = ri.Quantity,
                CostPerStem = ri.CostPerStem
            });
        }

        await _context.SaveChangesAsync(ct);

        await _context.Entry(duplicate)
            .Collection(r => r.RecipeItems)
            .Query()
            .Include(ri => ri.Item)
            .LoadAsync(ct);

        return MapToRecipeResponse(duplicate);
    }

    private RecipeResponse MapToRecipeResponse(Recipe recipe)
    {
        var recipeItems = recipe.RecipeItems.Select(ri => new RecipeItemResponse(
            ri.Id, ri.ItemId, ri.Item?.Name ?? DeletedItemLabel,
            ri.Quantity, ri.CostPerStem,
            ri.Quantity * ri.CostPerStem)).ToList();

        var totalItemsCost = recipeItems.Sum(ri => ri.LineTotal);
        var totalCost = totalItemsCost + recipe.LaborCost;

        return new RecipeResponse(
            recipe.Id, recipe.Name, recipe.Description, recipe.LaborCost,
            recipeItems, totalItemsCost, totalCost, recipe.CreatedAt);
    }
}
