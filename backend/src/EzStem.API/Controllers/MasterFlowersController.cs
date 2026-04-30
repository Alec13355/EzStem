using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/master-flowers")]
[Authorize]
public class MasterFlowersController : ControllerBase
{
    private readonly IMasterFlowerService _masterFlowerService;
    private readonly IOcrService _ocrService;

    public MasterFlowersController(IMasterFlowerService masterFlowerService, IOcrService ocrService)
    {
        _masterFlowerService = masterFlowerService;
        _ocrService = ocrService;
    }

    private string GetOwnerId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? string.Empty;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MasterFlowerResponse>>> GetAll(
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        var flowers = await _masterFlowerService.GetAllAsync(ownerId, category, ct);
        return Ok(flowers);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories(CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        var categories = await _masterFlowerService.GetCategoriesAsync(ownerId, ct);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MasterFlowerResponse>> GetById(Guid id, CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        var flower = await _masterFlowerService.GetByIdAsync(id, ownerId, ct);
        if (flower == null) return NotFound();
        return Ok(flower);
    }

    [HttpPost]
    public async Task<ActionResult<MasterFlowerResponse>> Create(
        [FromBody] CreateMasterFlowerRequest request,
        CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        try
        {
            var flower = await _masterFlowerService.CreateAsync(request, ownerId, ct);
            return CreatedAtAction(nameof(GetById), new { id = flower.Id }, flower);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MasterFlowerResponse>> Update(
        Guid id,
        [FromBody] UpdateMasterFlowerRequest request,
        CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        try
        {
            var flower = await _masterFlowerService.UpdateAsync(id, request, ownerId, ct);
            if (flower == null) return NotFound();
            return Ok(flower);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        var deleted = await _masterFlowerService.DeleteAsync(id, ownerId, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("import-pdf")]
    public async Task<ActionResult<OcrImportResult>> ImportPdf(
        IFormFile file,
        CancellationToken ct = default)
    {
        var ownerId = GetOwnerId();
        if (string.IsNullOrEmpty(ownerId)) return Unauthorized();

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        if (!file.ContentType.Contains("pdf") && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "File must be a PDF" });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _masterFlowerService.ImportFromPdfAsync(stream, ownerId, _ocrService, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Import failed: {ex.Message}" });
        }
    }
}
