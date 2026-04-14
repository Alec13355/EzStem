using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<OrderResponse>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? eventId = null,
        CancellationToken ct = default)
    {
        var result = await _orderService.GetOrdersAsync(page, pageSize, eventId, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetOrder(Guid id, CancellationToken ct = default)
    {
        var order = await _orderService.GetOrderAsync(id, ct);
        if (order == null) return NotFound();
        return Ok(order);
    }
}
