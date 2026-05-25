using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    protected string GetEffectiveScopeId() =>
        HttpContext.Items["EffectiveScopeId"] as string ?? GetUserId();
}
