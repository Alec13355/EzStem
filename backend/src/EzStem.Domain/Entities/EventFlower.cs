namespace EzStem.Domain.Entities;

public class EventFlower
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public FloristEvent Event { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal PricePerStem { get; set; }
    public int BunchSize { get; set; } = 1;  // how many stems per bunch
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<EventItemFlower> UsedInItems { get; set; } = new List<EventItemFlower>();
}
