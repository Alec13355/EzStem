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

        // Include flex items — direct stem additions outside recipes
        var flexItems = await _context.FlexItems
            .Include(f => f.Item)
            .ThenInclude(i => i.Vendor)
            .Where(f => f.EventId == eventId)
            .ToListAsync(ct);

        foreach (var flexItem in flexItems)
        {
            if (itemAggregates.ContainsKey(flexItem.ItemId))
            {
                var current = itemAggregates[flexItem.ItemId];
                itemAggregates[flexItem.ItemId] = (current.item, current.quantity + flexItem.QuantityNeeded);
            }
            else
            {
                itemAggregates[flexItem.ItemId] = (flexItem.Item, flexItem.QuantityNeeded);
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
            order.WastePercentage,
            order.WasteCalculationDate,
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

        if (actualStemsUsed < 0 || actualStemsUsed > totalStemsOrdered)
            throw new ArgumentException("actualStemsUsed must be between 0 and total stems ordered");

        var wastePercentage = (totalStemsOrdered - actualStemsUsed) / totalStemsOrdered * 100;

        order.WastePercentage = wastePercentage;
        order.WasteCalculationDate = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        var category = wastePercentage < 10 ? "Low" : wastePercentage <= 20 ? "Medium" : "High";
        var (suggestions, multiplier) = GetOptimizationSuggestions(wastePercentage);

        return new WasteSummary(totalStemsOrdered, actualStemsUsed, wastePercentage, category, suggestions, multiplier);
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
        var (suggestions, multiplier) = GetOptimizationSuggestions(order.WastePercentage.Value);

        return new WasteSummary(totalStemsOrdered, actualStemsUsed, order.WastePercentage.Value, category, suggestions, multiplier);
    }

    private static (IEnumerable<string> suggestions, decimal multiplier) GetOptimizationSuggestions(decimal wastePercentage)
    {
        var pct = $"{wastePercentage:0.##}";

        if (wastePercentage > 30)
            return (new[]
            {
                $"You had {pct}% waste — consider ordering 20% fewer stems next time.",
                "Review your recipe quantities — they may be set too high."
            }, 0.75m);

        if (wastePercentage > 20)
            return (new[]
            {
                $"You had {pct}% waste — try ordering 15% fewer stems next time."
            }, 0.82m);

        if (wastePercentage >= 10)
            return (new[]
            {
                $"Minor waste ({pct}%). Consider reducing orders by 10% for leaner buying."
            }, 0.90m);

        if (wastePercentage >= 5)
            return (new[]
            {
                "Good efficiency! A small 5% buffer reduction could save costs."
            }, 0.95m);

        return (new[]
        {
            "Excellent efficiency — you're using nearly everything you order."
        }, 1.0m);
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
