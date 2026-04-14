namespace EzStem.Application.DTOs;

public record PricingConfigRequest(
    decimal MarkupFactor,
    decimal? OverheadPercent,
    decimal? LaborDefaultCost
);

public record PricingConfigResponse(
    decimal MarkupFactor, decimal OverheadPercent, decimal LaborDefaultCost);

public record PricingCalculateRequest(
    decimal CostOfGoods, decimal LaborCost, decimal MarkupFactor, decimal OverheadPercent);

public record PricingResult(
    decimal StemCost, decimal LaborCost, decimal OverheadCost,
    decimal TotalCost, decimal RetailPrice, decimal Profit,
    decimal MarginPercent);

public record RecipePricingResponse(
    Guid RecipeId, string RecipeName,
    PricingResult Pricing,
    bool IsUnderpricedWarning
);
