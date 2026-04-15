using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IItemService
{
    Task<PagedResponse<ItemResponse>> GetItemsAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default);
    Task<ItemResponse?> GetItemByIdAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<ItemResponse> CreateItemAsync(CreateItemRequest request, string ownerId, CancellationToken ct = default);
    Task<ItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteItemAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<IEnumerable<SeasonalWarning>> GetSeasonalWarningsAsync(DateTime eventDate, CancellationToken ct = default);
}
