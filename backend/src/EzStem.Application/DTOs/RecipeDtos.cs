namespace EzStem.Application.DTOs;

public record CreateRecipeRequest(string Name, string? Description, decimal LaborCost);
public record UpdateRecipeRequest(string? Name, string? Description, decimal? LaborCost);

public record AddRecipeItemRequest(Guid ItemId, decimal Quantity);
public record UpdateRecipeItemRequest(decimal Quantity);

public record RecipeItemResponse(
    Guid Id, Guid ItemId, string ItemName, decimal Quantity,
    decimal CostPerStem, decimal LineTotal);

public record RecipeResponse(
    Guid Id, string Name, string? Description, decimal LaborCost,
    IEnumerable<RecipeItemResponse> RecipeItems,
    decimal TotalItemsCost, decimal TotalCost,
    DateTime CreatedAt);

public record RecipeCostResponse(
    decimal ItemsCost, decimal LaborCost, decimal TotalCost);

public record ScaleRecipeResponse(
    int ScaleFactor, decimal TotalItemsCost, decimal LaborCost,
    decimal TotalCost, IEnumerable<RecipeItemResponse> ScaledItems);
