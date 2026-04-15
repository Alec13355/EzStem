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
