using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/events/{eventId}/event-items/{itemId}/recipe")]
[Authorize]
public class EventItemFlowersController : ControllerBase
{
    private readonly IEventItemFlowerService _eventItemFlowerService;

    public EventItemFlowersController(IEventItemFlowerService eventItemFlowerService)
    {
        _eventItemFlowerService = eventItemFlowerService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventItemFlowerResponse>>> GetRecipeEntries(
        Guid eventId, Guid itemId, CancellationToken ct = default)
    {
        try
        {
            var entries = await _eventItemFlowerService.GetRecipeAsync(eventId, itemId, GetUserId(), ct);
            return Ok(entries);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<ActionResult<EventItemFlowerResponse>> AddFlowerToRecipe(
        Guid eventId,
        Guid itemId,
        [FromBody] CreateEventItemFlowerRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var entry = await _eventItemFlowerService.AddFlowerToRecipeAsync(eventId, itemId, request, GetUserId(), ct);
            return CreatedAtAction(nameof(GetRecipeEntries), new { eventId, itemId }, entry);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{entryId}")]
    public async Task<ActionResult<EventItemFlowerResponse>> UpdateRecipeEntry(
        Guid eventId,
        Guid itemId,
        Guid entryId,
        [FromBody] UpdateEventItemFlowerRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var entry = await _eventItemFlowerService.UpdateRecipeEntryAsync(eventId, itemId, entryId, request, GetUserId(), ct);
            if (entry == null) return NotFound();
            return Ok(entry);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{entryId}")]
    public async Task<IActionResult> DeleteRecipeEntry(
        Guid eventId,
        Guid itemId,
        Guid entryId,
        CancellationToken ct = default)
    {
        var deleted = await _eventItemFlowerService.DeleteRecipeEntryAsync(eventId, itemId, entryId, GetUserId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
