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

    public async Task<PricingConfigResponse> GetPricingConfigAsync(string ownerId, CancellationToken ct = default)
    {
        var config = await _context.PricingConfigs.FirstOrDefaultAsync(p => p.OwnerId == ownerId, ct);
        if (config == null)
        {
            config = new PricingConfig
            {
                Id = Guid.NewGuid(),
                OwnerId = ownerId,
                DefaultMarkupPercentage = 35.0m,
                DefaultLaborRate = 25.0m
            };
            _context.PricingConfigs.Add(config);
            await _context.SaveChangesAsync(ct);
        }

        return new PricingConfigResponse(config.Id.ToString(), config.DefaultMarkupPercentage, config.DefaultLaborRate);
    }

    public async Task<PricingConfigResponse> UpdatePricingConfigAsync(PricingConfigRequest request, string ownerId, CancellationToken ct = default)
    {
        var config = await _context.PricingConfigs.FirstOrDefaultAsync(p => p.OwnerId == ownerId, ct);
        if (config == null)
        {
            config = new PricingConfig { Id = Guid.NewGuid(), OwnerId = ownerId };
            _context.PricingConfigs.Add(config);
        }

        config.DefaultMarkupPercentage = request.DefaultMarkupPercentage;
        config.DefaultLaborRate = request.DefaultLaborRate;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return new PricingConfigResponse(config.Id.ToString(), config.DefaultMarkupPercentage, config.DefaultLaborRate);
    }

    public Task<PricingResult> CalculatePricingAsync(PricingCalculateRequest request, CancellationToken ct = default)
    {
        var totalCost = request.CostOfGoods + request.LaborCost;
        var retailPrice = totalCost * (1 + request.MarkupPercentage / 100);
        var profit = retailPrice - totalCost;
        var marginPercent = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;

        return Task.FromResult(new PricingResult(request.CostOfGoods, request.LaborCost, totalCost, retailPrice, profit, marginPercent));
    }

    public async Task<RecipePricingResponse?> GetRecipePricingAsync(Guid recipeId, string ownerId, CancellationToken ct = default)
    {
        var recipeCost = await _recipeService.GetRecipeCostAsync(recipeId, ct);
        if (recipeCost == null) return null;

        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == recipeId && r.OwnerId == ownerId, ct);
        if (recipe == null) return null;

        var config = await GetPricingConfigAsync(ownerId, ct);

        var pricingRequest = new PricingCalculateRequest(recipeCost.ItemsCost, recipeCost.LaborCost, config.DefaultMarkupPercentage);
        var pricing = await CalculatePricingAsync(pricingRequest, ct);
        var isUnderpriced = pricing.MarginPercent < 25;

        return new RecipePricingResponse(recipeId, recipe.Name, pricing, isUnderpriced);
    }
}
