using EzStem.Application.DTOs;
using EzStem.Application.Exceptions;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/events/{eventId}/event-flowers")]
[Authorize]
public class EventFlowersController : ControllerBase
{
    private readonly IEventFlowerService _eventFlowerService;

    public EventFlowersController(IEventFlowerService eventFlowerService)
    {
        _eventFlowerService = eventFlowerService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventFlowerResponse>>> GetFlowers(
        Guid eventId, CancellationToken ct = default)
    {
        try
        {
            var flowers = await _eventFlowerService.GetFlowersAsync(eventId, GetUserId(), ct);
            return Ok(flowers);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{flowerId}")]
    public async Task<ActionResult<EventFlowerResponse>> GetFlower(
        Guid eventId, Guid flowerId, CancellationToken ct = default)
    {
        var flower = await _eventFlowerService.GetFlowerAsync(eventId, flowerId, GetUserId(), ct);
        if (flower == null) return NotFound();
        return Ok(flower);
    }

    [HttpPost]
    public async Task<ActionResult<EventFlowerResponse>> CreateFlower(
        Guid eventId,
        [FromBody] CreateEventFlowerRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var flower = await _eventFlowerService.CreateFlowerAsync(eventId, request, GetUserId(), ct);
            return CreatedAtAction(nameof(GetFlower), new { eventId, flowerId = flower.Id }, flower);
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

    [HttpPut("{flowerId}")]
    public async Task<ActionResult<EventFlowerResponse>> UpdateFlower(
        Guid eventId,
        Guid flowerId,
        [FromBody] UpdateEventFlowerRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var flower = await _eventFlowerService.UpdateFlowerAsync(eventId, flowerId, request, GetUserId(), ct);
            if (flower == null) return NotFound();
            return Ok(flower);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{flowerId}")]
    public async Task<IActionResult> DeleteFlower(
        Guid eventId,
        Guid flowerId,
        CancellationToken ct = default)
    {
        try
        {
            var deleted = await _eventFlowerService.DeleteFlowerAsync(eventId, flowerId, GetUserId(), ct);
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (FlowerInUseException ex)
        {
            return Conflict(ex.Message);
        }
    }
}
