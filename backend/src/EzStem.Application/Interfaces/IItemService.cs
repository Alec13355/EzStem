using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IItemService
{
    Task<PagedResponse<ItemResponse>> GetItemsAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<ItemResponse?> GetItemByIdAsync(Guid id, CancellationToken ct = default);
    Task<ItemResponse> CreateItemAsync(CreateItemRequest request, CancellationToken ct = default);
    Task<ItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request, CancellationToken ct = default);
    Task<bool> DeleteItemAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<SeasonalWarning>> GetSeasonalWarningsAsync(DateTime eventDate, CancellationToken ct = default);
}
