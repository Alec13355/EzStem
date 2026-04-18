using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PricingController : ControllerBase
{
    private readonly IPricingService _pricingService;

    public PricingController(IPricingService pricingService)
    {
        _pricingService = pricingService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet("config")]
    public async Task<ActionResult<PricingConfigResponse>> GetConfig(CancellationToken ct = default)
    {
        var config = await _pricingService.GetPricingConfigAsync(GetUserId(), ct);
        return Ok(config);
    }

    [HttpPost("config")]
    public async Task<ActionResult<PricingConfigResponse>> UpdateConfig(
        [FromBody] PricingConfigRequest request,
        CancellationToken ct = default)
    {
        var config = await _pricingService.UpdatePricingConfigAsync(request, GetUserId(), ct);
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
