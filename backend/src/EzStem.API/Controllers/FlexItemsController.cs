using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/events/{eventId}/flex-items")]
[Authorize]
public class FlexItemsController : ControllerBase
{
    private readonly IFlexItemService _flexItemService;

    public FlexItemsController(IFlexItemService flexItemService)
    {
        _flexItemService = flexItemService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlexItemResponse>>> GetFlexItems(
        Guid eventId, CancellationToken ct = default)
    {
        var items = await _flexItemService.GetFlexItemsAsync(eventId, ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<FlexItemResponse>> AddFlexItem(
        Guid eventId,
        [FromBody] AddFlexItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _flexItemService.AddFlexItemAsync(eventId, request, ct);
            return CreatedAtAction(nameof(GetFlexItems), new { eventId }, item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{flexItemId}")]
    public async Task<ActionResult<FlexItemResponse>> UpdateFlexItem(
        Guid eventId,
        Guid flexItemId,
        [FromBody] UpdateFlexItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _flexItemService.UpdateFlexItemAsync(eventId, flexItemId, request, ct);
            if (item == null) return NotFound();
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{flexItemId}")]
    public async Task<IActionResult> DeleteFlexItem(
        Guid eventId,
        Guid flexItemId,
        CancellationToken ct = default)
    {
        var deleted = await _flexItemService.DeleteFlexItemAsync(eventId, flexItemId, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
