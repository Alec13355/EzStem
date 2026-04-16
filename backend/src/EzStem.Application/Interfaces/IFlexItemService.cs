using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IFlexItemService
{
    Task<IEnumerable<FlexItemResponse>> GetFlexItemsAsync(Guid eventId, CancellationToken ct = default);
    Task<FlexItemResponse> AddFlexItemAsync(Guid eventId, AddFlexItemRequest request, CancellationToken ct = default);
    Task<FlexItemResponse?> UpdateFlexItemAsync(Guid eventId, Guid flexItemId, UpdateFlexItemRequest request, CancellationToken ct = default);
    Task<bool> DeleteFlexItemAsync(Guid eventId, Guid flexItemId, CancellationToken ct = default);
}
