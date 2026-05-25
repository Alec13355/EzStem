using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ApiControllerBase
{
    private readonly IEventService _eventService;
    private readonly IOrderService _orderService;
    private readonly IEventItemFlowerService _eventItemFlowerService;
    private readonly IImageStorageService _imageStorageService;

    public EventsController(IEventService eventService, IOrderService orderService, IEventItemFlowerService eventItemFlowerService, IImageStorageService imageStorageService)
    {
        _eventService = eventService;
        _orderService = orderService;
        _eventItemFlowerService = eventItemFlowerService;
        _imageStorageService = imageStorageService;
    }


    [HttpGet]
    public async Task<ActionResult<PagedResponse<EventResponse>>> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _eventService.GetEventsAsync(page, pageSize, search, GetEffectiveScopeId(), ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventResponse>> GetEvent(Guid id, CancellationToken ct = default)
    {
        var evt = await _eventService.GetEventByIdAsync(id, GetEffectiveScopeId(), ct);
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
            var evt = await _eventService.CreateEventAsync(request, GetEffectiveScopeId(), ct);
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
        try
        {
            var evt = await _eventService.UpdateEventAsync(id, request, GetEffectiveScopeId(), ct);
            if (evt == null) return NotFound();
            return Ok(evt);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken ct = default)
    {
        var deleted = await _eventService.DeleteEventAsync(id, GetEffectiveScopeId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("{id}/summary")]
    public async Task<ActionResult<EventSummaryResponse>> GetEventSummary(Guid id, CancellationToken ct = default)
    {
        var summary = await _eventService.GetEventSummaryAsync(id, GetEffectiveScopeId(), ct);
        if (summary == null) return NotFound();
        return Ok(summary);
    }

    [HttpGet("{id}/production-sheet")]
    public async Task<ActionResult<ProductionSheetResponse>> GetProductionSheet(Guid id, CancellationToken ct = default)
    {
        var sheet = await _eventService.GetProductionSheetAsync(id, GetEffectiveScopeId(), ct);
        if (sheet == null) return NotFound();
        return Ok(sheet);
    }

    [HttpGet("{id}/recipe-summary")]
    public async Task<ActionResult<EventRecipeSummaryResponse>> GetEventRecipeSummary(Guid id, CancellationToken ct = default)
    {
        try
        {
            var summary = await _eventItemFlowerService.GetEventRecipeSummaryAsync(id, GetEffectiveScopeId(), ct);
            return Ok(summary);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/recipes")]
    public async Task<ActionResult<EventRecipeResponse>> AddRecipeToEvent(
        Guid id,
        [FromBody] AddEventRecipeRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var eventRecipe = await _eventService.AddRecipeToEventAsync(id, request, GetEffectiveScopeId(), ct);
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
        var eventRecipe = await _eventService.UpdateEventRecipeAsync(id, recipeId, request, GetEffectiveScopeId(), ct);
        if (eventRecipe == null) return NotFound();
        return Ok(eventRecipe);
    }

    [HttpDelete("{id}/recipes/{recipeId}")]
    public async Task<IActionResult> RemoveRecipeFromEvent(
        Guid id,
        Guid recipeId,
        CancellationToken ct = default)
    {
        var deleted = await _eventService.RemoveRecipeFromEventAsync(id, recipeId, GetEffectiveScopeId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/generate-order")]
    public async Task<ActionResult<OrderResponse>> GenerateOrder(Guid id, CancellationToken ct = default)
    {
        try
        {
            var order = await _orderService.GenerateOrderAsync(id, GetEffectiveScopeId(), ct);
            return CreatedAtAction("GetOrder", "Orders", new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<EventResponse>> CompleteEvent(Guid id, [FromBody] CompleteEventRequest request, CancellationToken ct = default)
    {
        var evt = await _eventService.CompleteEventAsync(id, request, GetEffectiveScopeId(), ct);
        if (evt == null) return NotFound();
        return Ok(evt);
    }

    [HttpPost("{id}/receipt")]
    public async Task<ActionResult<UploadReceiptResponse>> UploadReceipt(Guid id, IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File size must be 10MB or less.");

        await using var stream = file.OpenReadStream();
        var url = await _imageStorageService.UploadImageAsync(stream, file.FileName, file.ContentType, ct);
        return Ok(new UploadReceiptResponse(url));
    }

    [HttpGet("pnl")]
    public async Task<ActionResult<PnlResponse>> GetPnl(CancellationToken ct = default)
    {
        var pnl = await _eventService.GetPnlAsync(GetEffectiveScopeId(), ct);
        return Ok(pnl);
    }
}

public record UploadReceiptResponse(string Url);
