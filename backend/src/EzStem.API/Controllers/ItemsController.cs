using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly IItemService _itemService;

    public ItemsController(IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<ItemResponse>>> GetItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _itemService.GetItemsAsync(page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ItemResponse>> GetItem(Guid id, CancellationToken ct = default)
    {
        var item = await _itemService.GetItemByIdAsync(id, ct);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ItemResponse>> CreateItem(
        [FromBody] CreateItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _itemService.CreateItemAsync(request, ct);
            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ItemResponse>> UpdateItem(
        Guid id,
        [FromBody] UpdateItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var item = await _itemService.UpdateItemAsync(id, request, ct);
            if (item == null) return NotFound();
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken ct = default)
    {
        var deleted = await _itemService.DeleteItemAsync(id, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
