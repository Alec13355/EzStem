using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IOrganizationService
{
    Task<OrgResponse> CreateOrgAsync(string userId, CreateOrgRequest request, CancellationToken ct = default);
    Task<IEnumerable<OrgResponse>> GetMyOrgsAsync(string userId, CancellationToken ct = default);
    Task<OrgInviteResponse> CreateInviteAsync(Guid orgId, string requestingUserId, string baseUrl, CancellationToken ct = default);
    Task<OrgPreviewResponse?> GetInvitePreviewAsync(string token, CancellationToken ct = default);
    Task<AcceptInviteResponse> AcceptInviteAsync(string token, string userId, CancellationToken ct = default);
    Task<IEnumerable<OrgMemberResponse>> GetMembersAsync(Guid orgId, string requestingUserId, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid orgId, Guid memberId, string requestingUserId, CancellationToken ct = default);
    Task DeleteOrgAsync(Guid orgId, string requestingUserId, CancellationToken ct = default);
}
