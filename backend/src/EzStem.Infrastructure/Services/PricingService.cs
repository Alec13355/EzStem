using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class PricingService : IPricingService
{
    private readonly EzStemDbContext _context;
    private readonly IRecipeService _recipeService;

    public PricingService(EzStemDbContext context, IRecipeService recipeService)
    {
        _context = context;
        _recipeService = recipeService;
    }

    public async Task<PricingConfigResponse> GetPricingConfigAsync(CancellationToken ct = default)
    {
        var config = await _context.PricingConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new PricingConfig
            {
                Id = Guid.NewGuid(),
                MarkupFactor = 3.0m,
                OverheadPercent = 0.25m,
                LaborDefaultCost = 5.0m
            };
            _context.PricingConfigs.Add(config);
            await _context.SaveChangesAsync(ct);
        }

        return new PricingConfigResponse(config.MarkupFactor, config.OverheadPercent, config.LaborDefaultCost);
    }

    public async Task<PricingConfigResponse> UpdatePricingConfigAsync(PricingConfigRequest request, CancellationToken ct = default)
    {
        var config = await _context.PricingConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new PricingConfig { Id = Guid.NewGuid() };
            _context.PricingConfigs.Add(config);
        }

        config.MarkupFactor = request.MarkupFactor;
        config.OverheadPercent = request.OverheadPercent ?? config.OverheadPercent;
        config.LaborDefaultCost = request.LaborDefaultCost ?? config.LaborDefaultCost;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new PricingConfigResponse(config.MarkupFactor, config.OverheadPercent, config.LaborDefaultCost);
    }

    public Task<PricingResult> CalculatePricingAsync(PricingCalculateRequest request, CancellationToken ct = default)
    {
        var stemCost = request.CostOfGoods;
        var laborCost = request.LaborCost;
        var overheadCost = (stemCost + laborCost) * request.OverheadPercent;
        var totalCost = stemCost + laborCost + overheadCost;
        var retailPrice = totalCost * request.MarkupFactor;
        var profit = retailPrice - totalCost;
        var marginPercent = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;

        return Task.FromResult(new PricingResult(
            stemCost, laborCost, overheadCost,
            totalCost, retailPrice, profit, marginPercent
        ));
    }

    public async Task<RecipePricingResponse?> GetRecipePricingAsync(Guid recipeId, CancellationToken ct = default)
    {
        var recipeCost = await _recipeService.GetRecipeCostAsync(recipeId, ct);
        if (recipeCost == null) return null;

        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == recipeId, ct);
        if (recipe == null) return null;

        var config = await GetPricingConfigAsync(ct);

        var pricingRequest = new PricingCalculateRequest(
            recipeCost.ItemsCost,
            recipeCost.LaborCost,
            config.MarkupFactor,
            config.OverheadPercent
        );

        var pricing = await CalculatePricingAsync(pricingRequest, ct);
        var isUnderpriced = pricing.MarginPercent < 25;

        return new RecipePricingResponse(
            recipeId,
            recipe.Name,
            pricing,
            isUnderpriced
        );
    }
}
