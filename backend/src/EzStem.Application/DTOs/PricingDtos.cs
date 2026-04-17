namespace EzStem.Application.DTOs;

public record PricingConfigRequest(
    decimal DefaultMarkupPercentage,
    decimal DefaultLaborRate
);

public record PricingConfigResponse(
    string Id,
    decimal DefaultMarkupPercentage,
    decimal DefaultLaborRate);

public record PricingCalculateRequest(
    decimal CostOfGoods, decimal LaborCost, decimal MarkupPercentage);

public record PricingResult(
    decimal StemCost, decimal LaborCost,
    decimal TotalCost, decimal RetailPrice, decimal Profit,
    decimal MarginPercent);

public record RecipePricingResponse(
    Guid RecipeId, string RecipeName,
    PricingResult Pricing,
    bool IsUnderpricedWarning
);
