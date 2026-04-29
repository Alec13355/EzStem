using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/events/{eventId}/event-items")]
[Authorize]
public class EventItemsController : ControllerBase
{
    private readonly IEventItemService _eventItemService;

    public EventItemsController(IEventItemService eventItemService)
    {
        _eventItemService = eventItemService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventItemResponse>>> GetItems(
        Guid eventId, CancellationToken ct = default)
    {
        try
        {
            var items = await _eventItemService.GetItemsAsync(eventId, GetUserId(), ct);
            return Ok(items);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("from-last-event")]
    public async Task<ActionResult<IEnumerable<EventItemResponse>>> GetItemsFromLastEvent(
        Guid eventId, CancellationToken ct = default)
    {
        try
        {
            var items = await _eventItemService.GetItemsFromLastEventAsync(eventId, GetUserId(), ct);
            return Ok(items);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{itemId}")]
    public async Task<ActionResult<EventItemResponse>> GetItem(
        Guid eventId, Guid itemId, CancellationToken ct = default)
    {
        var item = await _eventItemService.GetItemAsync(eventId, itemId, GetUserId(), ct);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<EventItemResponse>> CreateItem(
        Guid eventId,
        [FromBody] CreateEventItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _eventItemService.CreateItemAsync(eventId, request, GetUserId(), ct);
            return CreatedAtAction(nameof(GetItem), new { eventId, itemId = item.Id }, item);
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

    [HttpPut("{itemId}")]
    public async Task<ActionResult<EventItemResponse>> UpdateItem(
        Guid eventId,
        Guid itemId,
        [FromBody] UpdateEventItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _eventItemService.UpdateItemAsync(eventId, itemId, request, GetUserId(), ct);
            if (item == null) return NotFound();
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{itemId}")]
    public async Task<IActionResult> DeleteItem(
        Guid eventId,
        Guid itemId,
        CancellationToken ct = default)
    {
        var deleted = await _eventItemService.DeleteItemAsync(eventId, itemId, GetUserId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
