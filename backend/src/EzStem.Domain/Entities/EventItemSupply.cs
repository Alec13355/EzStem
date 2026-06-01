namespace EzStem.Domain.Entities;

public class EventItemSupply
{
    public Guid Id { get; set; }
    public Guid EventItemId { get; set; }
    public EventItem EventItem { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal CostPerUnit { get; set; }
    public int Quantity { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
