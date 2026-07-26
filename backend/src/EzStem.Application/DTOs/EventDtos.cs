namespace EzStem.Application.DTOs;

public record CreateEventRequest(string Name, DateTime EventDate, string? ClientName, string? Notes, decimal TotalBudget, decimal ProfitMultiple);
public record UpdateEventRequest(string? Name, DateTime? EventDate, string? ClientName, string? Notes, string? Status, decimal? TotalBudget, decimal? ProfitMultiple);
public record CompleteEventRequest(decimal ActualCost, string? ReceiptUrl);
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
    string? Notes, string Status, decimal TotalBudget, decimal ProfitMultiple,
    IEnumerable<EventRecipeResponse> EventRecipes,
    DateTime CreatedAt,
    bool IsCompleted, decimal? ActualCost, DateTime? CompletedAt, string? ReceiptUrl);

public record PnlEventItem(
    Guid EventId, string EventName, DateTime EventDate, string Status,
    decimal TotalRevenue, decimal ExpectedFlowerCost, decimal ExpectedProfit,
    bool IsCompleted, decimal? ActualCost, decimal? ActualProfit, string? ReceiptUrl, DateTime? CompletedAt,
    decimal TotalSupplyCost = 0m);

public record PnlSummary(
    decimal TotalExpectedRevenue, decimal TotalExpectedProfit,
    decimal TotalActualRevenue, decimal TotalActualProfit, int CompletedEventsCount);

public record PnlResponse(IEnumerable<PnlEventItem> All, IEnumerable<PnlEventItem> Completed, PnlSummary Summary);

public record CreateEventItemRequest(string Name, decimal Price, int Quantity);
public record UpdateEventItemRequest(string? Name, decimal? Price, int? Quantity);
public record EventItemResponse(
    Guid Id, Guid EventId, string Name, decimal Price, int Quantity,
    DateTime CreatedAt, DateTime UpdatedAt,
    IEnumerable<EventItemSupplyResponse>? Supplies = null)
{
    public decimal TotalSupplyCost => Supplies?.Sum(s => s.LineTotalCost) ?? 0m;
}

public record CreateEventItemSupplyRequest(string Name, decimal CostPerUnit, int Quantity);
public record UpdateEventItemSupplyRequest(string? Name, decimal? CostPerUnit, int? Quantity);
public record EventItemSupplyResponse(
    Guid Id, Guid EventItemId, string Name, decimal CostPerUnit, int Quantity,
    DateTime CreatedAt, DateTime UpdatedAt)
{
    public decimal LineTotalCost => CostPerUnit * Quantity;
}

public record CreateEventFlowerRequest(string Name, decimal PricePerStem, int BunchSize);
public record UpdateEventFlowerRequest(string? Name, decimal? PricePerStem, int? BunchSize);
public record EventFlowerResponse(
    Guid Id, Guid EventId, string Name, decimal PricePerStem, int BunchSize,
    DateTime CreatedAt, Guid? MasterFlowerId = null);

public record CreateEventItemFlowerRequest(Guid EventFlowerId, int StemsNeeded, bool IsTotal = false);
public record UpdateEventItemFlowerRequest(int StemsNeeded, bool IsTotal = false);
public record EventItemFlowerResponse(
    Guid Id, Guid EventItemId, Guid EventFlowerId, string EventFlowerName,
    decimal PricePerStem, int BunchSize, int StemsNeeded, bool IsTotal, DateTime CreatedAt);

public record RecipeLineItem(
    Guid EventItemFlowerId, Guid EventFlowerId, string FlowerName,
    decimal PricePerStem, int BunchSize, int StemsPerUnit, int ItemQuantity,
    bool IsTotal, int TotalStemsNeeded, int BunchesNeeded, decimal TotalCost);

public record FlowerProcurementLine(
    Guid EventFlowerId, string FlowerName,
    decimal PricePerStem, int BunchSize,
    int TotalStemsNeeded, int BunchesNeeded, decimal TotalCost);

public record RecipeItemSummary(
    Guid EventItemId, string ItemName, decimal CustomerPrice, int Quantity,
    decimal TotalRevenue, decimal TotalRawCost, IEnumerable<RecipeLineItem> Flowers);

public record EventRecipeSummaryResponse(
    Guid EventId, string EventName, decimal TotalBudget, decimal ProfitMultiple,
    decimal FlowerBudget, decimal TotalRevenue, decimal TotalFlowerCost,
    bool IsOverBudget, IEnumerable<RecipeItemSummary> Items,
    IEnumerable<FlowerProcurementLine> FlowerProcurement);

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

// Master Flower DTOs
public record CreateMasterFlowerRequest(string Name, string Unit, decimal CostPerUnit, int UnitsPerBunch, string Category);
public record UpdateMasterFlowerRequest(string? Name, string? Unit, decimal? CostPerUnit, int? UnitsPerBunch, string? Category);
public record MasterFlowerResponse(Guid Id, string Name, string Unit, decimal CostPerUnit, int UnitsPerBunch, string Category, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt);

// Bulk add from master
public record AddFlowersFromMasterRequest(IEnumerable<MasterFlowerSelection> Selections);
public record MasterFlowerSelection(Guid MasterFlowerId, decimal? PricePerStemOverride, int? BunchSizeOverride);

// OCR import result
public record OcrImportResult(int Imported, int Skipped, IEnumerable<string> Errors, IEnumerable<MasterFlowerResponse> Flowers);
public record EventFlowerImportResult(int Imported, int Skipped, IEnumerable<string> Errors, IEnumerable<EventFlowerResponse> Flowers);
