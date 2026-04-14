using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> GenerateOrderAsync(Guid eventId, CancellationToken ct = default);
    Task<OrderResponse?> GetOrderAsync(Guid id, CancellationToken ct = default);
    Task<PagedResponse<OrderResponse>> GetOrdersAsync(int page, int pageSize, Guid? eventId = null, CancellationToken ct = default);
}
