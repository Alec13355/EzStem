using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventItemFlowerService
{
    Task<IEnumerable<EventItemFlowerResponse>> GetRecipeAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default);
    Task<EventItemFlowerResponse> AddFlowerToRecipeAsync(Guid eventId, Guid itemId, CreateEventItemFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<EventItemFlowerResponse?> UpdateRecipeEntryAsync(Guid eventId, Guid itemId, Guid entryId, UpdateEventItemFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteRecipeEntryAsync(Guid eventId, Guid itemId, Guid entryId, string ownerId, CancellationToken ct = default);
    Task<EventRecipeSummaryResponse> GetEventRecipeSummaryAsync(Guid eventId, string ownerId, CancellationToken ct = default);
}
