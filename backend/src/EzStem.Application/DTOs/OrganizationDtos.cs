namespace EzStem.Application.DTOs;

public record CreateOrgRequest(string Name);

public record OrgResponse(Guid Id, string Name, string FounderUserId, DateTime CreatedAt, bool IsOwner);

public record OrgMemberResponse(Guid Id, string? UserId, string Role, string Status, DateTime InvitedAt, DateTime? JoinedAt);

public record OrgInviteResponse(string InviteToken, string InviteUrl);

public record OrgPreviewResponse(Guid OrgId, string OrgName, string FounderUserId);

public record AcceptInviteResponse(Guid OrgId, string OrgName);
