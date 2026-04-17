namespace EzStem.Application.DTOs;

public record CreateItemRequest(
    string Name,
    string? Description,
    decimal CostPerStem,
    int BundleSize,
    string? ImageUrl,
    string? Notes,
    Guid? VendorId,
    bool IsSeasonalItem = false,
    int? SeasonalStartMonth = null,
    int? SeasonalEndMonth = null,
    int? LeadTimeDays = null
);

public record UpdateItemRequest(
    string? Name,
    string? Description,
    decimal? CostPerStem,
    int? BundleSize,
    string? ImageUrl,
    string? Notes,
    Guid? VendorId,
    bool? IsSeasonalItem = null,
    int? SeasonalStartMonth = null,
    int? SeasonalEndMonth = null,
    int? LeadTimeDays = null
);

public record ItemResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal CostPerStem,
    int BundleSize,
    string? ImageUrl,
    string? Notes,
    Guid? VendorId,
    string? VendorName,
    bool IsSeasonalItem,
    int? SeasonalStartMonth,
    int? SeasonalEndMonth,
    int? LeadTimeDays,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsActive = true
);

public record SeasonalWarning(
    Guid ItemId,
    string ItemName,
    string WarningType,
    string Message
);

public record UploadImageResponse(string Url);
