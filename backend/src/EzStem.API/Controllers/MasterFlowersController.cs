using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/master-flowers")]
[Authorize]
public class MasterFlowersController : ApiControllerBase
{
    private readonly IMasterFlowerService _masterFlowerService;
    private readonly IOcrService _ocrService;

    public MasterFlowersController(IMasterFlowerService masterFlowerService, IOcrService ocrService)
    {
        _masterFlowerService = masterFlowerService;
        _ocrService = ocrService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MasterFlowerResponse>>> GetAll(
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var flowers = await _masterFlowerService.GetAllAsync(GetEffectiveScopeId(), category, ct);
        return Ok(flowers);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories(CancellationToken ct = default)
    {
        var categories = await _masterFlowerService.GetCategoriesAsync(GetEffectiveScopeId(), ct);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MasterFlowerResponse>> GetById(Guid id, CancellationToken ct = default)
    {
        var flower = await _masterFlowerService.GetByIdAsync(id, GetEffectiveScopeId(), ct);
        if (flower == null) return NotFound();
        return Ok(flower);
    }

    [HttpPost]
    public async Task<ActionResult<MasterFlowerResponse>> Create(
        [FromBody] CreateMasterFlowerRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var flower = await _masterFlowerService.CreateAsync(request, GetEffectiveScopeId(), ct);
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
        try
        {
            var flower = await _masterFlowerService.UpdateAsync(id, request, GetEffectiveScopeId(), ct);
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
        var deleted = await _masterFlowerService.DeleteAsync(id, GetEffectiveScopeId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("import-pdf")]
    public async Task<ActionResult<OcrImportResult>> ImportPdf(
        IFormFile file,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        if (!file.ContentType.Contains("pdf") && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "File must be a PDF" });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _masterFlowerService.ImportFromPdfAsync(stream, GetEffectiveScopeId(), _ocrService, ct);
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
