using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/user-settings")]
[Authorize]
public class UserSettingsController : ApiControllerBase
{
    private readonly IUserSettingsService _userSettingsService;

    public UserSettingsController(IUserSettingsService userSettingsService)
    {
        _userSettingsService = userSettingsService;
    }

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
