namespace EzStem.Domain.Entities;

public enum OrgMemberRole { Owner, Member }
public enum OrgMemberStatus { Pending, Active }

public class OrganizationMember
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string? UserId { get; set; }
    public OrgMemberRole Role { get; set; } = OrgMemberRole.Member;
    public OrgMemberStatus Status { get; set; } = OrgMemberStatus.Pending;
    public string InviteToken { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;
    public DateTime? JoinedAt { get; set; }
}
