namespace EzStem.Application.DTOs;

public record CreateItemRequest(
    string Name,
    string? Description,
    decimal CostPerStem,
    int BundleSize,
    string? ImageUrl,
    string? Notes,
    Guid? VendorId
);

public record UpdateItemRequest(
    string? Name,
    string? Description,
    decimal? CostPerStem,
    int? BundleSize,
    string? ImageUrl,
    string? Notes,
    Guid? VendorId
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
    DateTime CreatedAt,
    DateTime UpdatedAt
);
