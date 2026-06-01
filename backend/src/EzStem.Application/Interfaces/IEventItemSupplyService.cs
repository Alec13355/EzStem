using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventItemSupplyService
{
    Task<IEnumerable<EventItemSupplyResponse>> GetSuppliesAsync(Guid eventId, Guid itemId, string ownerId, CancellationToken ct = default);
    Task<EventItemSupplyResponse> CreateSupplyAsync(Guid eventId, Guid itemId, CreateEventItemSupplyRequest request, string ownerId, CancellationToken ct = default);
    Task<EventItemSupplyResponse?> UpdateSupplyAsync(Guid eventId, Guid itemId, Guid supplyId, UpdateEventItemSupplyRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteSupplyAsync(Guid eventId, Guid itemId, Guid supplyId, string ownerId, CancellationToken ct = default);
}
