using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IRecipeService
{
    Task<PagedResponse<RecipeResponse>> GetRecipesAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<RecipeResponse?> GetRecipeByIdAsync(Guid id, CancellationToken ct = default);
    Task<RecipeResponse> CreateRecipeAsync(CreateRecipeRequest request, CancellationToken ct = default);
    Task<RecipeResponse?> UpdateRecipeAsync(Guid id, UpdateRecipeRequest request, CancellationToken ct = default);
    Task<bool> DeleteRecipeAsync(Guid id, CancellationToken ct = default);
    Task<RecipeCostResponse?> GetRecipeCostAsync(Guid id, CancellationToken ct = default);
    Task<ScaleRecipeResponse?> ScaleRecipeAsync(Guid id, int scaleFactor, CancellationToken ct = default);
    Task<RecipeItemResponse?> AddItemToRecipeAsync(Guid recipeId, AddRecipeItemRequest request, CancellationToken ct = default);
    Task<RecipeItemResponse?> UpdateRecipeItemAsync(Guid recipeId, Guid itemId, UpdateRecipeItemRequest request, CancellationToken ct = default);
    Task<bool> RemoveItemFromRecipeAsync(Guid recipeId, Guid itemId, CancellationToken ct = default);
}
