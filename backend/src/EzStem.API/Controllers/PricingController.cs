using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricingController : ControllerBase
{
    private readonly IPricingService _pricingService;

    public PricingController(IPricingService pricingService)
    {
        _pricingService = pricingService;
    }

    [HttpGet("config")]
    public async Task<ActionResult<PricingConfigResponse>> GetConfig(CancellationToken ct = default)
    {
        var config = await _pricingService.GetPricingConfigAsync(ct);
        return Ok(config);
    }

    [HttpPost("config")]
    public async Task<ActionResult<PricingConfigResponse>> UpdateConfig(
        [FromBody] PricingConfigRequest request,
        CancellationToken ct = default)
    {
        var config = await _pricingService.UpdatePricingConfigAsync(request, ct);
        return Ok(config);
    }

    [HttpPost("calculate")]
    public async Task<ActionResult<PricingResult>> Calculate(
        [FromBody] PricingCalculateRequest request,
        CancellationToken ct = default)
    {
        var result = await _pricingService.CalculatePricingAsync(request, ct);
        return Ok(result);
    }
}
