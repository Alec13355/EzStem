using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IOrderService _orderService;

    public EventsController(IEventService eventService, IOrderService orderService)
    {
        _eventService = eventService;
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<EventResponse>>> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _eventService.GetEventsAsync(page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventResponse>> GetEvent(Guid id, CancellationToken ct = default)
    {
        var evt = await _eventService.GetEventByIdAsync(id, ct);
        if (evt == null) return NotFound();
        return Ok(evt);
    }

    [HttpPost]
    public async Task<ActionResult<EventResponse>> CreateEvent(
        [FromBody] CreateEventRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var evt = await _eventService.CreateEventAsync(request, ct);
            return CreatedAtAction(nameof(GetEvent), new { id = evt.Id }, evt);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EventResponse>> UpdateEvent(
        Guid id,
        [FromBody] UpdateEventRequest request,
        CancellationToken ct = default)
    {
        var evt = await _eventService.UpdateEventAsync(id, request, ct);
        if (evt == null) return NotFound();
        return Ok(evt);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken ct = default)
    {
        var deleted = await _eventService.DeleteEventAsync(id, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("{id}/summary")]
    public async Task<ActionResult<EventSummaryResponse>> GetEventSummary(Guid id, CancellationToken ct = default)
    {
        var summary = await _eventService.GetEventSummaryAsync(id, ct);
        if (summary == null) return NotFound();
        return Ok(summary);
    }

    [HttpGet("{id}/production-sheet")]
    public async Task<ActionResult<ProductionSheetResponse>> GetProductionSheet(Guid id, CancellationToken ct = default)
    {
        var sheet = await _eventService.GetProductionSheetAsync(id, ct);
        if (sheet == null) return NotFound();
        return Ok(sheet);
    }

    [HttpPost("{id}/recipes")]
    public async Task<ActionResult<EventRecipeResponse>> AddRecipeToEvent(
        Guid id,
        [FromBody] AddEventRecipeRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var eventRecipe = await _eventService.AddRecipeToEventAsync(id, request, ct);
            if (eventRecipe == null) return NotFound();
            return CreatedAtAction(nameof(GetEvent), new { id }, eventRecipe);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}/recipes/{recipeId}")]
    public async Task<ActionResult<EventRecipeResponse>> UpdateEventRecipe(
        Guid id,
        Guid recipeId,
        [FromBody] UpdateEventRecipeRequest request,
        CancellationToken ct = default)
    {
        var eventRecipe = await _eventService.UpdateEventRecipeAsync(id, recipeId, request, ct);
        if (eventRecipe == null) return NotFound();
        return Ok(eventRecipe);
    }

    [HttpDelete("{id}/recipes/{recipeId}")]
    public async Task<IActionResult> RemoveRecipeFromEvent(
        Guid id,
        Guid recipeId,
        CancellationToken ct = default)
    {
        var deleted = await _eventService.RemoveRecipeFromEventAsync(id, recipeId, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/generate-order")]
    public async Task<ActionResult<OrderResponse>> GenerateOrder(Guid id, CancellationToken ct = default)
    {
        try
        {
            var order = await _orderService.GenerateOrderAsync(id, ct);
            return CreatedAtAction("GetOrder", "Orders", new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
