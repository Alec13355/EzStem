using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/user-settings")]
[Authorize]
public class UserSettingsController : ControllerBase
{
    private readonly IUserSettingsService _userSettingsService;

    public UserSettingsController(IUserSettingsService userSettingsService)
    {
        _userSettingsService = userSettingsService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new InvalidOperationException("User ID not found");

    [HttpGet]
    public async Task<ActionResult<UserSettingsResponse>> GetSettings(CancellationToken ct = default)
    {
        var result = await _userSettingsService.GetSettingsAsync(GetUserId(), ct);
        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<UserSettingsResponse>> UpdateSettings(
        [FromBody] UpdateUserSettingsRequest request,
        CancellationToken ct = default)
    {
        var result = await _userSettingsService.UpsertSettingsAsync(GetUserId(), request, ct);
        return Ok(result);
    }
}
