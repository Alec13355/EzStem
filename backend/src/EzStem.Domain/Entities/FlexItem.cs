namespace EzStem.Domain.Entities;
public class FlexItem
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public FloristEvent Event { get; set; } = null!;
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal QuantityNeeded { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
