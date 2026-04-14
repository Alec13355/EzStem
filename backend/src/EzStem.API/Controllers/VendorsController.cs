using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendorsController : ControllerBase
{
    private readonly IVendorService _vendorService;

    public VendorsController(IVendorService vendorService)
    {
        _vendorService = vendorService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<VendorResponse>>> GetVendors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _vendorService.GetVendorsAsync(page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VendorResponse>> GetVendor(Guid id, CancellationToken ct = default)
    {
        var vendor = await _vendorService.GetVendorByIdAsync(id, ct);
        if (vendor == null) return NotFound();
        return Ok(vendor);
    }

    [HttpPost]
    public async Task<ActionResult<VendorResponse>> CreateVendor(
        [FromBody] CreateVendorRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var vendor = await _vendorService.CreateVendorAsync(request, ct);
            return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, vendor);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VendorResponse>> UpdateVendor(
        Guid id,
        [FromBody] UpdateVendorRequest request,
        CancellationToken ct = default)
    {
        var vendor = await _vendorService.UpdateVendorAsync(id, request, ct);
        if (vendor == null) return NotFound();
        return Ok(vendor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVendor(Guid id, CancellationToken ct = default)
    {
        var deleted = await _vendorService.DeleteVendorAsync(id, ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
