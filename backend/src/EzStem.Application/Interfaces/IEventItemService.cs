using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventItemService
{
    Task<IEnumerable<EventItemResponse>> GetItemsAsync(Guid eventId, string ownerId, CancellationToken ct = default);
    Task<EventItemResponse?> GetItemAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default);
    Task<EventItemResponse> CreateItemAsync(Guid eventId, CreateEventItemRequest request, string ownerId, CancellationToken ct = default);
    Task<EventItemResponse?> UpdateItemAsync(Guid eventId, Guid itemId, UpdateEventItemRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteItemAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default);
    Task<IEnumerable<EventItemResponse>> GetItemsFromLastEventAsync(Guid currentEventId, string ownerId, CancellationToken ct = default);
}
