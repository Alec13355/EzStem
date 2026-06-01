using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/events/{eventId}/event-items/{itemId}/supplies")]
[Authorize]
public class EventItemSuppliesController : ApiControllerBase
{
    private readonly IEventItemSupplyService _supplyService;

    public EventItemSuppliesController(IEventItemSupplyService supplyService)
    {
        _supplyService = supplyService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventItemSupplyResponse>>> GetSupplies(
        Guid eventId, Guid itemId, CancellationToken ct = default)
    {
        try
        {
            var supplies = await _supplyService.GetSuppliesAsync(eventId, itemId, GetEffectiveScopeId(), ct);
            return Ok(supplies);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<ActionResult<EventItemSupplyResponse>> CreateSupply(
        Guid eventId, Guid itemId,
        [FromBody] CreateEventItemSupplyRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var supply = await _supplyService.CreateSupplyAsync(eventId, itemId, request, GetEffectiveScopeId(), ct);
            return CreatedAtAction(nameof(GetSupplies), new { eventId, itemId }, supply);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{supplyId}")]
    public async Task<ActionResult<EventItemSupplyResponse>> UpdateSupply(
        Guid eventId, Guid itemId, Guid supplyId,
        [FromBody] UpdateEventItemSupplyRequest request,
        CancellationToken ct = default)
    {
        var supply = await _supplyService.UpdateSupplyAsync(eventId, itemId, supplyId, request, GetEffectiveScopeId(), ct);
        if (supply == null) return NotFound();
        return Ok(supply);
    }

    [HttpDelete("{supplyId}")]
    public async Task<IActionResult> DeleteSupply(
        Guid eventId, Guid itemId, Guid supplyId,
        CancellationToken ct = default)
    {
        var deleted = await _supplyService.DeleteSupplyAsync(eventId, itemId, supplyId, GetEffectiveScopeId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
