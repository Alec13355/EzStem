using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly EzStemDbContext _context;

    public OrderService(EzStemDbContext context)
    {
        _context = context;
    }

    public async Task<OrderResponse> GenerateOrderAsync(Guid eventId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .Include(e => e.EventRecipes)
            .ThenInclude(er => er.Recipe)
            .ThenInclude(r => r.RecipeItems)
            .ThenInclude(ri => ri.Item)
            .ThenInclude(i => i.Vendor)
            .FirstOrDefaultAsync(e => e.Id == eventId, ct);

        if (evt == null)
            throw new ArgumentException("Event not found");

        var itemAggregates = new Dictionary<Guid, (Item item, decimal quantity)>();

        foreach (var eventRecipe in evt.EventRecipes)
        {
            foreach (var recipeItem in eventRecipe.Recipe.RecipeItems)
            {
                var totalQuantity = recipeItem.Quantity * eventRecipe.Quantity;

                if (itemAggregates.ContainsKey(recipeItem.ItemId))
                {
                    var current = itemAggregates[recipeItem.ItemId];
                    itemAggregates[recipeItem.ItemId] = (current.item, current.quantity + totalQuantity);
                }
                else
                {
                    itemAggregates[recipeItem.ItemId] = (recipeItem.Item, totalQuantity);
                }
            }
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Status = OrderStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        foreach (var (itemId, (item, quantityNeeded)) in itemAggregates)
        {
            var bundlesNeeded = (int)Math.Ceiling(quantityNeeded / item.BundleSize);
            var quantityOrdered = bundlesNeeded * item.BundleSize;

            var lineItem = new OrderLineItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ItemId = itemId,
                VendorId = item.VendorId,
                QuantityNeeded = quantityNeeded,
                QuantityOrdered = quantityOrdered,
                CostPerUnit = item.CostPerStem
            };

            _context.OrderLineItems.Add(lineItem);
        }

        await _context.SaveChangesAsync(ct);

        return await GetOrderAsync(order.Id, ct) ?? throw new Exception("Failed to retrieve created order");
    }

    public async Task<OrderResponse?> GetOrderAsync(Guid id, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Event)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Item)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Vendor)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null) return null;

        return MapToOrderResponse(order);
    }

    public async Task<PagedResponse<OrderResponse>> GetOrdersAsync(int page, int pageSize, Guid? eventId = null, CancellationToken ct = default)
    {
        var query = _context.Orders
            .Include(o => o.Event)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Item)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Vendor)
            .AsQueryable();

        if (eventId.HasValue)
        {
            query = query.Where(o => o.EventId == eventId.Value);
        }

        var total = await query.CountAsync(ct);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResponse<OrderResponse>(
            orders.Select(MapToOrderResponse),
            total, page, pageSize);
    }

    private OrderResponse MapToOrderResponse(Order order)
    {
        var lineItems = order.LineItems.Select(li => new OrderLineItemResponse(
            li.Id,
            li.ItemId,
            li.Item.Name,
            li.VendorId,
            li.Vendor?.Name,
            li.QuantityNeeded,
            li.QuantityOrdered,
            li.Item.BundleSize,
            (int)Math.Ceiling(li.QuantityNeeded / li.Item.BundleSize),
            li.CostPerUnit,
            li.QuantityOrdered * li.CostPerUnit
        )).ToList();

        var byVendor = lineItems
            .GroupBy(li => new { li.VendorId, li.VendorName })
            .Select(g => new VendorOrderGroup(
                g.Key.VendorId,
                g.Key.VendorName ?? "No Vendor",
                g.ToList(),
                g.Sum(li => li.LineTotalCost)
            ))
            .ToList();

        var totalCost = lineItems.Sum(li => li.LineTotalCost);

        return new OrderResponse(
            order.Id,
            order.EventId,
            order.Event.Name,
            order.Status.ToString(),
            totalCost,
            lineItems,
            byVendor,
            order.CreatedAt
        );
    }

    public async Task<WasteSummary> CalculateWasteAsync(Guid orderId, decimal actualStemsUsed, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.LineItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            throw new ArgumentException("Order not found");

        var totalStemsOrdered = order.LineItems.Sum(li => li.QuantityOrdered);
        
        if (totalStemsOrdered == 0)
            throw new ArgumentException("Cannot calculate waste for order with no items");

        var wastePercentage = (totalStemsOrdered - actualStemsUsed) / totalStemsOrdered * 100;

        order.WastePercentage = wastePercentage;
        order.WasteCalculationDate = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        var category = wastePercentage < 10 ? "Low" : wastePercentage <= 20 ? "Medium" : "High";

        return new WasteSummary(totalStemsOrdered, actualStemsUsed, wastePercentage, category);
    }

    public async Task<WasteSummary?> GetWasteAsync(Guid orderId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.LineItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null || !order.WastePercentage.HasValue)
            return null;

        var totalStemsOrdered = order.LineItems.Sum(li => li.QuantityOrdered);
        var actualStemsUsed = totalStemsOrdered - (totalStemsOrdered * order.WastePercentage.Value / 100);
        var category = order.WastePercentage.Value < 10 ? "Low" : order.WastePercentage.Value <= 20 ? "Medium" : "High";

        return new WasteSummary(totalStemsOrdered, actualStemsUsed, order.WastePercentage.Value, category);
    }

    public async Task<string> GenerateOrderCsvAsync(Guid orderId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Event)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Item)
            .Include(o => o.LineItems)
            .ThenInclude(li => li.Vendor)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            throw new ArgumentException("Order not found");

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Vendor,Item,BundleSize,BundlesOrdered,TotalStems,UnitCost,TotalCost");

        var lineItems = order.LineItems
            .OrderBy(li => li.Vendor?.Name ?? "No Vendor")
            .ThenBy(li => li.Item.Name)
            .ToList();

        decimal grandTotal = 0;

        foreach (var lineItem in lineItems)
        {
            var vendorName = lineItem.Vendor?.Name ?? "No Vendor";
            var itemName = lineItem.Item.Name;
            var bundleSize = lineItem.Item.BundleSize;
            var bundlesOrdered = (int)Math.Ceiling(lineItem.QuantityNeeded / bundleSize);
            var totalStems = lineItem.QuantityOrdered;
            var unitCost = lineItem.CostPerUnit;
            var totalCost = lineItem.QuantityOrdered * lineItem.CostPerUnit;
            grandTotal += totalCost;

            csv.AppendLine($"\"{vendorName}\",\"{itemName}\",{bundleSize},{bundlesOrdered},{totalStems},${unitCost:F2},${totalCost:F2}");
        }

        csv.AppendLine($"TOTAL,,,,,,${grandTotal:F2}");

        return csv.ToString();
    }
}
