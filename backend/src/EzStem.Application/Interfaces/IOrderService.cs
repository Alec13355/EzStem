using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> GenerateOrderAsync(Guid eventId, CancellationToken ct = default);
    Task<OrderResponse?> GetOrderAsync(Guid id, CancellationToken ct = default);
    Task<PagedResponse<OrderResponse>> GetOrdersAsync(int page, int pageSize, Guid? eventId = null, CancellationToken ct = default);
    Task<WasteSummary> CalculateWasteAsync(Guid orderId, decimal actualStemsUsed, CancellationToken ct = default);
    Task<WasteSummary?> GetWasteAsync(Guid orderId, CancellationToken ct = default);
    Task<string> GenerateOrderCsvAsync(Guid orderId, CancellationToken ct = default);
}
