namespace EzStem.Domain.Entities;

public class EventItem
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public FloristEvent Event { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }  // what we charge the customer per unit
    public int Quantity { get; set; } = 1;  // how many of this arrangement in the event
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<EventItemFlower> RecipeFlowers { get; set; } = new List<EventItemFlower>();
}
