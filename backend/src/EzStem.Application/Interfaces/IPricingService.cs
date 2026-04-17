using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IPricingService
{
    Task<PricingConfigResponse> GetPricingConfigAsync(string ownerId, CancellationToken ct = default);
    Task<PricingConfigResponse> UpdatePricingConfigAsync(PricingConfigRequest request, string ownerId, CancellationToken ct = default);
    Task<PricingResult> CalculatePricingAsync(PricingCalculateRequest request, CancellationToken ct = default);
    Task<RecipePricingResponse?> GetRecipePricingAsync(Guid recipeId, string ownerId, CancellationToken ct = default);
}
