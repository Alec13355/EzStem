using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class OrganizationService : IOrganizationService
{
    private readonly EzStemDbContext _context;

    public OrganizationService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<OrgResponse> CreateOrgAsync(string userId, CreateOrgRequest request, CancellationToken ct = default)
    {
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            FounderUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var ownerMember = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            UserId = userId,
            Role = OrgMemberRole.Owner,
            Status = OrgMemberStatus.Active,
            InviteToken = Guid.NewGuid().ToString("N"),
            InvitedAt = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(org);
        _context.OrganizationMembers.Add(ownerMember);
        await _context.SaveChangesAsync(ct);

        return MapOrg(org, userId);
    }

    public async Task<IEnumerable<OrgResponse>> GetMyOrgsAsync(string userId, CancellationToken ct = default)
    {
        var orgs = await _context.OrganizationMembers
            .Where(m => m.UserId == userId && m.Status == OrgMemberStatus.Active)
            .Include(m => m.Organization)
            .Select(m => m.Organization)
            .ToListAsync(ct);

        return orgs.Select(o => MapOrg(o, userId));
    }

    public async Task<OrgInviteResponse> CreateInviteAsync(Guid orgId, string requestingUserId, string baseUrl, CancellationToken ct = default)
    {
        var org = await _context.Organizations.FindAsync([orgId], ct)
            ?? throw new KeyNotFoundException("Organization not found");

        if (org.FounderUserId != requestingUserId)
            throw new UnauthorizedAccessException("Only the org owner can create invite links");

        var invite = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            UserId = null,
            Role = OrgMemberRole.Member,
            Status = OrgMemberStatus.Pending,
            InviteToken = Guid.NewGuid().ToString("N"),
            InvitedAt = DateTime.UtcNow
        };

        _context.OrganizationMembers.Add(invite);
        await _context.SaveChangesAsync(ct);

        var url = $"{baseUrl}/join?token={invite.InviteToken}";
        return new OrgInviteResponse(invite.InviteToken, url);
    }

    public async Task<OrgPreviewResponse?> GetInvitePreviewAsync(string token, CancellationToken ct = default)
    {
        var member = await _context.OrganizationMembers
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.InviteToken == token && m.Status == OrgMemberStatus.Pending, ct);

        if (member == null) return null;

        return new OrgPreviewResponse(member.Organization.Id, member.Organization.Name, member.Organization.FounderUserId);
    }

    public async Task<AcceptInviteResponse> AcceptInviteAsync(string token, string userId, CancellationToken ct = default)
    {
        var member = await _context.OrganizationMembers
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.InviteToken == token && m.Status == OrgMemberStatus.Pending, ct)
            ?? throw new KeyNotFoundException("Invite not found or already used");

        var alreadyMember = await _context.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == member.OrganizationId && m.UserId == userId && m.Status == OrgMemberStatus.Active, ct);

        if (alreadyMember)
            throw new InvalidOperationException("You are already a member of this organization");

        member.UserId = userId;
        member.Status = OrgMemberStatus.Active;
        member.JoinedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new AcceptInviteResponse(member.OrganizationId, member.Organization.Name);
    }

    public async Task<IEnumerable<OrgMemberResponse>> GetMembersAsync(Guid orgId, string requestingUserId, CancellationToken ct = default)
    {
        var isMember = await _context.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == orgId && m.UserId == requestingUserId && m.Status == OrgMemberStatus.Active, ct);

        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this organization");

        var members = await _context.OrganizationMembers
            .Where(m => m.OrganizationId == orgId)
            .ToListAsync(ct);

        return members.Select(m => new OrgMemberResponse(
            m.Id, m.UserId, m.Role.ToString(), m.Status.ToString(), m.InvitedAt, m.JoinedAt));
    }

    public async Task RemoveMemberAsync(Guid orgId, Guid memberId, string requestingUserId, CancellationToken ct = default)
    {
        var org = await _context.Organizations.FindAsync([orgId], ct)
            ?? throw new KeyNotFoundException("Organization not found");

        if (org.FounderUserId != requestingUserId)
            throw new UnauthorizedAccessException("Only the org owner can remove members");

        var member = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.Id == memberId && m.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Member not found");

        if (member.Role == OrgMemberRole.Owner)
            throw new InvalidOperationException("Cannot remove the org owner");

        _context.OrganizationMembers.Remove(member);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteOrgAsync(Guid orgId, string requestingUserId, CancellationToken ct = default)
    {
        var org = await _context.Organizations.FindAsync([orgId], ct)
            ?? throw new KeyNotFoundException("Organization not found");

        if (org.FounderUserId != requestingUserId)
            throw new UnauthorizedAccessException("Only the org owner can delete the team");

        _context.Organizations.Remove(org);
        await _context.SaveChangesAsync(ct);
    }

    private static OrgResponse MapOrg(Organization org, string userId) =>
        new(org.Id, org.Name, org.FounderUserId, org.CreatedAt, org.FounderUserId == userId);
}
