using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IPricingService
{
    Task<PricingConfigResponse> GetPricingConfigAsync(CancellationToken ct = default);
    Task<PricingConfigResponse> UpdatePricingConfigAsync(PricingConfigRequest request, CancellationToken ct = default);
    Task<PricingResult> CalculatePricingAsync(PricingCalculateRequest request, CancellationToken ct = default);
    Task<RecipePricingResponse?> GetRecipePricingAsync(Guid recipeId, CancellationToken ct = default);
}
