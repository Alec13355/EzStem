namespace EzStem.Domain.Entities;
public class Order
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public FloristEvent Event { get; set; } = null!;
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public string? OwnerId { get; set; }
    public decimal? WastePercentage { get; set; }
    public DateTime? WasteCalculationDate { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public ICollection<OrderLineItem> LineItems { get; set; } = new List<OrderLineItem>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum OrderStatus { Draft, Submitted, Confirmed, Received }
