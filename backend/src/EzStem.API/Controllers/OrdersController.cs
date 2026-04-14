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

    [HttpPost("{id}/waste")]
    public async Task<ActionResult<WasteSummary>> RecordWaste(
        Guid id,
        [FromBody] RecordWasteRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var summary = await _orderService.CalculateWasteAsync(id, request.ActualStemsUsed, ct);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/waste")]
    public async Task<ActionResult<WasteSummary>> GetWaste(Guid id, CancellationToken ct = default)
    {
        var waste = await _orderService.GetWasteAsync(id, ct);
        if (waste == null) return NotFound();
        return Ok(waste);
    }

    [HttpGet("{id}/export/csv")]
    public async Task<ActionResult> ExportCsv(Guid id, CancellationToken ct = default)
    {
        try
        {
            var order = await _orderService.GetOrderAsync(id, ct);
            if (order == null) return NotFound();

            var csv = await _orderService.GenerateOrderCsvAsync(id, ct);
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            var eventDate = order.CreatedAt.ToString("yyyy-MM-dd");
            var fileName = $"order-{eventDate}.csv";

            return File(bytes, "text/csv", fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
