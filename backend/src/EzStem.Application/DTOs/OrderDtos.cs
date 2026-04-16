namespace EzStem.Application.DTOs;

public record OrderLineItemResponse(
    Guid Id, Guid ItemId, string ItemName,
    Guid? VendorId, string? VendorName,
    decimal QuantityNeeded, decimal QuantityOrdered,
    int BundleSize, int BundlesNeeded,
    decimal CostPerUnit, decimal LineTotalCost);

public record OrderResponse(
    Guid Id, Guid EventId, string EventName,
    string Status, decimal TotalCost,
    IEnumerable<OrderLineItemResponse> LineItems,
    IEnumerable<VendorOrderGroup> ByVendor,
    decimal? WastePercentage,
    DateTime? WasteCalculationDate,
    DateTime CreatedAt);

public record VendorOrderGroup(
    Guid? VendorId, string VendorName,
    IEnumerable<OrderLineItemResponse> Items,
    decimal VendorTotalCost);

public record WasteSummary(
    decimal TotalStemsOrdered,
    decimal TotalStemsUsed,
    decimal WastePercentage,
    string WasteCategory,
    IEnumerable<string> OptimizationSuggestions,
    decimal RecommendedQuantityMultiplier
);

public record RecordWasteRequest(
    decimal ActualStemsUsed
);
