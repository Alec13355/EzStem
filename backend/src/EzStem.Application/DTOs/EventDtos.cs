namespace EzStem.Application.DTOs;

public record CreateEventRequest(string Name, DateTime EventDate, string? ClientName, string? Notes);
public record UpdateEventRequest(string? Name, DateTime? EventDate, string? ClientName, string? Notes, string? Status);
public record AddEventRecipeRequest(Guid RecipeId, int Quantity);
public record UpdateEventRecipeRequest(int Quantity);

public record EventRecipeResponse(
    Guid Id, Guid RecipeId, string RecipeName, int Quantity,
    decimal UnitCost, decimal TotalCost);

public record EventSummaryResponse(
    Guid EventId, string EventName, DateTime EventDate, string Status,
    decimal TotalCost, decimal TotalRevenue, decimal TotalProfit,
    decimal MarginPercent,
    IEnumerable<EventRecipeResponse> Recipes);

public record EventResponse(
    Guid Id, string Name, DateTime EventDate, string? ClientName,
    string? Notes, string Status, IEnumerable<EventRecipeResponse> EventRecipes,
    DateTime CreatedAt);

public record ProductionSheetLineItem(
    string ItemName,
    string? VendorName,
    decimal QuantityNeeded,
    string Unit // "stems"
);

public record ProductionSheetRecipe(
    string RecipeName,
    int Quantity, // how many of this recipe for the event
    IEnumerable<ProductionSheetLineItem> Items,
    string? Notes
);

public record ProductionSheetResponse(
    Guid EventId,
    string EventName,
    DateTime EventDate,
    string? ClientName,
    IEnumerable<ProductionSheetRecipe> Recipes,
    int TotalStemCount
);

public record FlexItemResponse(
    Guid Id, Guid EventId, Guid ItemId, string ItemName,
    Guid? VendorId, string? VendorName,
    decimal QuantityNeeded, string? Notes,
    decimal CostPerStem, decimal LineTotalCost,
    DateTime CreatedAt);

public record AddFlexItemRequest(Guid ItemId, decimal QuantityNeeded, string? Notes);
public record UpdateFlexItemRequest(decimal? QuantityNeeded, string? Notes);
