using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EzStem.API.Infrastructure;

public class OrgScopeMiddleware
{
    private readonly RequestDelegate _next;

    public OrgScopeMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, EzStemDbContext db)
    {
        var activeOrgHeader = context.Request.Headers["X-Active-Org"].FirstOrDefault();

        if (!string.IsNullOrEmpty(activeOrgHeader) && Guid.TryParse(activeOrgHeader, out var orgId))
        {
            var userId = GetUserId(context);
            if (userId != null)
            {
                var org = await db.Organizations
                    .Where(o => o.Id == orgId)
                    .Select(o => new { o.Id, o.FounderUserId })
                    .FirstOrDefaultAsync();

                if (org != null)
                {
                    var isMember = await db.OrganizationMembers
                        .AnyAsync(m => m.OrganizationId == orgId && m.UserId == userId &&
                                       m.Status == EzStem.Domain.Entities.OrgMemberStatus.Active);

                    if (isMember)
                    {
                        context.Items["EffectiveScopeId"] = org.FounderUserId;
                    }
                }
            }
        }

        await _next(context);
    }

    private static string? GetUserId(HttpContext context)
    {
        var user = context.User;
        return user.FindFirstValue("oid")
            ?? user.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");
    }
}
