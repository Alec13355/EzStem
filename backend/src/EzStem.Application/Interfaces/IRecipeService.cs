using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IRecipeService
{
    Task<PagedResponse<RecipeResponse>> GetRecipesAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default);
    Task<RecipeResponse?> GetRecipeByIdAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<RecipeResponse> CreateRecipeAsync(CreateRecipeRequest request, string ownerId, CancellationToken ct = default);
    Task<RecipeResponse?> UpdateRecipeAsync(Guid id, UpdateRecipeRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteRecipeAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<RecipeCostResponse?> GetRecipeCostAsync(Guid id, CancellationToken ct = default);
    Task<ScaleRecipeResponse?> ScaleRecipeAsync(Guid id, int scaleFactor, string ownerId, CancellationToken ct = default);
    Task<RecipeItemResponse?> AddItemToRecipeAsync(Guid recipeId, AddRecipeItemRequest request, string ownerId, CancellationToken ct = default);
    Task<RecipeItemResponse?> UpdateRecipeItemAsync(Guid recipeId, Guid itemId, UpdateRecipeItemRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> RemoveItemFromRecipeAsync(Guid recipeId, Guid itemId, string ownerId, CancellationToken ct = default);
    Task<RecipeResponse?> DuplicateRecipeAsync(Guid id, string ownerId, CancellationToken ct = default);
}
