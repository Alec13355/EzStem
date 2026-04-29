using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventFlowerService
{
    Task<IEnumerable<EventFlowerResponse>> GetFlowersAsync(Guid eventId, string ownerId, CancellationToken ct = default);
    Task<EventFlowerResponse?> GetFlowerAsync(Guid eventId, Guid flowerId, string ownerId, CancellationToken ct = default);
    Task<EventFlowerResponse> CreateFlowerAsync(Guid eventId, CreateEventFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<EventFlowerResponse?> UpdateFlowerAsync(Guid eventId, Guid flowerId, UpdateEventFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteFlowerAsync(Guid eventId, Guid flowerId, string ownerId, CancellationToken ct = default);
}
