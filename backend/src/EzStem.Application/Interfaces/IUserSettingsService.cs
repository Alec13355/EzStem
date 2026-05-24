using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IUserSettingsService
{
    Task<UserSettingsResponse> GetSettingsAsync(string ownerId, CancellationToken ct = default);
    Task<UserSettingsResponse> UpsertSettingsAsync(string ownerId, UpdateUserSettingsRequest request, CancellationToken ct = default);
}
