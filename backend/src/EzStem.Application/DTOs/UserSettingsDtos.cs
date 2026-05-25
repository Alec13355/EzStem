namespace EzStem.Application.DTOs;

public record PageTheme(string? PrimaryBackground, string? CardBackground);
public record UserTheme(Dictionary<string, PageTheme> Pages);
public record UserSettingsResponse(Guid Id, UserTheme Theme, Guid? DefaultOrganizationId, DateTime UpdatedAt);
public record UpdateUserSettingsRequest(UserTheme Theme, Guid? DefaultOrganizationId = null);
