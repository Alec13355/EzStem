using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EzStem.Infrastructure.Services;

public class UserSettingsService : IUserSettingsService
{
    private readonly EzStemDbContext _context;

    public UserSettingsService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<UserSettingsResponse> GetSettingsAsync(string ownerId, CancellationToken ct = default)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.OwnerId == ownerId, ct);

        if (settings == null)
        {
            var defaultTheme = new UserTheme(new Dictionary<string, PageTheme>());
            return new UserSettingsResponse(Guid.Empty, defaultTheme, DateTime.UtcNow);
        }

        var theme = JsonSerializer.Deserialize<UserTheme>(settings.ThemeJson)
            ?? new UserTheme(new Dictionary<string, PageTheme>());

        return new UserSettingsResponse(settings.Id, theme, settings.UpdatedAt);
    }

    public async Task<UserSettingsResponse> UpsertSettingsAsync(string ownerId, UpdateUserSettingsRequest request, CancellationToken ct = default)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.OwnerId == ownerId, ct);

        var themeJson = JsonSerializer.Serialize(request.Theme);

        if (settings == null)
        {
            settings = new UserSettings
            {
                Id = Guid.NewGuid(),
                OwnerId = ownerId,
                ThemeJson = themeJson,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserSettings.Add(settings);
        }
        else
        {
            settings.ThemeJson = themeJson;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        return new UserSettingsResponse(settings.Id, request.Theme, settings.UpdatedAt);
    }
}
