using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly IItemService _itemService;
    private readonly IImageStorageService _imageStorageService;

    public ItemsController(IItemService itemService, IImageStorageService imageStorageService)
    {
        _itemService = itemService;
        _imageStorageService = imageStorageService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet]
    public async Task<ActionResult<PagedResponse<ItemResponse>>> GetItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _itemService.GetItemsAsync(page, pageSize, search, GetUserId(), ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ItemResponse>> GetItem(Guid id, CancellationToken ct = default)
    {
        var item = await _itemService.GetItemByIdAsync(id, GetUserId(), ct);
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
            var item = await _itemService.CreateItemAsync(request, GetUserId(), ct);
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
            var item = await _itemService.UpdateItemAsync(id, request, GetUserId(), ct);
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
        var deleted = await _itemService.DeleteItemAsync(id, GetUserId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("upload-image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest("Only JPG, PNG, and WebP images are allowed.");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("File size must be 5MB or less.");

        await using var stream = file.OpenReadStream();
        var url = await _imageStorageService.UploadImageAsync(stream, file.FileName, file.ContentType, ct);
        return Ok(new UploadImageResponse(url));
    }
}
