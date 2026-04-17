using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> GenerateOrderAsync(Guid eventId, string ownerId, CancellationToken ct = default);
    Task<OrderResponse?> GetOrderAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<PagedResponse<OrderResponse>> GetOrdersAsync(int page, int pageSize, string ownerId, Guid? eventId = null, CancellationToken ct = default);
    Task<WasteSummary> CalculateWasteAsync(Guid orderId, string ownerId, decimal actualStemsUsed, CancellationToken ct = default);
    Task<WasteSummary?> GetWasteAsync(Guid orderId, string ownerId, CancellationToken ct = default);
    Task<string> GenerateOrderCsvAsync(Guid orderId, string ownerId, CancellationToken ct = default);
}
