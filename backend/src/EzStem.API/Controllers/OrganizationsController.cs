using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : ApiControllerBase
{
    private readonly IOrganizationService _orgService;

    public OrganizationsController(IOrganizationService orgService)
    {
        _orgService = orgService;
    }

    [HttpPost]
    public async Task<ActionResult<OrgResponse>> CreateOrg(
        [FromBody] CreateOrgRequest request,
        CancellationToken ct = default)
    {
        var org = await _orgService.CreateOrgAsync(GetUserId(), request, ct);
        return Ok(org);
    }

    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<OrgResponse>>> GetMyOrgs(CancellationToken ct = default)
    {
        var orgs = await _orgService.GetMyOrgsAsync(GetUserId(), ct);
        return Ok(orgs);
    }

    [HttpPost("{id}/invite")]
    public async Task<ActionResult<OrgInviteResponse>> CreateInvite(Guid id, CancellationToken ct = default)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        try
        {
            var invite = await _orgService.CreateInviteAsync(id, GetUserId(), baseUrl, ct);
            return Ok(invite);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("preview/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<OrgPreviewResponse>> GetInvitePreview(string token, CancellationToken ct = default)
    {
        var preview = await _orgService.GetInvitePreviewAsync(token, ct);
        if (preview == null) return NotFound("Invite not found or already used");
        return Ok(preview);
    }

    [HttpPost("join/{token}")]
    public async Task<ActionResult<AcceptInviteResponse>> JoinOrg(string token, CancellationToken ct = default)
    {
        try
        {
            var result = await _orgService.AcceptInviteAsync(token, GetUserId(), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<IEnumerable<OrgMemberResponse>>> GetMembers(Guid id, CancellationToken ct = default)
    {
        try
        {
            var members = await _orgService.GetMembersAsync(id, GetUserId(), ct);
            return Ok(members);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<ActionResult> RemoveMember(Guid id, Guid memberId, CancellationToken ct = default)
    {
        try
        {
            await _orgService.RemoveMemberAsync(id, memberId, GetUserId(), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
